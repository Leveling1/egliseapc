import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';

import { FooterComponent } from '../../../core/layout/footer/footer.component';
import { HeaderComponent } from '../../../core/layout/header/header.component';
import { SeoService } from '../../../core/seo/seo.service';
import {
  ParallaxGalleryComponent,
  type GalleryPhoto,
} from '../../../shared/components/parallax-gallery/parallax-gallery.component';

/**
 * Photos de la galerie.
 *
 * Les fichiers disponibles à ce jour sont ceux du carrousel de la page
 * d'accueil. La galerie en demande quinze et n'en trouve que douze : les trois
 * dernières places sont comblées par répétition, faute de quoi une rangée
 * serait plus courte que les autres — ce qui se voit aussitôt, puisqu'elles
 * glissent côte à côte. Déposer d'autres fichiers dans `public/images/` et les
 * ajouter ici suffit à supprimer la répétition.
 *
 * Les descriptions sont vides : ces photos n'ont pas été décrites, et inventer
 * un texte de remplacement identique sur les douze rendrait la page plus
 * pénible à parcourir au lecteur d'écran, pas moins. Le titre et le chapô de
 * la page portent seuls le sens.
 */
const PHOTOS: readonly GalleryPhoto[] = Array.from({ length: 12 }, (_, index) => ({
  src: `/images/home/hero_${index + 1}.jpg`,
  alt: '',
}));

@Component({
  selector: 'app-gallery-page',
  standalone: true,
  imports: [HeaderComponent, FooterComponent, ParallaxGalleryComponent],
  templateUrl: './gallery-page.component.html',
  styleUrl: './gallery-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GalleryPageComponent implements OnInit {
  private readonly seo = inject(SeoService);

  protected readonly photos = PHOTOS;

  ngOnInit(): void {
    this.seo.apply({
      title: 'Galerie photos | Ambassadeurs Pour Christ (A.P.C)',
      description:
        "Les moments de la vie de l'Église Les Ambassadeurs Pour Christ (A.P.C) en images : cultes, Rassemblement des Aigles et rencontres, à Kinshasa comme dans toutes les extensions.",
      path: '/galerie',
    });
  }
}
