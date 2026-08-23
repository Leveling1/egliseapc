/**
 * Photos de la galerie, avec leurs dimensions réelles.
 *
 * FICHIER GÉNÉRÉ — ne pas modifier à la main.
 * Régénérer avec : node scripts/generate-gallery-photos.mjs
 *
 * Les dimensions ne sont pas décoratives : le mur conserve les proportions de
 * chaque photo, et ce sont elles qui permettent au navigateur de réserver la
 * bonne place avant même que l'image n'arrive. Sans elles, la mise en page se
 * réorganiserait sous les yeux du visiteur au fur et à mesure des chargements.
 *
 * Pour ajouter des photos : déposer les fichiers dans public/images/galerie,
 * puis relancer le script.
 */

export interface GalleryPhotoSource {
  readonly src: string;
  /** Largeur réelle du fichier, en pixels. */
  readonly width: number;
  /** Hauteur réelle du fichier, en pixels. */
  readonly height: number;
}

export const GALLERY_PHOTOS: readonly GalleryPhotoSource[] = [
  { src: '/images/galerie/photo_2026-08-23_12-06-37.jpg', width: 853, height: 1280 },
  { src: '/images/home/hero_1.jpg', width: 1280, height: 733 },
  { src: '/images/home/hero_2.jpg', width: 1280, height: 853 },
  { src: '/images/home/hero_3.jpg', width: 1280, height: 854 },
  { src: '/images/galerie/photo_2026-08-23_12-06-42.jpg', width: 853, height: 1280 },
  { src: '/images/home/hero_4.jpg', width: 1280, height: 853 },
  { src: '/images/home/hero_5.jpg', width: 1280, height: 853 },
  { src: '/images/galerie/photo_2026-08-23_12-06-45.jpg', width: 853, height: 1280 },
  { src: '/images/home/hero_6.jpg', width: 1280, height: 853 },
  { src: '/images/home/hero_7.jpg', width: 1280, height: 853 },
  { src: '/images/home/hero_8.jpg', width: 1280, height: 854 },
  { src: '/images/galerie/photo_2026-08-23_12-06-47.jpg', width: 854, height: 1280 },
  { src: '/images/home/hero_9.jpg', width: 1280, height: 853 },
  { src: '/images/home/hero_10.jpg', width: 1280, height: 854 },
  { src: '/images/galerie/photo_2026-08-23_12-06-52.jpg', width: 854, height: 1280 },
  { src: '/images/home/hero_11.jpg', width: 1280, height: 854 },
  { src: '/images/home/hero_12.jpg', width: 1280, height: 853 },
];
