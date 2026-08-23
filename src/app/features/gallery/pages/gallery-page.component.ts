import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';

import { FooterComponent } from '../../../core/layout/footer/footer.component';
import { HeaderComponent } from '../../../core/layout/header/header.component';
import { SeoService } from '../../../core/seo/seo.service';
import {
  ParallaxGalleryComponent,
  type GalleryPhoto,
} from '../../../shared/components/parallax-gallery/parallax-gallery.component';
import { GALLERY_PHOTOS } from '../data/gallery-photos';

/**
 * Photos de la galerie.
 *
 * La liste et les dimensions sont relevées au build par
 * `scripts/generate-gallery-photos.mjs` : le mur conserve les proportions de
 * chaque photo, et il lui faut donc les connaître avant l'affichage. Chaque
 * photo n'apparaît qu'une fois — dans un mur, une répétition se remarque
 * aussitôt, là où les rangées glissantes d'avant la dissimulaient.
 *
 * Les descriptions restent vides : ces photos n'ont pas été décrites, et
 * inventer un texte identique sur les douze rendrait la page plus pénible à
 * parcourir au lecteur d'écran, pas moins. Le titre et le chapô portent seuls
 * le sens.
 */
const PHOTOS: readonly GalleryPhoto[] = GALLERY_PHOTOS;

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
