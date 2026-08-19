/**
 * Calcul de la séquence d'ouverture de la page d'accueil.
 *
 * Isolé du composant et sans aucune dépendance au DOM : c'est la partie
 * délicate de l'animation, et elle mérite d'être vérifiable directement.
 * Le composant se contente d'appliquer les valeurs renvoyées ici.
 *
 * Déroulé, sur les 300vh du pin :
 *   0 → 1vh   traversée : le cylindre grossit et se dissipe, le portrait
 *             émerge, le texte d'accueil s'efface
 *   1 → 2vh   fondu de « Qui sommes-nous » vers « Le Visionnaire »
 *   au-delà   tout s'efface, le pin est derrière nous
 */

/** Interpolation adoucie : départ et arrivée sans à-coup. */
export function smoothstep(value: number): number {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
}

/** Progression adoucie sur une portion [start, end] d'un intervalle. */
export function phase(progress: number, start: number, end: number): number {
  return smoothstep((progress - start) / (end - start));
}

/*
 * Les voiles ne figurent volontairement pas ici.
 *
 * Ils étaient auparavant liés à la disparition du texte : ils s'effaçaient
 * donc en cours de traversée et le carrousel reprenait brutalement sa teinte
 * pleine, au moment précis où l'attention devait glisser vers le portrait.
 * Les sortir du calcul d'animation garantit qu'ils resteront constants — la
 * question ne peut plus se reposer par accident.
 */
export interface HeroFrame {
  /** Texte d'accueil : opacité et décalage vertical en pixels. */
  readonly contentOpacity: number;
  readonly contentShift: number;
  /** Scène du carrousel : agrandissement et opacité. */
  readonly stageScale: number;
  readonly stageOpacity: number;
  /** Portrait plein écran révélé par la traversée. */
  readonly portraitOpacity: number;
  readonly portraitScale: number;
  /** Opacité des deux textes, dans l'ordre du gabarit. */
  readonly historyOpacity: readonly [number, number];
  /** Flou des deux textes, en pixels. */
  readonly historyBlur: readonly [number, number];
}

export function heroFrame(scrolled: number, viewport: number, pinHeight: number): HeroFrame {
  // Le portrait et les textes restent visibles jusqu'à la fin du pin, et non
  // dès que le hero se décolle.
  //
  // C'est ce qui produit le recouvrement : ces calques sont en position fixe,
  // donc immobiles, pendant que « Nos Programmes » remonte par-dessus eux.
  // Cette section est en `position: relative` et vient après le hero dans le
  // document ; elle se peint donc au-dessus de son contexte d'empilement, où
  // le `z-index: 1000` du portrait reste enfermé.
  //
  // Les effacer au décollage supprimerait cet effet — il n'y aurait plus rien
  // à recouvrir. Au-delà du pin, en revanche, ils doivent disparaître : sinon
  // ils resteraient à l'écran par-dessus toutes les sections suivantes.
  const past = scrolled >= pinHeight;

  const entry = Math.max(0, Math.min(1, scrolled / viewport));

  // Le texte d'accueil part le premier : le laisser lisible pendant que le
  // cylindre nous engloutit donnerait une impression de surcharge.
  const textOut = phase(entry, 0, 0.32);

  // Le cylindre avance vers nous puis se dissipe — on le traverse.
  const advance = smoothstep(entry);
  const stageOut = phase(entry, 0.42, 0.9);

  // Le portrait émerge pendant que le cylindre se dissipe. Les deux se
  // recouvrent volontairement : le cylindre semble s'ouvrir sur lui, au lieu
  // de céder la place à un écran noir intermédiaire.
  const reveal = past ? 0 : phase(entry, 0.38, 0.92);

  let first = 0;
  let second = 0;
  let crossfade = 0;

  if (scrolled >= viewport && !past) {
    const stage2 = (scrolled - viewport) / viewport;
    crossfade = smoothstep((stage2 - 0.3) / 0.4);

    // Rampe d'apparition : sans elle, « Qui sommes-nous » surgirait à pleine
    // opacité à l'instant exact où la traversée se termine, cassant
    // l'enchaînement avec le fondu du portrait qui vient juste avant.
    first = phase(stage2, 0, 0.12) * (1 - crossfade);
    second = crossfade;
  }

  return {
    contentOpacity: 1 - textOut,
    contentShift: -46 * textOut,
    stageScale: 1 + 1.85 * advance,
    stageOpacity: 1 - stageOut,
    portraitOpacity: reveal,
    portraitScale: 1.12 - 0.12 * reveal,
    historyOpacity: [first, second],
    historyBlur: [crossfade * 12, (1 - crossfade) * 12],
  };
}
