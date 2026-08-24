import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';

import { FooterComponent } from '../../../core/layout/footer/footer.component';
import { HeaderComponent } from '../../../core/layout/header/header.component';
import { SeoService } from '../../../core/seo/seo.service';
import {
  ParallaxGalleryComponent,
  type GalleryPhoto,
} from '../../../shared/components/parallax-gallery/parallax-gallery.component';
import { GALLERY_PAGE_SIZE, PublicContentService } from '../../../core/content/public-content.service';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-gallery-page',
  standalone: true,
  imports: [HeaderComponent, FooterComponent, ParallaxGalleryComponent, PaginationComponent],
  templateUrl: './gallery-page.component.html',
  styleUrl: './gallery-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GalleryPageComponent implements OnInit {
  private readonly seo = inject(SeoService);
  private readonly content = inject(PublicContentService);

  /**
   * Les photos viennent désormais de la base, non plus d'une liste écrite dans
   * le dépôt : les ajouter passe par le cpannel, sans redéploiement.
   *
   * Les descriptions restent vides tant qu'elles ne sont pas renseignées :
   * inventer un texte identique sur toutes rendrait la page plus pénible à
   * parcourir au lecteur d'écran, pas moins.
   */
  protected readonly photos = signal<readonly GalleryPhoto[]>([]);
  protected readonly page = signal(1);
  protected readonly total = signal(0);
  protected readonly loading = signal(true);

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.total() / GALLERY_PAGE_SIZE)),
  );

  protected async goToPage(page: number): Promise<void> {
    this.page.set(page);
    await this.load();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    const { photos, total } = await this.content.galleryPhotos({ page: this.page() });

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

  ngOnInit(): void {
    void this.load();

    this.seo.apply({
      title: 'Galerie photos | Ambassadeurs Pour Christ (A.P.C)',
      description:
        "Les moments de la vie de l'Église Les Ambassadeurs Pour Christ (A.P.C) en images : cultes, Rassemblement des Aigles et rencontres, à Kinshasa comme dans toutes les extensions.",
      path: '/galerie',
    });
  }
}
