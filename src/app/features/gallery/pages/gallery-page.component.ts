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
import { RouterLink } from '@angular/router';

import { FooterComponent } from '../../../core/layout/footer/footer.component';
import { HeaderComponent } from '../../../core/layout/header/header.component';
import { SeoService } from '../../../core/seo/seo.service';
import {
  ParallaxGalleryComponent,
  type GalleryPhoto,
} from '../../../shared/components/parallax-gallery/parallax-gallery.component';
import { GALLERY_PAGE_SIZE, PublicContentService } from '../../../core/content/public-content.service';
import { SpecialEventsComponent } from '../../../shared/components/special-events/special-events.component';

@Component({
  selector: 'app-gallery-page',
  standalone: true,
  imports: [
    RouterLink,
    HeaderComponent,
    FooterComponent,
    ParallaxGalleryComponent,
    SpecialEventsComponent,
  ],
  templateUrl: './gallery-page.component.html',
  styleUrl: './gallery-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GalleryPageComponent implements OnInit {
  private readonly seo = inject(SeoService);
  private readonly content = inject(PublicContentService);
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);

  /**
   * Les photos viennent désormais de la base, non plus d'une liste écrite dans
   * le dépôt : les ajouter passe par le cpannel, sans redéploiement.
   *
   * Les descriptions restent vides tant qu'elles ne sont pas renseignées :
   * inventer un texte identique sur toutes rendrait la page plus pénible à
   * parcourir au lecteur d'écran, pas moins.
   */
  protected readonly photos = signal<readonly GalleryPhoto[]>([]);
  protected readonly total = signal(0);
  protected readonly loadingInitial = signal(true);
  protected readonly loadingMore = signal(false);
  protected readonly loadError = signal(false);
  protected readonly hasMore = computed(() => this.photos().length < this.total());
  /** Hauteurs des silhouettes du mur : des proportions de photos, pas des carrés. */
  protected readonly skeletons = [260, 340, 220, 300, 240, 360, 280, 230, 320];

  private currentPage = 0;
  private loadingRequest = false;

  constructor() {
    afterNextRender(() => {
      const sentinel = (this.elementRef.nativeElement as HTMLElement).querySelector(
        '.apc-gallery__sentinel',
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
    void this.loadNextPage();

    this.seo.apply({
      title: 'Galerie photos | Ambassadeurs pour Christ',
      description:
        'Revivez en images les cultes, le Rassemblement des Aigles et les rencontres de la communauté A.P.C à Kinshasa et dans ses extensions.',
      path: '/galerie',
    });
  }

  private async loadNextPage(): Promise<void> {
    if (this.loadingRequest || this.loadError() || (!this.hasMore() && this.currentPage > 0)) return;

    this.loadingRequest = true;
    this.loadError.set(false);
    const initialLoad = this.currentPage === 0;
    if (initialLoad) this.loadingInitial.set(true);
    else this.loadingMore.set(true);

    try {
      const nextPage = this.currentPage + 1;
      const { photos, total } = await this.content.galleryPhotos({ page: nextPage });
      const mappedPhotos = photos.map((photo) => ({
        src: photo.url,
        width: photo.width,
        height: photo.height,
        alt: photo.alt ?? '',
        caption: photo.caption ?? undefined,
      }));

      this.photos.update((current) => [...current, ...mappedPhotos]);
      this.total.set(total);
      this.currentPage = nextPage;
    } catch {
      this.loadError.set(true);
    } finally {
      this.loadingRequest = false;
      this.loadingInitial.set(false);
      this.loadingMore.set(false);
    }
  }

  protected retryLoading(): void {
    this.loadError.set(false);
    void this.loadNextPage();
  }
}
