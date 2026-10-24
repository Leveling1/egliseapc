import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  OnInit,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { FooterComponent } from '../../../core/layout/footer/footer.component';
import { HeaderComponent } from '../../../core/layout/header/header.component';
import { PublicContentService } from '../../../core/content/public-content.service';
import { SeoService } from '../../../core/seo/seo.service';
import {
  ParallaxGalleryComponent,
  type GalleryPhoto,
} from '../../../shared/components/parallax-gallery/parallax-gallery.component';

@Component({
  selector: 'app-gallery-lot-page',
  standalone: true,
  imports: [RouterLink, HeaderComponent, FooterComponent, ParallaxGalleryComponent],
  templateUrl: './gallery-lot-page.component.html',
  styleUrl: './gallery-lot-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GalleryLotPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly content = inject(PublicContentService);
  private readonly seo = inject(SeoService);

  protected readonly photos = signal<readonly GalleryPhoto[]>([]);
  protected readonly caption = signal<string | null>(null);
  protected readonly isUncaptionedLot = signal(false);
  protected readonly lotIsValid = signal(false);
  protected readonly total = signal(0);
  protected readonly loadingInitial = signal(true);
  protected readonly loadingMore = signal(false);
  protected readonly loadError = signal(false);
  protected readonly hasMore = computed(() => this.photos().length < this.total());
  protected readonly skeletons = [260, 340, 220, 300, 240, 360, 280, 230, 320];
  protected readonly title = computed(() =>
    this.isUncaptionedLot() ? 'Photos sans légende' : this.caption() ?? 'Lot de photos',
  );
  private requestId = 0;
  private currentPage = 0;
  private loadingRequest = false;

  constructor() {
    afterNextRender(() => {
      const sentinel = (this.elementRef.nativeElement as HTMLElement).querySelector(
        '.apc-gallery-lot__sentinel',
      );
      if (!sentinel || typeof IntersectionObserver === 'undefined') return;

      const observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) void this.loadNextPage();
        },
        { rootMargin: '700px 0px' },
      );
      observer.observe(sentinel);
      this.destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const caption = params.get('legende');
      const isUncaptionedLot = params.get('sans-legende') === '1';
      this.requestId += 1;
      this.currentPage = 0;
      this.loadingRequest = false;
      this.caption.set(caption);
      this.isUncaptionedLot.set(isUncaptionedLot);
      this.lotIsValid.set(isUncaptionedLot || caption !== null);
      this.photos.set([]);
      this.total.set(0);
      this.loadError.set(false);

      if (!isUncaptionedLot && caption === null) {
        this.loadingInitial.set(false);
        this.loadingMore.set(false);
        return;
      }

      this.applySeo(caption, isUncaptionedLot);
      void this.loadNextPage();
    });
  }

  protected retryLoading(): void {
    this.loadError.set(false);
    void this.loadNextPage();
  }

  private async loadNextPage(): Promise<void> {
    if (this.loadingRequest || this.loadError() || (!this.hasMore() && this.currentPage > 0)) return;

    const requestId = this.requestId;
    this.loadingRequest = true;
    this.loadError.set(false);
    const initialLoad = this.currentPage === 0;
    if (initialLoad) this.loadingInitial.set(true);
    else this.loadingMore.set(true);

    try {
      const nextPage = this.currentPage + 1;
      const { photos, total } = await this.content.galleryPhotos({
        page: nextPage,
        caption: this.isUncaptionedLot() ? null : this.caption(),
      });

      if (requestId !== this.requestId) return;

      this.photos.update((current) => [
        ...current,
        ...photos.map((photo) => ({
          src: photo.url,
          width: photo.width,
          height: photo.height,
          alt: photo.alt ?? '',
          caption: photo.caption ?? undefined,
        })),
      ]);
      this.total.set(total);
      this.currentPage = nextPage;
    } catch {
      if (requestId === this.requestId) this.loadError.set(true);
    } finally {
      if (requestId === this.requestId) {
        this.loadingRequest = false;
        this.loadingInitial.set(false);
        this.loadingMore.set(false);
      }
    }
  }

  private applySeo(caption: string | null, isUncaptionedLot: boolean): void {
    const title = isUncaptionedLot
      ? 'Photos de la communauté'
      : `Photos : ${caption ?? 'Galerie A.P.C'}`;
    const query = isUncaptionedLot
      ? 'sans-legende=1'
      : `legende=${encodeURIComponent(caption ?? '')}`;

    this.seo.apply({
      title: `${title} | Galerie A.P.C`,
      description: isUncaptionedLot
        ? 'Découvrez une sélection de photos de la communauté des Ambassadeurs pour Christ.'
        : `Découvrez les photos de « ${caption} », partagées par les Ambassadeurs pour Christ.`,
      path: `/galerie/lot?${query}`,
    });
  }
}
