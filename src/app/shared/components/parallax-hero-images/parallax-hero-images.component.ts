import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
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
  readonly isGrowImage: boolean;
}

interface GrowRect {
  readonly top: number;
  readonly left: number;
  readonly width: number;
  readonly height: number;
}

// The hero's centered text block (max-width 760px) sits vertically centered
// too, so the top/bottom rows are pushed well clear of its ~25%-75% band,
// and every row is pulled out horizontally so it can't reach the text. Used
// at 1280px and above; below that, POSITION_STYLES_STACKED takes over.
const POSITION_STYLES: Record<ParallaxPosition, ParallaxPositionStyle> = {
  'top-left': { top: '14%', left: '10%' },
  'top-right': { top: '14%', right: '10%' },
  'mid-left': { top: '47%', left: '8%' },
  'mid-right': { top: '47%', right: '8%' },
  'bottom-left': { top: '80%', left: '10%' },
  'bottom-right': { top: '80%', right: '10%' },
  'far-left': { top: '60%', left: '16%' },
  'far-right': { top: '60%', right: '16%' },
};

// Below 1280px the desktop left/right spread has no safe gap left around the
// centered hero text, so images are regrouped into two horizontal rows —
// three above the text, three below — instead of being hidden entirely.
const POSITION_STYLES_STACKED: Record<ParallaxPosition, ParallaxPositionStyle> = {
  'top-left': { top: '14%', left: '12%' },
  'top-right': { top: '14%', left: '50%' },
  'mid-left': { top: '14%', left: '88%' },
  'mid-right': { top: '82%', left: '12%' },
  'bottom-left': { top: '82%', left: '50%' },
  'bottom-right': { top: '82%', left: '88%' },
  'far-left': { top: '14%', left: '50%' },
  'far-right': { top: '82%', left: '50%' },
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

const GROW_START_BORDER_RADIUS_PX = 8;
// First half of the scroll range: the image slides to the exact viewport
// center at its normal (unchanged) size. Only past this point does it start
// growing — from that centered point outward — up to fullscreen.
const GROW_CENTER_PHASE_END = 0.5;
// How much of the scroll range still lets the mouse-parallax jitter show
// through before the deliberate centering motion fully takes over.
const GROW_JITTER_FADE_RANGE = 0.15;

function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}

function smoothstep(t: number): number {
  const clamped = Math.max(0, Math.min(1, t));
  return clamped * clamped * (3 - 2 * clamped);
}

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
  // When set, this image detaches from the parallax layer as soon as the
  // page scrolls and grows into a fullscreen fixed overlay in its place —
  // handing off to the next section's own fixed background once fully grown.
  readonly growImage = input<string | null>(null);

  private readonly elementRef: ElementRef<HTMLElement> = inject(ElementRef);

  protected readonly entranceDuration = ENTRANCE_DURATION_SECONDS;
  protected readonly visible = signal(false);

  private readonly growProgress = signal(0);
  // `growProgress` reaches 1 after one viewport-height of scroll (the
  // move-then-grow motion). The clone then holds at fullscreen — while
  // `.apc-hero-pin` keeps the hero pinned for whatever it layers on top
  // next (see hero.component.ts), and later while the hero scrolls away
  // for real underneath — until scrolled fully past the pin's whole height,
  // by which point the next section's real content already fully covers
  // the viewport, so unmounting the clone at that exact point is invisible
  // (no opacity fade needed, which would otherwise briefly expose whatever
  // — different — content is still behind it).
  private readonly growCloneActive = signal(true);
  private readonly growAnchorRect = signal<GrowRect | null>(null);
  private readonly viewportSize = signal({ width: 0, height: 0 });

  private readonly growItemDepth = computed(() => {
    const growSrc = this.growImage();
    if (!growSrc) {
      return 0;
    }
    return this.baseItems().find((item) => item.src === growSrc)?.depth ?? 0;
  });

  protected readonly growStyle = computed<Record<string, string> | null>(() => {
    const anchor = this.growAnchorRect();
    if (!anchor || !this.growCloneActive()) {
      return null;
    }

    const progress = this.growProgress();
    const { width: viewportWidth, height: viewportHeight } = this.viewportSize();

    // Phase 1 (0 → GROW_CENTER_PHASE_END): slide the anchor's own center
    // point to the viewport's center, size untouched. Phase 2 (the rest):
    // size grows from the anchor's size up to fullscreen, expanding evenly
    // around that now-centered point rather than from a corner.
    const moveProgress = smoothstep(Math.min(progress / GROW_CENTER_PHASE_END, 1));
    const growthProgress = smoothstep(
      Math.max((progress - GROW_CENTER_PHASE_END) / (1 - GROW_CENTER_PHASE_END), 0),
    );

    const anchorCenterX = anchor.left + anchor.width / 2;
    const anchorCenterY = anchor.top + anchor.height / 2;
    const centerX = lerp(anchorCenterX, viewportWidth / 2, moveProgress);
    const centerY = lerp(anchorCenterY, viewportHeight / 2, moveProgress);

    const width = lerp(anchor.width, viewportWidth, growthProgress);
    const height = lerp(anchor.height, viewportHeight, growthProgress);
    const borderRadius = lerp(GROW_START_BORDER_RADIUS_PX, 0, growthProgress);

    // Same mouse-follow spring offset the sibling images get, faded out
    // over the first stretch of scroll so it doesn't fight the deliberate
    // centering motion once that takes over.
    const jitterFade = 1 - smoothstep(Math.min(progress / GROW_JITTER_FADE_RANGE, 1));
    const depth = this.growItemDepth();
    const jitterX = this.smoothX() * MAX_OFFSET_PX * depth * jitterFade;
    const jitterY = this.smoothY() * MAX_OFFSET_PX * depth * jitterFade;

    return {
      top: `${centerY - height / 2}px`,
      left: `${centerX - width / 2}px`,
      width: `${width}px`,
      height: `${height}px`,
      'border-radius': `${borderRadius}px`,
      transform: `translate3d(${jitterX}px, ${jitterY}px, 0)`,
    };
  });

  // Mirrors the `.apc-parallax` breakpoint below — true means the stacked
  // (3 above / 3 below) mobile layout is active instead of the desktop
  // left/right spread.
  private readonly stackedLayout = signal(false);

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
    const styles = this.stackedLayout() ? POSITION_STYLES_STACKED : POSITION_STYLES;

    return this.images()
      .slice(0, 8)
      .map((src, index) => {
        const style = styles[POSITION_ORDER[index]];

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
    const growImage = this.growImage();

    return this.baseItems().map((item) => ({
      ...item,
      zIndex: Math.round(item.depth * 10),
      isGrowImage: item.src === growImage,
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

      const measureGrowAnchor = (): void => {
        if (!this.growImage()) {
          return;
        }
        const anchorEl = this.elementRef.nativeElement.querySelector<HTMLElement>('[data-grow-anchor]');
        if (!anchorEl) {
          return;
        }
        const rect = anchorEl.getBoundingClientRect();
        this.growAnchorRect.set({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
      };

      const stackedQuery = window.matchMedia('(max-width: 1279px)');
      this.stackedLayout.set(stackedQuery.matches);
      const onStackedChange = (event: MediaQueryListEvent): void => {
        this.stackedLayout.set(event.matches);
        // The anchor's position map (spread vs. stacked) just swapped —
        // wait for that new layout to paint before re-measuring it.
        requestAnimationFrame(measureGrowAnchor);
      };
      stackedQuery.addEventListener('change', onStackedChange);

      let scrollTicking = false;
      const updateGrowProgress = (): void => {
        scrollTicking = false;
        // `.apc-hero-pin` is the outer wrapper (see hero.component.css for
        // its total height and phase breakdown); `.apc-hero` itself is
        // pinned (`position: sticky`) inside it for as long as that budget
        // allows, so the hero never actually scrolls while this plays out.
        // The move-then-grow motion always completes after exactly one
        // viewport-height of scroll, regardless of how much further pin
        // budget follows (e.g. hero.component.ts's own text crossfade,
        // layered on top once this reaches fullscreen — no dead scroll in
        // between since that phase starts immediately where this one ends).
        const pinEl = this.elementRef.nativeElement.closest<HTMLElement>('.apc-hero-pin');
        if (!pinEl) {
          return;
        }
        const rect = pinEl.getBoundingClientRect();
        const scrolledIntoPin = -rect.top;
        const motionDistance = window.innerHeight;
        const motionProgress = Math.max(0, Math.min(1, scrolledIntoPin / motionDistance));
        this.growProgress.set(motionProgress);

        // Only unmount once scrolled fully past the pin's whole height — by
        // then the hero has scrolled away and the next section's real
        // content already fully covers the viewport, so removing the clone
        // at that exact point is invisible.
        this.growCloneActive.set(scrolledIntoPin < pinEl.offsetHeight);
      };
      const onScroll = (): void => {
        if (!scrollTicking) {
          scrollTicking = true;
          requestAnimationFrame(updateGrowProgress);
        }
      };
      const onResize = (): void => {
        this.viewportSize.set({ width: window.innerWidth, height: window.innerHeight });
        measureGrowAnchor();
      };

      if (this.growImage()) {
        this.viewportSize.set({ width: window.innerWidth, height: window.innerHeight });
        // Deferred a frame: `stackedLayout` was just set above, but that
        // signal write hasn't reached the DOM yet, so the anchor element is
        // still laid out at its previous (possibly desktop) position.
        requestAnimationFrame(measureGrowAnchor);
        updateGrowProgress();
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onResize, { passive: true });
      }

      destroyRef.onDestroy(() => {
        window.removeEventListener('mousemove', onMouseMove);
        stackedQuery.removeEventListener('change', onStackedChange);
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onResize);
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
