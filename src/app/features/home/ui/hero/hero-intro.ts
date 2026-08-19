/**
 * Découpe et minutage du texte d'accueil joué au chargement.
 *
 * Isolé du composant et sans dépendance au DOM, comme le reste des calculs
 * d'animation du hero : c'est ici que se décide le rythme, il doit donc être
 * vérifiable directement.
 */

export interface IntroLetter {
  /** Caractère à afficher. */
  readonly char: string;
  /** Rang dans la phrase entière, qui détermine le retard de la lettre. */
  readonly index: number;
}

export interface IntroWord {
  readonly letters: readonly IntroLetter[];
}

export interface IntroTiming {
  /** Retard ajouté à chaque lettre par rapport à la précédente, en ms. */
  readonly stagger: number;
  /** Durée d'apparition d'une lettre, en ms. */
  readonly letterDuration: number;
  /** Instant où le texte d'accueil commence à s'effacer, en ms. */
  readonly outroStart: number;
  /** Instant où le titre définitif commence à apparaître, en ms. */
  readonly finalDelay: number;
  /** Durée du passage d'un acte à l'autre, en ms. Sert aussi au rideau. */
  readonly outroDuration: number;
  /** Fin de toute la séquence, en ms. */
  readonly total: number;
}

const LETTER_DURATION = 1200;
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
 * Retard maximal entre deux lettres.
 *
 * C'est la valeur relevée sur le site de référence, qui l'appliquait à une
 * phrase de 19 caractères.
 */
const MAX_STAGGER = 120;

/**
 * Durée visée pour la vague, du départ de la première lettre à celui de la
 * dernière.
 *
 * La référence gardait un retard fixe, ce qui ne tient pas ici : notre phrase
 * fait plus du double de la sienne, et 120 ms par lettre la ferait durer plus
 * de six secondes. On fixe donc la durée de la vague et on en déduit le
 * retard, ce qui garde le même effet quelle que soit la longueur du texte.
 *
 * Resserrée depuis que le passage entre les deux actes a été allongé : sans
 * cela, le titre — le contenu utile — se ferait attendre au-delà de trois
 * secondes.
 */
const WAVE_SPAN = 1200;

/**
 * Découpe la phrase en mots, chaque mot portant ses lettres.
 *
 * Le découpage par mots n'est pas cosmétique : chaque lettre devient un bloc
 * en ligne pour pouvoir être déplacée, et sans regroupement le navigateur
 * couperait les mots n'importe où en fin de ligne — ce qui saute aux yeux sur
 * un écran étroit.
 */
export function splitIntoWords(text: string): IntroWord[] {
  const words: IntroWord[] = [];
  let index = 0;

  for (const word of text.split(' ')) {
    if (word.length === 0) continue;

    words.push({
      letters: [...word].map((char) => ({ char, index: index++ })),
    });

    // L'espace compte dans le rythme, comme sur le site de référence.
    index++;
  }

  return words;
}

export function introTiming(letterCount: number): IntroTiming {
  const steps = Math.max(1, letterCount - 1);
  const stagger = Math.min(MAX_STAGGER, Math.round(WAVE_SPAN / steps));

  // La dernière lettre part à `steps × stagger` et met `letterDuration` à
  // s'installer : c'est là que la vague se termine.
  const waveEnd = steps * stagger + LETTER_DURATION;

  return {
    stagger,
    letterDuration: LETTER_DURATION,
    outroStart: waveEnd,
    outroDuration: OUTRO_DURATION,
    // Le titre définitif entre pendant que l'accueil s'efface : un fondu
    // enchaîné, plutôt qu'un écran vide entre les deux actes.
    finalDelay: waveEnd + OUTRO_DURATION * 0.3,
    total: waveEnd + OUTRO_DURATION,
  };
}
