import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  afterNextRender,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';

type ParallaxPosition =
  | 'top-left'
  | 'top-right'
  | 'mid-left'
  | 'mid-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'far-left'
  | 'far-right';

export type ParallaxVariant = 'default' | 'edge-focus';

interface ParallaxPositionStyle {
  readonly top: string;
  readonly left?: string;
  readonly right?: string;
}

interface ParallaxBaseItem {
  readonly src: string;
  readonly top: string;
  readonly left: string | null;
  readonly right: string | null;
  readonly depth: number;
  readonly delaySeconds: number;
}

interface ParallaxRenderItem extends ParallaxBaseItem {
  readonly zIndex: number;
  readonly transform: string;
}

const POSITION_STYLES: Record<ParallaxPosition, ParallaxPositionStyle> = {
  'top-left': { top: '8%', left: '4%' },
  'top-right': { top: '8%', right: '4%' },
  'mid-left': { top: '38%', left: '6%' },
  'mid-right': { top: '38%', right: '6%' },
  'bottom-left': { top: '68%', left: '4%' },
  'bottom-right': { top: '68%', right: '4%' },
  'far-left': { top: '52%', left: '2%' },
  'far-right': { top: '52%', right: '2%' },
};

const POSITION_ORDER: readonly ParallaxPosition[] = [
  'top-left',
  'top-right',
  'mid-left',
  'mid-right',
  'bottom-left',
  'bottom-right',
  'far-left',
  'far-right',
];

const DEPTH_VALUES_BY_VARIANT: Record<ParallaxVariant, readonly number[]> = {
  default: [0.3, 0.35, 0.9, 0.85, 0.4, 0.45, 0.25, 0.2],
  'edge-focus': [0.85, 0.9, 0.3, 0.35, 0.8, 0.85, 0.4, 0.45],
};

// Mirrors Framer Motion's default spring `{ damping: 25, stiffness: 120 }`
// used by the original React component, integrated by hand (semi-implicit
// Euler) since Angular has no continuous, pointer-driven motion-value API.
const SPRING_STIFFNESS = 120;
const SPRING_DAMPING = 25;
const SPRING_MASS = 1;
const SPRING_REST_EPSILON = 0.0005;
const MAX_FRAME_DELTA_SECONDS = 0.05;
const MAX_OFFSET_PX = 40;

const ENTRANCE_DURATION_SECONDS = 0.8;
const ENTRANCE_DELAY_STEP_SECONDS = 0.12;

@Component({
  selector: 'app-parallax-hero-images',
  standalone: true,
  templateUrl: './parallax-hero-images.component.html',
  styleUrl: './parallax-hero-images.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParallaxHeroImagesComponent {
  readonly images = input.required<readonly string[]>();
  readonly variant = input<ParallaxVariant>('default');
  readonly imageClass = input('');

  protected readonly entranceDuration = ENTRANCE_DURATION_SECONDS;
  protected readonly visible = signal(false);

  // Sizing intentionally smaller than the original source (which felt too
  // large/imposing on this site). Images are centered on their anchor point
  // (see `items` below) so shrinking them never widens the gaps between
  // them. Tailwind v4 is already configured on this project; dark-mode
  // variants are dropped since the site has no dark theme.
  private static readonly BASE_IMG_CLASSES =
    'apc-parallax-img aspect-4/3 h-12 w-16 rounded-lg object-cover shadow-sm ring-1 ring-black/10 sm:h-20 sm:w-28 md:h-28 md:w-40';

  protected readonly imgClasses = computed(() =>
    [ParallaxHeroImagesComponent.BASE_IMG_CLASSES, this.imageClass()].filter(Boolean).join(' '),
  );

  // Raw (unsmoothed) normalized pointer position in [-1, 1] on each axis.
  private readonly targetX = signal(0);
  private readonly targetY = signal(0);

  // Spring-smoothed position driving the actual on-screen offset.
  private readonly smoothX = signal(0);
  private readonly smoothY = signal(0);

  private springX = 0;
  private springVelocityX = 0;
  private springY = 0;
  private springVelocityY = 0;
  private animationFrameId: number | null = null;
  private lastFrameTime: number | null = null;

  private readonly baseItems = computed<readonly ParallaxBaseItem[]>(() => {
    const depthValues = DEPTH_VALUES_BY_VARIANT[this.variant()];

    return this.images()
      .slice(0, 8)
      .map((src, index) => {
        const style = POSITION_STYLES[POSITION_ORDER[index]];

        return {
          src,
          top: style.top,
          left: style.left ?? null,
          right: style.right ?? null,
          depth: depthValues[index],
          delaySeconds: index * ENTRANCE_DELAY_STEP_SECONDS,
        };
      });
  });

  protected readonly items = computed<readonly ParallaxRenderItem[]>(() => {
    const x = this.smoothX();
    const y = this.smoothY();

    return this.baseItems().map((item) => ({
      ...item,
      zIndex: Math.round(item.depth * 10),
      // `translate(-50%, -50%)` centers the (now smaller) image on its
      // top/left/right anchor point instead of anchoring by its corner —
      // otherwise shrinking the image would visibly widen the gaps
      // between images. The parallax offset is then layered on top.
      transform: `translate(-50%, -50%) translate3d(${x * MAX_OFFSET_PX * item.depth}px, ${y * MAX_OFFSET_PX * item.depth}px, 0)`,
    }));
  });

  private readonly stepSpring = (time: number): void => {
    const previousTime = this.lastFrameTime ?? time;
    const dt = Math.min((time - previousTime) / 1000, MAX_FRAME_DELTA_SECONDS);
    this.lastFrameTime = time;

    const settledX = this.integrateAxis('x', this.targetX(), dt);
    const settledY = this.integrateAxis('y', this.targetY(), dt);

    this.smoothX.set(this.springX);
    this.smoothY.set(this.springY);

    if (settledX && settledY) {
      this.animationFrameId = null;
      this.lastFrameTime = null;
      return;
    }

    this.animationFrameId = requestAnimationFrame(this.stepSpring);
  };

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const onMouseMove = (event: MouseEvent): void => {
        this.targetX.set((event.clientX / window.innerWidth) * 2 - 1);
        this.targetY.set((event.clientY / window.innerHeight) * 2 - 1);
        this.ensureSpringLoopRunning();
      };

      window.addEventListener('mousemove', onMouseMove, { passive: true });

      destroyRef.onDestroy(() => {
        window.removeEventListener('mousemove', onMouseMove);
        if (this.animationFrameId !== null) {
          cancelAnimationFrame(this.animationFrameId);
        }
      });

      // Paint the initial (blurred / scaled-down) state first, then flip
      // `visible` on the next frame so the CSS transition actually runs.
      requestAnimationFrame(() => this.visible.set(true));
    });
  }

  private ensureSpringLoopRunning(): void {
    if (this.animationFrameId !== null) {
      return;
    }
    this.lastFrameTime = null;
    this.animationFrameId = requestAnimationFrame(this.stepSpring);
  }

  private integrateAxis(axis: 'x' | 'y', target: number, dt: number): boolean {
    const position = axis === 'x' ? this.springX : this.springY;
    const velocity = axis === 'x' ? this.springVelocityX : this.springVelocityY;

    const springForce = -SPRING_STIFFNESS * (position - target);
    const dampingForce = -SPRING_DAMPING * velocity;
    const acceleration = (springForce + dampingForce) / SPRING_MASS;

    const nextVelocity = velocity + acceleration * dt;
    const nextPosition = position + nextVelocity * dt;

    if (axis === 'x') {
      this.springX = nextPosition;
      this.springVelocityX = nextVelocity;
    } else {
      this.springY = nextPosition;
      this.springVelocityY = nextVelocity;
    }

    return (
      Math.abs(nextVelocity) < SPRING_REST_EPSILON && Math.abs(nextPosition - target) < SPRING_REST_EPSILON
    );
  }
}
