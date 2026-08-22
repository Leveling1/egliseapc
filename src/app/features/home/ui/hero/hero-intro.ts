/**
 * Minutage de l'accueil joué au chargement.
 *
 * Isolé du composant et sans dépendance au DOM, comme le reste des calculs
 * d'animation du hero : c'est ici que se décide le rythme, il doit donc être
 * vérifiable directement.
 *
 * Le principe de l'écriture : un balayage traverse le lettrage de gauche à
 * droite à vitesse constante, comme une main qui avance. Chaque lettre est
 * dévoilée pendant que le balayage franchit sa largeur — sa position dicte
 * donc quand elle paraît, et sa largeur combien de temps elle met.
 *
 * Ce découpage n'est pas qu'une commodité : les lettres cursives se
 * chevauchent, la hampe du « h » déborde sur le « c » qui le précède. Comme
 * chaque fenêtre de temps est déduite de la position, ces chevauchements se
 * traduisent en fenêtres qui se recouvrent, et l'ensemble se recompose en une
 * seule ligne d'encre qui progresse sans rupture.
 */

import type { WelcomeStroke } from './welcome-strokes';

export interface IntroStroke {
  /** Contour de la lettre. */
  readonly d: string;
  /** Lettre représentée, à titre documentaire. */
  readonly letter: string;
  /** Instant où le balayage atteint son bord gauche, en ms. */
  readonly delay: number;
  /** Temps qu'il met à la franchir, en ms. */
  readonly duration: number;
}

export interface IntroTiming {
  /** Durée totale de l'écriture, en ms. */
  readonly writeSpan: number;
  /** Instant où le titre définitif paraît, en ms. */
  readonly titleDelay: number;
  /** Durée de son apparition, en ms. */
  readonly titleDuration: number;
  /** Instant où l'écriture commence à s'effacer, en ms. */
  readonly outroStart: number;
  /** Durée du passage d'un acte à l'autre, en ms. Sert aussi au rideau. */
  readonly outroDuration: number;
  /** Instant où le reste de l'acte 2 entre, en ms. */
  readonly finalDelay: number;
  /** Fin de toute la séquence, en ms. */
  readonly total: number;
}

/**
 * Durée de l'écriture.
 *
 * Reprise au millimètre de la cascade lettre par lettre qu'elle remplace :
 * quarante-deux intervalles de 29 ms, plus les 1 200 ms que mettait la
 * dernière lettre à s'installer. La consigne était de conserver exactement le
 * même minutage, et tout ce qui suit — effacement, rideau, acte 2 — s'y
 * accroche sans changer d'un millième.
 */
const WRITE_SPAN = 2418;

/**
 * Durée du passage d'un acte à l'autre.
 *
 * Volontairement longue : à 500 ms l'accueil s'effaçait d'un coup et le titre
 * lui succédait presque sans transition. C'est aussi pendant ce laps que le
 * rideau se lève sur le carrousel — un mouvement trop bref le rendrait
 * saccadé.
 */
const OUTRO_DURATION = 1000;

/**
 * Durée d'apparition du titre définitif, en ms.
 *
 * Allongée depuis les 800 ms d'origine, qui rendaient l'entrée brusque. Le
 * titre déborde ainsi un peu sur la fin de l'écriture — c'est voulu : il se
 * précise pendant que la main achève le dernier mot, au lieu de surgir.
 */
const TITLE_DURATION = 1000;

/**
 * Repli si le lettrage ne présente aucune levée franche du stylo.
 *
 * Ne sert qu'à garantir une valeur sensée : le lettrage réel comporte un
 * espace entre « Bienvenue » et « chez », et c'est lui qui décide.
 */
const DEFAULT_LIFT = 0.66;

/**
 * Fraction du parcours à laquelle le stylo se lève le plus longuement.
 *
 * C'est l'espace entre les deux mots : le seul endroit où le balayage ne
 * rencontre aucune lettre. On s'en sert pour y placer l'arrivée du titre, qui
 * profite ainsi de la respiration de l'écriture au lieu de la couper.
 */
export function penLift(strokes: readonly WelcomeStroke[]): number {
  if (strokes.length < 2) return DEFAULT_LIFT;

  const first = strokes[0].start;
  const last = strokes[strokes.length - 1].end;
  const total = last - first;
  if (total <= 0) return DEFAULT_LIFT;

  // Le bord droit atteint jusqu'ici, et non celui de la lettre précédente :
  // en cursive une lettre peut se terminer avant la fin de celle d'avant.
  let reached = strokes[0].end;
  let bestGap = 0;
  let bestAt = DEFAULT_LIFT;

  for (let i = 1; i < strokes.length; i++) {
    const gap = strokes[i].start - reached;
    if (gap > bestGap) {
      bestGap = gap;
      bestAt = (reached - first) / total;
    }
    reached = Math.max(reached, strokes[i].end);
  }

  return bestGap > 0 ? bestAt : DEFAULT_LIFT;
}

/**
 * Répartit la durée d'écriture sur les lettres, au prorata de leur position.
 *
 * La progression est linéaire d'un bout à l'autre — le stylo ne ralentit ni
 * n'accélère. Ce n'est pas un détail : chaque lettre porte sa propre
 * animation, et une courbe d'accélération appliquée à chacune ferait avancer
 * l'encre par à-coups au lieu d'une ligne continue.
 */
export function handwriting(
  strokes: readonly WelcomeStroke[],
  writeSpan: number = WRITE_SPAN,
): IntroStroke[] {
  if (strokes.length === 0) return [];

  const first = strokes[0].start;
  const last = strokes[strokes.length - 1].end;
  const total = last - first;

  return strokes.map((stroke) => {
    const at = total > 0 ? (stroke.start - first) / total : 0;
    const width = total > 0 ? (stroke.end - stroke.start) / total : 1 / strokes.length;

    return {
      d: stroke.d,
      letter: stroke.letter,
      delay: Math.round(at * writeSpan),
      duration: Math.round(width * writeSpan),
    };
  });
}

export function introTiming(strokes: readonly WelcomeStroke[]): IntroTiming {
  return {
    writeSpan: WRITE_SPAN,
    // Le titre entre pendant la levée du stylo entre les deux mots : la
    // composition de l'affiche se complète dans la respiration de l'écriture.
    titleDelay: Math.round(penLift(strokes) * WRITE_SPAN),
    titleDuration: TITLE_DURATION,
    outroStart: WRITE_SPAN,
    outroDuration: OUTRO_DURATION,
    // Le reste de l'acte 2 entre pendant que l'écriture s'efface : un fondu
    // enchaîné, plutôt qu'un écran vide entre les deux actes.
    finalDelay: WRITE_SPAN + OUTRO_DURATION * 0.3,
    total: WRITE_SPAN + OUTRO_DURATION,
  };
}
