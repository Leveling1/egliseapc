/**
 * Mécanique du mur de photos en parallaxe.
 *
 * Transposition du composant React de référence, qui s'appuyait sur
 * `motion/react` : `useScroll` pour la progression, `useTransform` pour les
 * interpolations, `useSpring` pour l'amortissement. Rien de tout cela n'existe
 * ici, et il ne serait pas raisonnable d'importer une bibliothèque d'animation
 * React dans un projet Angular pour trois fonctions. Elles tiennent en une
 * centaine de lignes, et les avoir en clair permet de les vérifier.
 *
 * Le principe a changé depuis la première version, et c'est ce qui l'a
 * simplifié : il n'existe qu'une seule mise en page — le mur — et l'animation
 * ne fait que la déformer au départ pour la laisser revenir à sa place. La
 * référence, elle, éloignait indéfiniment ses rangées ; ici tout converge vers
 * zéro, et l'état final est le mur nu.
 *
 * Le module est sans dépendance au DOM : il reçoit des nombres et en rend.
 */

/** Réglage du ressort, repris tel quel de la référence. */
export interface SpringConfig {
  readonly stiffness: number;
  readonly damping: number;
  readonly mass: number;
}

/**
 * Ressort de la référence.
 *
 * Elle passait aussi `bounce: 100`, sans effet : ce réglage est une autre
 * façon de décrire le même ressort, et il est ignoré dès que la raideur et
 * l'amortissement sont fournis. On ne le reprend donc pas.
 *
 * Le taux d'amortissement vaut 30 / (2 × √300) ≈ 0,87 : le mouvement dépasse
 * légèrement sa cible avant de s'y poser, ce qui lui donne sa souplesse.
 */
export const REFERENCE_SPRING: SpringConfig = { stiffness: 300, damping: 30, mass: 1 };

export interface SpringState {
  readonly value: number;
  readonly velocity: number;
}

/**
 * Pas d'intégration maximal, en secondes.
 *
 * Un ressort intégré par la méthode d'Euler diverge dès que le pas devient
 * grand devant sa période propre : ici ω = √300 ≈ 17,3 rad/s, et la stabilité
 * exige ω·dt < 2, soit dt < 0,115 s. On garde une marge confortable, et on
 * découpe les intervalles plus longs plutôt que de les subir.
 */
const MAX_STEP = 1 / 120;

/**
 * Durée maximale rattrapée en une fois, en secondes.
 *
 * Au retour d'un onglet resté en arrière-plan, l'intervalle écoulé peut valoir
 * plusieurs secondes. Les rejouer intégralement ferait traverser au ressort
 * toute son oscillation d'un coup, et coûterait des centaines de sous-pas pour
 * un résultat que personne ne voit. On tronque.
 */
const MAX_ELAPSED = 1 / 10;

/** Un pas d'intégration semi-implicite : la vitesse d'abord, la position ensuite. */
function step(state: SpringState, target: number, dt: number, config: SpringConfig): SpringState {
  const acceleration =
    (config.stiffness * (target - state.value) - config.damping * state.velocity) / config.mass;
  const velocity = state.velocity + acceleration * dt;

  return { value: state.value + velocity * dt, velocity };
}

/** Fait avancer le ressort vers sa cible pendant la durée écoulée. */
export function advanceSpring(
  state: SpringState,
  target: number,
  elapsedSeconds: number,
  config: SpringConfig = REFERENCE_SPRING,
): SpringState {
  let remaining = Math.min(Math.max(elapsedSeconds, 0), MAX_ELAPSED);
  let current = state;

  while (remaining > 0) {
    const dt = Math.min(remaining, MAX_STEP);
    current = step(current, target, dt, config);
    remaining -= dt;
  }

  return current;
}

/** Ramène une valeur dans l'intervalle [0, 1]. */
function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

/**
 * Interpolation bornée entre deux intervalles.
 *
 * Équivaut au `useTransform` de la référence, qui borne par défaut : au-delà
 * des bornes d'entrée, la sortie reste à sa valeur extrême au lieu de filer.
 */
export function mapRange(
  value: number,
  inputStart: number,
  inputEnd: number,
  outputStart: number,
  outputEnd: number,
): number {
  if (inputEnd === inputStart) return outputStart;

  const t = clamp01((value - inputStart) / (inputEnd - inputStart));
  return outputStart + t * (outputEnd - outputStart);
}

/**
 * Progression de l'animation d'entrée.
 *
 * Vaut 0 quand le haut de la section atteint le haut de l'écran, et 1 après
 * `span` pixels de défilement supplémentaires.
 *
 * La référence rapportait cette progression à la hauteur de la section, ce qui
 * ne convient plus : cette hauteur est désormais celle du mur, donc celle de
 * ses photos. L'animation s'étirerait à mesure qu'on ajoute des images, et le
 * mur mettrait de plus en plus de temps à se poser. On la rapporte à une
 * course fixe — en pratique une hauteur d'écran — pour que l'entrée dure
 * toujours autant, quel que soit le nombre de photos.
 */
export function scrollProgress(rectTop: number, span: number): number {
  if (span <= 0) return 0;
  return clamp01(-rectTop / span);
}

/**
 * Progression retenue : elle ne redescend jamais.
 *
 * Le défaut qu'elle corrige : l'animation suivait le défilement dans les deux
 * sens, si bien que remonter pour regarder une photo de plus près la renvoyait
 * à sa position de départ. Le mur se dérobait à qui voulait l'examiner —
 * exactement ce qu'une galerie ne doit pas faire.
 *
 * Une fois le mur rangé, il le reste. L'entrée est une entrée : elle a lieu
 * une fois, à la première descente, et le reste de la visite se passe dans une
 * galerie qui se tient tranquille. Recharger la page la rejoue.
 */
export function latchProgress(previous: number, measured: number): number {
  return Math.max(previous, measured);
}

/**
 * Amplitudes du mouvement, c'est-à-dire l'état de départ.
 *
 * Elles étaient écrites en dur, en pixels, telles que la référence les
 * donnait. Cela tenait sur un écran large et se défaisait sur un téléphone :
 * une remontée de 700 px vaut 86 % de la hauteur d'un écran de 812, si bien
 * que la galerie s'ouvrait sur un vide. Les sortir du calcul permet de les
 * accorder à l'écran.
 *
 * Toutes convergent vers zéro : ce sont des écarts à la position juste, non
 * des destinations.
 */
export interface ParallaxAmplitudes {
  /** Basculement de départ autour de l'axe horizontal, en degrés. */
  readonly rotateX: number;
  /** Inclinaison de départ dans le plan de l'écran, en degrés. */
  readonly rotateZ: number;
  /** Décalage vertical du mur au départ, en pixels. Négatif : il arrive d'en haut. */
  readonly liftFrom: number;
  /** Décalage vertical de départ des colonnes, en pixels. Alterné d'une colonne à l'autre. */
  readonly columnOffset: number;
  /** Agrandissement de départ du mur, qui le fait déborder de l'écran. */
  readonly scaleFrom: number;
}

/**
 * Agrandissement de la grille au départ.
 *
 * Il ne sert pas à faire joli mais à combler l'écran, et sa valeur vient de la
 * mesure. Sur un écran de 1440 × 820, la grille de départ recouvre 39 % de la
 * surface à l'échelle 1, 62 % à 1,35, et 83 % à 1,8 — plafond pratique, le mur
 * rangé n'en couvrant lui-même que 82 % à cause des intervalles entre photos.
 *
 * La raison en est arithmétique : dix-sept photos représentent une surface
 * donnée, et une grille inclinée puis remontée n'en présente qu'une fraction à
 * l'écran. Tant que les photos ne seront pas plus nombreuses, seul
 * l'agrandissement peut fermer l'écart.
 *
 * 1,9 est le compromis retenu : l'écran est plein, et une colonne s'affiche à
 * environ 760 px pour des fichiers larges de 1280 — encore réduits, donc nets.
 */
const INITIAL_ZOOM = 2.4;

/**
 * Retouche verticale du calage de la grille de départ, en pixels.
 *
 * La grille de départ est centrée sur l'écran par le calcul, mais ses colonnes
 * n'ont pas toutes la même longueur — c'est le propre d'un mur — et son bord
 * inférieur est donc irrégulier. Agrandi deux fois et demie, ce décrochement
 * se compte en centaines de pixels et découvre le coin inférieur gauche. La
 * descendre un peu le repousse hors du cadre.
 *
 * Mesuré : la couverture passe de 73 à 79 % sur un écran de 1440 × 820.
 */
const START_NUDGE = 120;

/**
 * Où placer le centre de la grille de départ, en coordonnées de mise en page.
 *
 * Le calcul n'est pas anodin : la remontée et l'agrandissement s'opèrent
 * autour du centre du MUR, pas de celui de la grille de départ. Placer
 * naïvement celle-ci au milieu de l'écran la projetait très au-dessus du
 * regard — la couverture tombait à 38 %. Il faut donc remonter la
 * transformation pour savoir où la poser.
 */
export function startGridCentre(
  wallCentreY: number,
  viewportHeight: number,
  liftFrom: number,
  zoom: number,
): number {
  if (zoom <= 0) return wallCentreY;
  return wallCentreY + (viewportHeight / 2 - wallCentreY - liftFrom) / zoom + START_NUDGE;
}

/**
 * Fraction de la hauteur d'écran dont les colonnes sont décalées au départ.
 *
 * Ce que la référence obtenait en faisant glisser ses rangées horizontalement,
 * on l'obtient ici en décalant les colonnes verticalement — c'est leur axe. Un
 * mur composé de colonnes se déchiffre de haut en bas ; les décaler dans ce
 * sens brouille l'alignement sans jamais sortir une photo du cadre, ce qu'un
 * décalage horizontal ferait aussitôt.
 */
const COLUMN_OFFSET_RATIO = 0.22;
const NARROW_COLUMN_OFFSET_RATIO = 0.14;

/**
 * Amplitudes de la référence, sur écran large.
 *
 * Le basculement, l'inclinaison et la remontée sont ceux d'origine : cet état
 * de départ convenait, et rien n'y est changé.
 */
export function referenceAmplitudes(
  viewportHeight: number,
  scaleFrom = INITIAL_ZOOM,
): ParallaxAmplitudes {
  return {
    rotateX: 15,
    rotateZ: 20,
    liftFrom: -700,
    columnOffset: COLUMN_OFFSET_RATIO * viewportHeight,
    scaleFrom,
  };
}

/** Au-delà de cette largeur, les amplitudes de la référence s'appliquent. */
export const NARROW_MAX_WIDTH = 700;

/**
 * Amplitudes accordées à un écran étroit.
 *
 * L'inclinaison est ramenée de 20 à 10 degrés : à 20, sur un écran étroit, les
 * bords du mur balancent assez pour que les colonnes extrêmes sortent du cadre.
 *
 * Le décalage vertical passe en proportion de la hauteur d'écran, ce qui était
 * tout l'objet de la manœuvre.
 */
export function narrowAmplitudes(
  viewportHeight: number,
  scaleFrom = INITIAL_ZOOM,
): ParallaxAmplitudes {
  return {
    rotateX: 15,
    rotateZ: 10,
    liftFrom: -0.42 * viewportHeight,
    columnOffset: NARROW_COLUMN_OFFSET_RATIO * viewportHeight,
    scaleFrom,
  };
}

/** Choisit les amplitudes selon la place disponible. */
export function amplitudesFor(
  viewportWidth: number,
  viewportHeight: number,
): ParallaxAmplitudes {
  return viewportWidth > NARROW_MAX_WIDTH
    ? referenceAmplitudes(viewportHeight, INITIAL_ZOOM)
    : narrowAmplitudes(viewportHeight, INITIAL_ZOOM);
}

/**
 * Part de la course pendant laquelle le mur se redresse.
 *
 * Le redressement — basculement, opacité, remontée — s'achève ici, tandis que
 * le décalage des colonnes se résorbe jusqu'au bout. C'est ce décalage entre
 * les deux temps qui donne son « ensuite » à l'animation : le mur se pose
 * d'abord, ses colonnes se rangent après.
 */
const SETTLE_END = 0.45;

/**
 * Nombre de colonnes de la grille de départ, à partir de celui du mur.
 *
 * Une colonne de plus : la grille est alors plus large que le mur, elle
 * déborde de l'écran, et les photos des colonnes en trop repassent en dessous
 * lorsqu'elle se resserre. C'est tout le réagencement.
 *
 * Pourquoi une seule de plus, et non deux ou trois : la surface des photos
 * étant fixe, élargir la grille la raccourcit d'autant. Mesuré sur la page,
 * quatre colonnes couvrent 71 % de l'écran de départ, cinq n'en couvrent plus
 * que 51 % — la grille devient une bande trop courte pour remplir la hauteur.
 */
export function wideColumnCount(finalColumns: number): number {
  return finalColumns + 1;
}

/** Position d'une photo dans une grille. */
export interface GridCell {
  readonly x: number;
  readonly y: number;
}

/** Dimensions et positions d'une grille en colonnes. */
export interface GridLayout {
  readonly cells: readonly GridCell[];
  readonly width: number;
  readonly height: number;
}

/**
 * Calcule où tombe chaque photo dans une grille de N colonnes.
 *
 * Même règle que `distributeColumns` — chaque photo rejoint la colonne la plus
 * courte — mais en rendant les positions plutôt que les paquets. C'est ce qui
 * permet de connaître la grille de départ sans jamais la construire dans le
 * document : le document ne contient que le mur définitif, et les photos y
 * sont simplement déplacées.
 *
 * Le choix de colonne ne dépend pas de leur largeur, les hauteurs étant
 * comptées à l'échelle d'une colonne de largeur 1 ; les deux grilles restent
 * donc cohérentes entre elles.
 */
export function masonryLayout<T extends Proportioned>(
  photos: readonly T[],
  columnCount: number,
  columnWidth: number,
  gap: number,
): GridLayout {
  if (columnCount <= 0 || photos.length === 0) {
    return { cells: [], width: 0, height: 0 };
  }

  const heights = new Array<number>(columnCount).fill(0);
  const cells = photos.map((photo) => {
    let shortest = 0;
    for (let i = 1; i < columnCount; i++) {
      if (heights[i] < heights[shortest]) shortest = i;
    }

    const cell = { x: shortest * (columnWidth + gap), y: heights[shortest] };
    const ratio = photo.width > 0 ? photo.height / photo.width : 1;
    heights[shortest] += columnWidth * ratio + gap;

    return cell;
  });

  return {
    cells,
    width: columnCount * columnWidth + (columnCount - 1) * gap,
    height: Math.max(...heights) - gap,
  };
}

/** Valeurs visées par les ressorts, avant amortissement. */
export interface ParallaxTargets {
  /** Basculement autour de l'axe horizontal, en degrés. */
  readonly rotateX: number;
  /** Inclinaison dans le plan de l'écran, en degrés. */
  readonly rotateZ: number;
  /** Décalage vertical du mur, en pixels. */
  readonly translateY: number;
  readonly opacity: number;
  /** Amplitude du décalage des colonnes, en pixels. */
  readonly columnOffset: number;
  /** Agrandissement du mur. Vaut 1 une fois rangé. */
  readonly scale: number;
  /** Part du chemin restant entre la grille large et le mur. Vaut 0 une fois rangé. */
  readonly spread: number;
}

/** Valeurs visées pour une progression donnée. Toutes s'annulent à l'arrivée. */
export function parallaxTargets(
  progress: number,
  amplitudes: ParallaxAmplitudes,
): ParallaxTargets {
  return {
    rotateX: mapRange(progress, 0, SETTLE_END, amplitudes.rotateX, 0),
    rotateZ: mapRange(progress, 0, SETTLE_END, amplitudes.rotateZ, 0),
    translateY: mapRange(progress, 0, SETTLE_END, amplitudes.liftFrom, 0),
    opacity: mapRange(progress, 0, SETTLE_END, 0.2, 1),
    // L'agrandissement se résorbe sur toute la course, avec le décalage des
    // colonnes : le mur se redresse d'abord, puis se range. C'est pendant ce
    // second temps que les photos tranchées par le bord regagnent le cadre.
    columnOffset: mapRange(progress, 0, 1, amplitudes.columnOffset, 0),
    scale: mapRange(progress, 0, 1, amplitudes.scaleFrom, 1),
    // Les photos rejoignent leur case un peu avant la fin : en voir encore
    // glisser alors que tout le reste est posé donnerait l'impression d'un
    // retardataire.
    spread: mapRange(progress, 0, 0.85, 1, 0),
  };
}

/**
 * Décalage d'une colonne, selon son rang.
 *
 * Les colonnes alternent, une vers le haut, la suivante vers le bas — comme
 * alternaient les rangées de la référence. Le motif se répète sur trois rangs
 * plutôt que deux : avec une simple alternance, la première et la troisième
 * colonne d'un mur à trois colonnes partiraient ensemble, et l'on ne verrait
 * qu'une colonne centrale décalée au milieu de deux jumelles.
 */
export function columnShift(offset: number, index: number): number {
  const pattern = [-1, 1, -0.45, 0.7];
  return offset * pattern[index % pattern.length];
}

/** Les cinq ressorts entretenus par le composant. */
export type ParallaxSprings = { readonly [K in keyof ParallaxTargets]: SpringState };

/** État de repos, avant la première image. */
export function initialSprings(
  progress: number,
  amplitudes: ParallaxAmplitudes,
): ParallaxSprings {
  const targets = parallaxTargets(progress, amplitudes);

  // Les ressorts démarrent sur leur cible plutôt qu'à zéro : sans cela, le mur
  // traverserait tout son mouvement à l'ouverture de la page, même arrivé en
  // cours de défilement par un lien profond.
  return {
    rotateX: { value: targets.rotateX, velocity: 0 },
    rotateZ: { value: targets.rotateZ, velocity: 0 },
    translateY: { value: targets.translateY, velocity: 0 },
    opacity: { value: targets.opacity, velocity: 0 },
    columnOffset: { value: targets.columnOffset, velocity: 0 },
    scale: { value: targets.scale, velocity: 0 },
    spread: { value: targets.spread, velocity: 0 },
  };
}

/** Fait avancer les cinq ressorts d'une image. */
export function advanceParallax(
  springs: ParallaxSprings,
  progress: number,
  elapsedSeconds: number,
  amplitudes: ParallaxAmplitudes,
  config: SpringConfig = REFERENCE_SPRING,
): ParallaxSprings {
  const targets = parallaxTargets(progress, amplitudes);

  return {
    rotateX: advanceSpring(springs.rotateX, targets.rotateX, elapsedSeconds, config),
    rotateZ: advanceSpring(springs.rotateZ, targets.rotateZ, elapsedSeconds, config),
    translateY: advanceSpring(springs.translateY, targets.translateY, elapsedSeconds, config),
    opacity: advanceSpring(springs.opacity, targets.opacity, elapsedSeconds, config),
    columnOffset: advanceSpring(
      springs.columnOffset,
      targets.columnOffset,
      elapsedSeconds,
      config,
    ),
    scale: advanceSpring(springs.scale, targets.scale, elapsedSeconds, config),
    spread: advanceSpring(springs.spread, targets.spread, elapsedSeconds, config),
  };
}

/** Nombre de colonnes du mur, selon la largeur disponible. */
export function columnsFor(viewportWidth: number): number {
  return viewportWidth <= NARROW_MAX_WIDTH ? 2 : 3;
}

/** Ce que la répartition a besoin de savoir d'une photo : sa forme. */
export interface Proportioned {
  readonly width: number;
  readonly height: number;
}

/**
 * Répartit les photos en colonnes, à la manière d'un mur Pinterest.
 *
 * Chaque photo rejoint la colonne la plus courte à cet instant, en comptant sa
 * hauteur à l'échelle d'une colonne de largeur 1 — sa hauteur réelle est
 * inconnue ici, mais son rapport suffit puisque toutes les colonnes ont la
 * même largeur.
 *
 * Répartir simplement à tour de rôle donnerait des colonnes de longueurs très
 * inégales dès que les formats diffèrent, et c'est justement le bas du mur qui
 * trahit une mauvaise répartition : une colonne s'y arrête bien avant les
 * autres.
 *
 * L'ordre de lecture n'est pas préservé — c'est le propre de ce type de mur, et
 * sans conséquence pour des photos.
 */
export function distributeColumns<T extends Proportioned>(
  photos: readonly T[],
  columnCount: number,
): T[][] {
  if (columnCount <= 0) return [];

  const columns: T[][] = Array.from({ length: columnCount }, () => []);
  const heights = new Array<number>(columnCount).fill(0);

  for (const photo of photos) {
    if (photo.width <= 0) continue;

    let shortest = 0;
    for (let i = 1; i < columnCount; i++) {
      if (heights[i] < heights[shortest]) shortest = i;
    }

    columns[shortest].push(photo);
    heights[shortest] += photo.height / photo.width;
  }

  return columns;
}
