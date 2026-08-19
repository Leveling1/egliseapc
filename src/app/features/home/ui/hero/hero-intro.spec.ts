import { describe, expect, it } from 'vitest';

import { introTiming, splitIntoWords } from './hero-intro';

const PHRASE = 'Bienvenue chez les Ambassadeurs Pour Christ';

describe('splitIntoWords', () => {
  it('regroupe les lettres par mot', () => {
    const mots = splitIntoWords('Bienvenue chez vous');

    expect(mots).toHaveLength(3);
    expect(mots[0].letters.map((l) => l.char).join('')).toBe('Bienvenue');
    expect(mots[2].letters.map((l) => l.char).join('')).toBe('vous');
  });

  it('compte les espaces dans le rythme', () => {
    // Sans cela, la vague se resserrerait à chaque espace et le déroulé
    // perdrait sa régularité.
    const mots = splitIntoWords('ab cd');

    expect(mots[0].letters.map((l) => l.index)).toEqual([0, 1]);
    expect(mots[1].letters.map((l) => l.index)).toEqual([3, 4]);
  });

  it('conserve tout le texte, accents compris', () => {
    const rendu = splitIntoWords(PHRASE)
      .map((mot) => mot.letters.map((l) => l.char).join(''))
      .join(' ');

    expect(rendu).toBe(PHRASE);
  });
});

describe('introTiming', () => {
  it("resserre le retard à mesure que la phrase s'allonge", () => {
    // La référence appliquait 120 ms à 19 caractères. Notre phrase en fait
    // plus du double : garder ce retard ferait durer la vague plus de six
    // secondes. C'est donc la durée de la vague qui est fixée, et le retard
    // qui s'en déduit.
    expect(introTiming(19).stagger).toBeGreaterThan(introTiming(PHRASE.length).stagger);
    expect(introTiming(PHRASE.length).stagger).toBeLessThan(60);
  });

  it('plafonne le retard sur un texte très court', () => {
    // Sans plafond, cinq lettres se dérouleraient au ralenti, chacune
    // attendant plus de trois cents millisecondes.
    expect(introTiming(6).stagger).toBe(120);
  });

  it('garde une vague de durée comparable quelle que soit la longueur', () => {
    const vague = (n: number) => introTiming(n).stagger * (n - 1);

    expect(vague(30)).toBeGreaterThan(950);
    expect(vague(30)).toBeLessThanOrEqual(1300);
    expect(vague(60)).toBeGreaterThan(950);
    expect(vague(60)).toBeLessThanOrEqual(1300);
  });

  it('laisse au passage entre les deux actes le temps de se voir', () => {
    // Le défaut signalé : à 500 ms, l'accueil s'effaçait d'un coup.
    expect(introTiming(PHRASE.length).outroDuration).toBeGreaterThanOrEqual(900);
  });

  it('enchaîne les deux actes sans écran vide', () => {
    const t = introTiming(PHRASE.length);

    // Le titre définitif entre avant que l'accueil ait fini de s'effacer :
    // les deux se croisent au lieu de laisser un trou.
    expect(t.finalDelay).toBeGreaterThan(t.outroStart);
    expect(t.finalDelay).toBeLessThan(t.total);
  });

  it('ne fait pas attendre le visiteur trop longtemps', () => {
    // Le titre est le contenu utile : au-delà de trois secondes, l'entrée
    // cesse d'être une mise en scène pour devenir un obstacle.
    expect(introTiming(PHRASE.length).finalDelay).toBeLessThan(3000);
  });

  it('reste cohérent sur un texte d\'une seule lettre', () => {
    const t = introTiming(1);

    expect(Number.isFinite(t.stagger)).toBe(true);
    expect(t.outroStart).toBeGreaterThan(0);
  });
});
