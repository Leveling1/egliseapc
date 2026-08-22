import { describe, expect, it } from 'vitest';

import {
  REFERENCE_SPRING,
  advanceParallax,
  advanceSpring,
  initialSprings,
  mapRange,
  parallaxTargets,
  reverseTranslate,
  scrollProgress,
  splitRows,
  type SpringState,
} from './parallax-motion';

const AU_REPOS: SpringState = { value: 0, velocity: 0 };

describe('scrollProgress', () => {
  it("vaut zéro quand la section touche le haut de l'écran", () => {
    expect(scrollProgress(0, 3000)).toBe(0);
  });

  it('vaut un quand son bas y arrive à son tour', () => {
    expect(scrollProgress(-3000, 3000)).toBe(1);
  });

  it('progresse linéairement entre les deux', () => {
    expect(scrollProgress(-1500, 3000)).toBeCloseTo(0.5, 6);
  });

  it('reste borné avant et après la traversée', () => {
    // Au-dessus de la section, comme bien en dessous, la grille doit garder
    // son dernier état plutôt que de poursuivre sa course.
    expect(scrollProgress(500, 3000)).toBe(0);
    expect(scrollProgress(-9000, 3000)).toBe(1);
  });

  it('supporte une section de hauteur nulle', () => {
    // Arrive avant la première mesure, quand la page n'est pas encore mise en
    // page : une division par zéro y produirait NaN, qui se propagerait dans
    // toutes les transformations.
    expect(scrollProgress(0, 0)).toBe(0);
  });
});

describe('mapRange', () => {
  it('interpole entre les deux bornes', () => {
    expect(mapRange(0.5, 0, 1, 0, 1000)).toBe(500);
    expect(mapRange(0.1, 0, 0.2, 15, 0)).toBeCloseTo(7.5, 6);
  });

  it('borne au-delà des extrémités', () => {
    // C'est le comportement par défaut du `useTransform` de la référence.
    expect(mapRange(2, 0, 1, 0, 1000)).toBe(1000);
    expect(mapRange(-1, 0, 1, 0, 1000)).toBe(0);
  });

  it('supporte un intervalle d\'entrée vide', () => {
    expect(mapRange(5, 3, 3, 10, 20)).toBe(10);
  });
});

describe('parallaxTargets', () => {
  it('part incliné, effacé et remonté', () => {
    const t = parallaxTargets(0);

    expect(t.rotateX).toBe(15);
    expect(t.rotateZ).toBe(20);
    expect(t.translateY).toBe(-700);
    expect(t.opacity).toBeCloseTo(0.2, 6);
    expect(t.translateX).toBe(0);
  });

  it('se redresse sur le premier cinquième du défilement', () => {
    const t = parallaxTargets(0.2);

    expect(t.rotateX).toBe(0);
    expect(t.rotateZ).toBe(0);
    expect(t.translateY).toBe(500);
    expect(t.opacity).toBe(1);
  });

  it('ne fait plus que glisser au-delà', () => {
    // Une fois la grille redressée, seul le glissement horizontal continue :
    // c'est lui qui fait défiler les photos, et il court sur tout le trajet.
    const a = parallaxTargets(0.5);
    const b = parallaxTargets(1);

    expect(a.rotateX).toBe(b.rotateX);
    expect(a.opacity).toBe(b.opacity);
    expect(a.translateX).toBe(500);
    expect(b.translateX).toBe(1000);
  });
});

describe('reverseTranslate', () => {
  it('renvoie exactement l\'opposé', () => {
    // La référence entretenait un second ressort visant l'opposé. Un ressort
    // étant linéaire et les deux partant de zéro, l'opposé de la valeur
    // amortie est la valeur amortie de l'opposé : le second ressort était
    // redondant. Ce test verrouille l'équivalence.
    let direct: SpringState = AU_REPOS;
    let oppose: SpringState = AU_REPOS;

    for (let i = 0; i < 120; i++) {
      direct = advanceSpring(direct, 1000, 1 / 60);
      oppose = advanceSpring(oppose, -1000, 1 / 60);
    }

    expect(reverseTranslate(direct.value)).toBeCloseTo(oppose.value, 9);
  });
});

describe('advanceSpring', () => {
  it('rejoint sa cible', () => {
    let s: SpringState = AU_REPOS;
    for (let i = 0; i < 240; i++) s = advanceSpring(s, 500, 1 / 60);

    expect(s.value).toBeCloseTo(500, 3);
    expect(s.velocity).toBeCloseTo(0, 3);
  });

  it('dépasse légèrement avant de se poser', () => {
    // Amortissement de 0,87 : le mouvement est sous-amorti, et ce léger
    // dépassement est précisément ce qui lui donne sa souplesse. Un ressort
    // qui n'irait jamais au-delà de sa cible paraîtrait mou.
    let s: SpringState = AU_REPOS;
    let max = 0;
    for (let i = 0; i < 240; i++) {
      s = advanceSpring(s, 100, 1 / 60);
      max = Math.max(max, s.value);
    }

    expect(max).toBeGreaterThan(100);
    expect(max).toBeLessThan(110);
  });

  it('reste stable sur un intervalle démesuré', () => {
    // Au retour d'un onglet laissé en arrière-plan, l'intervalle écoulé peut
    // valoir plusieurs secondes. Intégré d'un seul pas, le ressort divergerait
    // et projetterait la grille hors de l'écran.
    const s = advanceSpring(AU_REPOS, 500, 30);

    expect(Number.isFinite(s.value)).toBe(true);
    expect(Math.abs(s.value)).toBeLessThan(600);
  });

  it('ne recule pas sur un intervalle négatif ou nul', () => {
    expect(advanceSpring(AU_REPOS, 500, 0)).toEqual(AU_REPOS);
    expect(advanceSpring(AU_REPOS, 500, -1)).toEqual(AU_REPOS);
  });

  it('donne le même résultat quel que soit le découpage du temps', () => {
    // Le pas d'intégration est fixe : soixante images par seconde ou trente
    // doivent aboutir au même endroit, sans quoi l'animation dépendrait de la
    // puissance de la machine.
    let rapide: SpringState = AU_REPOS;
    for (let i = 0; i < 60; i++) rapide = advanceSpring(rapide, 300, 1 / 60);

    let lent: SpringState = AU_REPOS;
    for (let i = 0; i < 30; i++) lent = advanceSpring(lent, 300, 1 / 30);

    expect(rapide.value).toBeCloseTo(lent.value, 6);
  });
});

describe('advanceParallax', () => {
  it('démarre déjà posé sur sa cible', () => {
    // Sans cela, une arrivée en milieu de page par un lien profond
    // déclencherait toute l'animation d'entrée, que rien ne justifie.
    const springs = initialSprings(0.6);
    const cible = parallaxTargets(0.6);

    expect(springs.translateX.value).toBe(cible.translateX);
    expect(springs.opacity.value).toBe(cible.opacity);
  });

  it('converge vers la cible de la progression courante', () => {
    let springs = initialSprings(0);
    for (let i = 0; i < 240; i++) springs = advanceParallax(springs, 0.2, 1 / 60);

    expect(springs.rotateX.value).toBeCloseTo(0, 2);
    expect(springs.opacity.value).toBeCloseTo(1, 2);
    expect(springs.translateY.value).toBeCloseTo(500, 1);
  });
});

describe('splitRows', () => {
  it('rend trois rangées de la longueur demandée', () => {
    const rangees = splitRows(Array.from({ length: 15 }, (_, i) => i), 5);

    expect(rangees).toHaveLength(3);
    expect(rangees.every((r) => r.length === 5)).toBe(true);
    expect(rangees[0]).toEqual([0, 1, 2, 3, 4]);
    expect(rangees[2]).toEqual([10, 11, 12, 13, 14]);
  });

  it('répète quand les photos manquent', () => {
    // Une rangée plus courte que les deux autres se remarque aussitôt,
    // puisqu'elles glissent côte à côte.
    const rangees = splitRows([0, 1, 2], 5);

    expect(rangees.every((r) => r.length === 5)).toBe(true);
    expect(rangees[0]).toEqual([0, 1, 2, 0, 1]);
  });

  it('supporte une liste vide', () => {
    expect(splitRows([], 5)).toEqual([[], [], []]);
  });
});
