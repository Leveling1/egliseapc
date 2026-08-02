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
  viewChild,
} from '@angular/core';

export interface TimelineEntry {
  readonly year: string;
  readonly title: string;
  readonly location: string;
  readonly startDate: string;
  readonly endDate?: string;
  readonly description?: string;
  readonly image?: string;
  readonly imageAlt?: string;
  readonly link?: string;
}

// Reproduces Motion's `useScroll({ target, offset: ["start 10%", "end 50%"] })`
// by hand: progress is 0 when the container's top edge reaches 10% down the
// viewport, and 1 when its bottom edge reaches 50% down the viewport.
const SCROLL_OFFSET_START_RATIO = 0.1;
const SCROLL_OFFSET_END_RATIO = 0.5;

// Mirrors `useTransform(scrollYProgress, [0, 0.1], [0, 1])` for the fade-in.
const OPACITY_FADE_IN_RATIO = 0.1;

@Component({
  selector: 'app-timeline',
  standalone: true,
  templateUrl: './timeline.component.html',
  styleUrl: './timeline.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimelineComponent {
  readonly entries = input.required<readonly TimelineEntry[]>();

  private readonly containerRef = viewChild.required<ElementRef<HTMLElement>>('container');
  private readonly trackRef = viewChild.required<ElementRef<HTMLElement>>('track');

  protected readonly trackHeight = signal(0);
  private readonly scrollProgress = signal(0);

  protected readonly lineHeightPx = computed(() => this.scrollProgress() * this.trackHeight());
  protected readonly lineOpacity = computed(() =>
    Math.min(1, Math.max(0, this.scrollProgress() / OPACITY_FADE_IN_RATIO)),
  );

  private resizeObserver: ResizeObserver | null = null;
  private recomputeScheduled = false;

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const trackEl = this.trackRef().nativeElement;

      this.trackHeight.set(trackEl.getBoundingClientRect().height);
      this.resizeObserver = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (entry) {
          this.trackHeight.set(entry.contentRect.height);
        }
      });
      this.resizeObserver.observe(trackEl);

      // Scroll/resize listeners stay attached for the component's whole
      // lifetime — recompute is rAF-throttled and just reads a bounding
      // rect, so this is cheap even while the section is off-screen, and
      // guarantees the line animation is always live once mounted.
      const onScroll = (): void => this.scheduleRecompute();
      const onResize = (): void => this.scheduleRecompute();

      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onResize, { passive: true });

      this.recomputeProgress();

      destroyRef.onDestroy(() => {
        this.resizeObserver?.disconnect();
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onResize);
      });
    });
  }

  private scheduleRecompute(): void {
    if (this.recomputeScheduled) {
      return;
    }
    this.recomputeScheduled = true;
    requestAnimationFrame(() => {
      this.recomputeScheduled = false;
      this.recomputeProgress();
    });
  }

  private recomputeProgress(): void {
    const rect = this.containerRef().nativeElement.getBoundingClientRect();
    const viewportHeight = window.innerHeight;

    const startLine = viewportHeight * SCROLL_OFFSET_START_RATIO;
    const endLine = viewportHeight * SCROLL_OFFSET_END_RATIO;
    const distance = startLine - endLine + rect.height;

    let progress: number;
    if (distance <= 0) {
      progress = rect.top <= startLine ? 1 : 0;
    } else {
      progress = (startLine - rect.top) / distance;
    }

    this.scrollProgress.set(Math.min(1, Math.max(0, progress)));
  }
}
