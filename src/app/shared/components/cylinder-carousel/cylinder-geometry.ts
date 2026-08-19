/**
 * Géométrie du carrousel cylindrique.
 *
 * Isolée du composant et sans dépendance au DOM, pour être vérifiable
 * directement : c'est ce calcul, et non le CSS, qui décide de l'allure du
 * cylindre.
 *
 * Le principe : au lieu de fixer une taille de carte et de subir le rayon
 * qui en découle, on part du conteneur. Le rayon est choisi pour que la
 * silhouette du cylindre occupe toute la place disponible, puis le nombre de
 * cartes s'en déduit — et non l'inverse.
 */

export type CylinderAxis = 'horizontal' | 'vertical';

export interface CylinderGeometry {
  /** Nombre de cartes nécessaires pour fermer le cylindre. */
  readonly count: number;
  readonly radius: number;
  readonly perspective: number;
  /** Angle entre deux cartes voisines, en degrés. */
  readonly stepAngle: number;
  readonly cardWidth: number;
  readonly cardHeight: number;
  readonly axis: CylinderAxis;
}

export interface CylinderInput {
  readonly containerWidth: number;
  readonly containerHeight: number;
  readonly axis: CylinderAxis;
  /** Espace entre deux cartes voisines, en pixels. */
  readonly gap: number;
  /** Rapport largeur / hauteur d'une carte. */
  readonly aspectRatio: number;
}

/**
 * Part de la dimension disponible occupée par le rayon.
 *
 * À 0,46, la silhouette du cylindre (2 × rayon) couvre 92 % de la largeur, et
 * les cartes des bords, vues presque de profil, achèvent de remplir le cadre.
 */
const RADIUS_RATIO = 0.46;

/** Taille d'une carte, en proportion de la dimension disponible. */
const CARD_RATIO = 0.19;
const CARD_MIN = 132;
const CARD_MAX = 260;

/**
 * Distance de l'œil, en multiple du rayon.
 *
 * C'est le réglage qui manquait. Avec une perspective fixe, agrandir le rayon
 * rapproche la paroi du cylindre de l'œil : les cartes de devant deviennent
 * énormes et l'on ne voit plus une paroi courbe mais des images qui foncent
 * sur nous. En liant la distance au rayon, l'écart de taille entre la carte
 * la plus proche et la plus lointaine reste constant quelle que soit la
 * taille de l'écran.
 */
const PERSPECTIVE_RATIO = 2.8;

/** En deçà, le cylindre se réduit à quelques plaques et perd sa lecture. */
const MIN_COUNT = 8;

/**
 * Largeur des cartes en rotation verticale, en proportion de la largeur
 * disponible.
 *
 * En rotation verticale, seule la HAUTEUR des cartes participe à la géométrie
 * du cylindre : c'est elle qui les répartit autour de l'axe. La largeur est
 * donc libre — mais pas sans limite.
 *
 * La perspective agrandit les cartes de premier plan d'un facteur
 * PERSPECTIVE_RATIO / (PERSPECTIVE_RATIO − 1), soit environ 1,55. Au-delà
 * de 0,64, la carte la plus proche déborde donc de l'écran et le cylindre
 * cesse d'être lisible. 0,55 laisse une marge de chaque côté.
 */
const VERTICAL_CARD_WIDTH_RATIO = 0.55;

/**
 * Garde-fou sur les écrans larges qui basculent quand même en vertical
 * (tablette en portrait) : sans lui, les cartes deviendraient des bandeaux
 * démesurément étirés.
 */
const VERTICAL_MAX_ASPECT = 2.2;

export function cylinderGeometry(input: CylinderInput): CylinderGeometry {
  const { containerWidth, containerHeight, axis, gap, aspectRatio } = input;

  // La dimension qui compte est celle dans laquelle le cylindre tourne :
  // la largeur pour une rotation horizontale, la hauteur pour une verticale.
  const span = axis === 'horizontal' ? containerWidth : containerHeight;

  // Dimension de la carte le long de la rotation : sa largeur quand le
  // cylindre tourne horizontalement, sa hauteur quand il tourne verticalement.
  const extent = Math.max(CARD_MIN, Math.min(CARD_MAX, span * CARD_RATIO));
  const radius = Math.max(extent, span * RADIUS_RATIO);

  // Pour que N cartes de taille `extent` se juxtaposent sans se chevaucher
  // sur un cercle de rayon R, l'angle vu depuis l'axe vaut :
  //     demi-angle = atan((extent / 2 + espace) / R)
  const halfStep = Math.atan((extent / 2 + gap) / radius);
  const count = Math.max(MIN_COUNT, Math.round(Math.PI / halfStep));

  // En rotation horizontale, `extent` est la largeur et la hauteur en
  // découle par le rapport demandé. En rotation verticale, `extent` est la
  // hauteur — et la largeur n'a plus de contrainte géométrique.
  const cardHeight = axis === 'horizontal' ? extent / aspectRatio : extent;
  const cardWidth =
    axis === 'horizontal'
      ? extent
      : Math.min(containerWidth * VERTICAL_CARD_WIDTH_RATIO, cardHeight * VERTICAL_MAX_ASPECT);

  return {
    count,
    radius,
    perspective: radius * PERSPECTIVE_RATIO,
    stepAngle: 360 / count,
    cardWidth,
    cardHeight,
    axis,
  };
}

/** Transformation 3D d'une carte, selon son rang. */
export function cardTransform(geometry: CylinderGeometry, index: number): string {
  const angle = index * geometry.stepAngle;
  const rotation = geometry.axis === 'horizontal' ? 'rotateY' : 'rotateX';

  return `${rotation}(${angle}deg) translateZ(${-geometry.radius}px)`;
}

/**
 * Répète la liste fournie jusqu'à remplir le cylindre.
 *
 * Un cylindre incomplet laisse un trou béant qui passe devant le spectateur à
 * chaque tour ; mieux vaut répéter que trouer.
 */
export function fillCylinder<T>(source: readonly T[], count: number): T[] {
  if (source.length === 0) return [];
  return Array.from({ length: count }, (_, index) => source[index % source.length]);
}
