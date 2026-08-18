/**
 * Identité du site, centralisée pour le référencement.
 *
 * Ces valeurs se retrouvent dans les balises de partage, les données
 * structurées et les URL canoniques. Les rassembler ici évite qu'une adresse
 * ou un nom diverge d'une page à l'autre — ce qui brouillerait justement le
 * signal envoyé aux moteurs de recherche.
 */

/** Domaine de production, sans barre oblique finale. */
export const SITE_URL = 'https://egliseapc.levelingcoder.com';

export const SITE_NAME = 'Ambassadeurs Pour Christ (A.P.C)';

/** Nom complet, tel qu'il doit apparaître dans les résultats de recherche. */
export const ORGANIZATION_NAME = 'Église Les Ambassadeurs Pour Christ';

export const ORGANIZATION_ALTERNATE_NAMES = [
  'A.P.C',
  'APC',
  'Église APC',
  'Ambassadeurs Pour Christ',
  'Les Ambassadeurs Pour Christ',
  'Rassemblement des Aigles',
  'RDA',
];

/** Image de partage par défaut, au format 1200 × 630. */
export const DEFAULT_SHARE_IMAGE = '/images/og-cover.jpg';

/**
 * Coordonnées du siège. Les autres implantations vivent dans la table des
 * extensions et alimentent les données structurées : Kinshasa est le siège,
 * pas le périmètre de l'église.
 */
export const CONTACT = {
  streetAddress: 'Av. Luzandi n°05, Q/Pigeon',
  addressLocality: 'Kinshasa',
  addressRegion: 'Ngaliema',
  addressCountry: 'CD',
  phones: ['+243 892 211 899', '+243 812 277 291'],
} as const;

/**
 * Profils officiels. Renseignés dans `sameAs`, ils permettent à Google de
 * relier le site aux comptes de l'église et de consolider son identité.
 */
export const SOCIAL_PROFILES = [
  'https://www.facebook.com/egliseapc',
  'https://www.youtube.com/@apc-kinshasa',
  'https://www.instagram.com/egliseapc',
];

/** Construit une URL absolue à partir d'un chemin du site. */
export function absoluteUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
