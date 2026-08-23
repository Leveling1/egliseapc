/**
 * Mécanique du parallaxe de la galerie.
 *
 * Transposition du composant React de référence, qui s'appuyait sur
 * `motion/react` : `useScroll` pour la progression, `useTransform` pour les
 * interpolations, `useSpring` pour l'amortissement. Rien de tout cela n'existe
 * ici, et il ne serait pas raisonnable d'importer une bibliothèque d'animation
 * React dans un projet Angular pour trois fonctions. Elles tiennent en une
 * centaine de lignes, et les avoir en clair permet de les vérifier.
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
 * Progression du défilement à travers la section.
 *
 * Reproduit `useScroll({ target, offset: ['start start', 'end start'] })` :
 * la progression vaut 0 quand le haut de la section atteint le haut de
 * l'écran, et 1 quand son bas l'atteint à son tour. Le trajet couvert vaut
 * donc exactement la hauteur de la section.
 */
export function scrollProgress(rectTop: number, rectHeight: number): number {
  if (rectHeight <= 0) return 0;
  return clamp01(-rectTop / rectHeight);
}

/**
 * Amplitudes du mouvement.
 *
 * Elles étaient écrites en dur, en pixels, telles que la référence les
 * donnait. Cela tenait sur un écran large et se défaisait sur un téléphone :
 * une remontée de 700 px vaut 86 % de la hauteur d'un écran de 812, si bien
 * que la galerie s'ouvrait sur un vide. Les sortir du calcul permet de les
 * accorder à l'écran sans toucher au mouvement lui-même.
 */
export interface ParallaxAmplitudes {
  /** Glissement horizontal total des rangées, en pixels. */
  readonly slide: number;
  /** Basculement de départ autour de l'axe horizontal, en degrés. */
  readonly rotateX: number;
  /** Inclinaison de départ dans le plan de l'écran, en degrés. */
  readonly rotateZ: number;
  /** Décalage vertical au départ, en pixels. Négatif : la grille arrive d'en haut. */
  readonly liftFrom: number;
  /** Décalage vertical une fois la grille posée, en pixels. */
  readonly liftTo: number;
}

/** Amplitudes de la référence, inchangées sur écran large. */
export const REFERENCE_AMPLITUDES: ParallaxAmplitudes = {
  slide: 1000,
  rotateX: 15,
  rotateZ: 20,
  liftFrom: -700,
  liftTo: 500,
};

/** Au-delà de cette largeur, les amplitudes de la référence s'appliquent telles quelles. */
export const NARROW_MAX_WIDTH = 700;

/**
 * Part de la progression réellement atteignable au défilement.
 *
 * La progression ne vaut 1 que si le bas de la section peut rejoindre le haut
 * de l'écran — ce qui suppose un plein écran de contenu après elle. Le pied de
 * page, à lui seul, n'y suffit pas : sur téléphone la progression plafonnait à
 * 0,77, et près d'un quart de la rangée restait hors d'atteinte. Des photos
 * présentes dans la page qu'aucun défilement ne pouvait montrer.
 *
 * Le plancher évite qu'une page anormalement courte ne réclame un glissement
 * démesuré.
 */
export function reachableProgress(
  sectionTop: number,
  sectionHeight: number,
  maxScroll: number,
): number {
  if (sectionHeight <= 0) return 1;
  return Math.max(0.25, Math.min(1, (maxScroll - sectionTop) / sectionHeight));
}

/**
 * Amplitudes accordées à un écran étroit.
 *
 * Le glissement n'est plus une constante mais le débord réel de la rangée,
 * rapporté à la course disponible : la rangée est ainsi parcourue d'un bout à
 * l'autre au moment précis où le défilement s'achève, sans laisser d'écran
 * vide à la fin ni s'arrêter avant la dernière photo.
 *
 * L'inclinaison est ramenée de 20 à 10 degrés. À 20, les extrémités d'une
 * rangée large de deux écrans et demi balancent de plus de cent cinquante
 * pixels en hauteur, et les photos sortent du cadre par le haut et par le bas.
 *
 * Le décalage vertical passe en proportion de la hauteur d'écran, ce qui était
 * tout l'objet de la manœuvre.
 */
export function narrowAmplitudes(
  viewportHeight: number,
  rowOverflow: number,
  reachable = 1,
): ParallaxAmplitudes {
  return {
    slide: Math.max(0, rowOverflow) / reachable,
    rotateX: 15,
    rotateZ: 10,
    liftFrom: -0.42 * viewportHeight,
    liftTo: 0.07 * viewportHeight,
  };
}

/**
 * Choisit les amplitudes selon la place disponible.
 *
 * Sur écran large, celles de la référence sont rendues telles quelles : ce
 * rendu-là convenait, et rien n'y est touché.
 */
export function amplitudesFor(
  viewportWidth: number,
  viewportHeight: number,
  rowOverflow: number,
  reachable = 1,
): ParallaxAmplitudes {
  return viewportWidth > NARROW_MAX_WIDTH
    ? REFERENCE_AMPLITUDES
    : narrowAmplitudes(viewportHeight, rowOverflow, reachable);
}

/** Valeurs visées par les ressorts, avant amortissement. */
export interface ParallaxTargets {
  /** Glissement horizontal des rangées 1 et 3, en pixels. */
  readonly translateX: number;
  /** Basculement autour de l'axe horizontal, en degrés. */
  readonly rotateX: number;
  /** Inclinaison dans le plan de l'écran, en degrés. */
  readonly rotateZ: number;
  /** Décalage vertical de la grille, en pixels. */
  readonly translateY: number;
  readonly opacity: number;
}

/**
 * Valeurs visées pour une progression donnée.
 *
 * Les six interpolations de la référence, aux mêmes bornes. Trois d'entre
 * elles se jouent sur le premier cinquième du défilement seulement : la grille
 * se redresse vite, puis ne fait plus que glisser.
 */
export function parallaxTargets(
  progress: number,
  amplitudes: ParallaxAmplitudes = REFERENCE_AMPLITUDES,
): ParallaxTargets {
  return {
    translateX: mapRange(progress, 0, 1, 0, amplitudes.slide),
    rotateX: mapRange(progress, 0, 0.2, amplitudes.rotateX, 0),
    rotateZ: mapRange(progress, 0, 0.2, amplitudes.rotateZ, 0),
    translateY: mapRange(progress, 0, 0.2, amplitudes.liftFrom, amplitudes.liftTo),
    opacity: mapRange(progress, 0, 0.2, 0.2, 1),
  };
}

/**
 * Glissement des rangées à contresens.
 *
 * La référence entretenait un second ressort, visant l'opposé du premier. Ce
 * n'était pas nécessaire : un ressort est un système linéaire, donc amortir
 * l'opposé d'une cible revient exactement à prendre l'opposé de la valeur
 * amortie — à condition que les deux partent du même point, ce qui est le cas,
 * les deux valant zéro au départ. Un ressort de moins à intégrer à chaque
 * image, pour un résultat identique au flottant près.
 */
export function reverseTranslate(translateX: number): number {
  return -translateX;
}

/** Les cinq ressorts entretenus par le composant. */
export type ParallaxSprings = { readonly [K in keyof ParallaxTargets]: SpringState };

/** État de repos, avant la première image. */
export function initialSprings(
  progress: number,
  amplitudes: ParallaxAmplitudes = REFERENCE_AMPLITUDES,
): ParallaxSprings {
  const targets = parallaxTargets(progress, amplitudes);

  // Les ressorts démarrent sur leur cible plutôt qu'à zéro : sans cela, la
  // grille traverserait tout son mouvement à l'ouverture de la page, même
  // arrivée en cours de défilement par un lien profond.
  return {
    translateX: { value: targets.translateX, velocity: 0 },
    rotateX: { value: targets.rotateX, velocity: 0 },
    rotateZ: { value: targets.rotateZ, velocity: 0 },
    translateY: { value: targets.translateY, velocity: 0 },
    opacity: { value: targets.opacity, velocity: 0 },
  };
}

/** Fait avancer les cinq ressorts d'une image. */
export function advanceParallax(
  springs: ParallaxSprings,
  progress: number,
  elapsedSeconds: number,
  amplitudes: ParallaxAmplitudes = REFERENCE_AMPLITUDES,
  config: SpringConfig = REFERENCE_SPRING,
): ParallaxSprings {
  const targets = parallaxTargets(progress, amplitudes);

  return {
    translateX: advanceSpring(springs.translateX, targets.translateX, elapsedSeconds, config),
    rotateX: advanceSpring(springs.rotateX, targets.rotateX, elapsedSeconds, config),
    rotateZ: advanceSpring(springs.rotateZ, targets.rotateZ, elapsedSeconds, config),
    translateY: advanceSpring(springs.translateY, targets.translateY, elapsedSeconds, config),
    opacity: advanceSpring(springs.opacity, targets.opacity, elapsedSeconds, config),
  };
}

/**
 * Répartit les photos en trois rangées de longueur égale.
 *
 * La référence découpait une liste de quinze en trois tranches de cinq. On
 * garde le principe mais on l'adapte au nombre réel de photos fournies, en
 * répétant si besoin : une rangée plus courte que les autres se remarque
 * immédiatement, puisqu'elles glissent côte à côte.
 */
export function splitRows<T>(photos: readonly T[], perRow: number): T[][] {
  if (photos.length === 0 || perRow <= 0) return [[], [], []];

  return [0, 1, 2].map((row) =>
    Array.from({ length: perRow }, (_, i) => photos[(row * perRow + i) % photos.length]),
  );
}
