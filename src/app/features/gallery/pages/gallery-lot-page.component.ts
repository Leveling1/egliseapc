import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { FooterComponent } from '../../../core/layout/footer/footer.component';
import { HeaderComponent } from '../../../core/layout/header/header.component';
import { PublicContentService, GALLERY_PAGE_SIZE } from '../../../core/content/public-content.service';
import { SeoService } from '../../../core/seo/seo.service';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import {
  ParallaxGalleryComponent,
  type GalleryPhoto,
} from '../../../shared/components/parallax-gallery/parallax-gallery.component';

@Component({
  selector: 'app-gallery-lot-page',
  standalone: true,
  imports: [RouterLink, HeaderComponent, FooterComponent, ParallaxGalleryComponent, PaginationComponent],
  templateUrl: './gallery-lot-page.component.html',
  styleUrl: './gallery-lot-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GalleryLotPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly content = inject(PublicContentService);
  private readonly seo = inject(SeoService);

  protected readonly photos = signal<readonly GalleryPhoto[]>([]);
  protected readonly caption = signal<string | null>(null);
  protected readonly isUncaptionedLot = signal(false);
  protected readonly lotIsValid = signal(false);
  protected readonly page = signal(1);
  protected readonly total = signal(0);
  protected readonly loading = signal(true);
  protected readonly skeletons = [260, 340, 220, 300, 240, 360, 280, 230, 320];
  protected readonly title = computed(() =>
    this.isUncaptionedLot() ? 'Photos sans légende' : this.caption() ?? 'Lot de photos',
  );
  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.total() / GALLERY_PAGE_SIZE)),
  );

  private requestId = 0;

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const caption = params.get('legende');
      const isUncaptionedLot = params.get('sans-legende') === '1';
      this.caption.set(caption);
      this.isUncaptionedLot.set(isUncaptionedLot);
      this.lotIsValid.set(isUncaptionedLot || caption !== null);
      this.page.set(1);

      if (!isUncaptionedLot && caption === null) {
        this.requestId += 1;
        this.photos.set([]);
        this.total.set(0);
        this.loading.set(false);
        return;
      }

      this.applySeo(caption, isUncaptionedLot);
      void this.load(caption, isUncaptionedLot, 1);
    });
  }

  protected async goToPage(page: number): Promise<void> {
    this.page.set(page);
    await this.load(this.caption(), this.isUncaptionedLot(), page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private async load(caption: string | null, isUncaptionedLot: boolean, page: number): Promise<void> {
    const requestId = ++this.requestId;
    this.loading.set(true);

    const { photos, total } = await this.content.galleryPhotos({
      page,
      caption: isUncaptionedLot ? null : caption,
    });

    if (requestId !== this.requestId) return;

    this.photos.set(
      photos.map((photo) => ({
        src: photo.url,
        width: photo.width,
        height: photo.height,
        alt: photo.alt ?? '',
        caption: photo.caption ?? undefined,
      })),
    );
    this.total.set(total);
    this.loading.set(false);
  }

  private applySeo(caption: string | null, isUncaptionedLot: boolean): void {
    const title = isUncaptionedLot ? 'Photos sans légende' : caption ?? 'Photos';
    const query = isUncaptionedLot
      ? 'sans-légende=1'
      : `legende=${encodeURIComponent(caption ?? '')}`;

    this.seo.apply({
      title: `${title} | Galerie A.P.C`,
      description: isUncaptionedLot
        ? 'Découvrez les photos de la galerie A.P.C.'
        : `Découvrez les photos du lot « ${title} » de la galerie A.P.C.`,
      path: `/galerie/lot?${query}`,
    });
  }
}
