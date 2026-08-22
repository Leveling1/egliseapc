import { describe, expect, it } from 'vitest';

import { handwriting, introTiming, penLift } from './hero-intro';
import { WELCOME_STROKES, type WelcomeStroke } from './welcome-strokes';

/** Minutage de la cascade lettre par lettre que l'écriture remplace. */
const ANCIEN_MINUTAGE = { fin: 2418, relais: 2718, total: 3418 };

const strokes = handwriting(WELCOME_STROKES);

describe('handwriting', () => {
  it('rend une entrée par lettre du lettrage', () => {
    expect(strokes).toHaveLength(WELCOME_STROKES.length);
    expect(strokes.map((s) => s.letter).join('')).toBe('Bienvenuechez');
  });

  it("commence dès le chargement et s'achève au terme prévu", () => {
    const dernier = strokes[strokes.length - 1];

    expect(strokes[0].delay).toBe(0);
    expect(dernier.delay + dernier.duration).toBe(ANCIEN_MINUTAGE.fin);
  });

  it('fait avancer le stylo à vitesse constante', () => {
    // Chaque lettre doit occuper un temps proportionnel à sa largeur. Sans
    // cela, un « B » et un « i » mettraient le même temps et l'encre
    // avancerait par à-coups.
    const vitesses = WELCOME_STROKES.map(
      (source, i) => (source.end - source.start) / strokes[i].duration,
    );

    const min = Math.min(...vitesses);
    const max = Math.max(...vitesses);

    // L'écart résiduel ne vient que de l'arrondi des durées à la milliseconde.
    expect(max / min).toBeLessThan(1.01);
  });

  it('pose les lettres dans l\'ordre de l\'écriture', () => {
    for (let i = 1; i < strokes.length; i++) {
      expect(strokes[i].delay).toBeGreaterThanOrEqual(strokes[i - 1].delay);
    }
  });

  it('laisse se recouvrir les lettres qui se chevauchent', () => {
    // La hampe du « h » déborde sur le « c » qui le précède. Le « h » doit
    // donc commencer à paraître avant que le « c » soit achevé : c'est ce
    // recouvrement qui recompose une ligne d'encre continue plutôt qu'une
    // succession de lettres isolées.
    const c = strokes.findIndex((s, i) => s.letter === 'c' && i > 8);
    const h = c + 1;

    expect(strokes[h].letter).toBe('h');
    expect(strokes[h].delay).toBeLessThan(strokes[c].delay + strokes[c].duration);
  });

  it("ne s'interrompt que là où le lettrage lui-même s'interrompt", () => {
    // La propriété qui compte : le temps doit épouser la géométrie. L'encre ne
    // peut s'arrêter que si le lettrage présente un blanc au même endroit —
    // sinon le stylo semblerait hésiter au milieu d'un mot.
    //
    // Le lettrage en compte deux, et non un seul comme je l'avais d'abord
    // supposé : l'espace entre « Bienvenue » et « chez », mais aussi la levée
    // après le « B », capitale détachée du « ienvenue » qui la suit.
    for (let i = 1; i < strokes.length; i++) {
      const trouEnTemps = strokes[i].delay - (strokes[i - 1].delay + strokes[i - 1].duration);
      const trouEnEspace = WELCOME_STROKES[i].start - WELCOME_STROKES[i - 1].end;

      expect(Math.sign(Math.round(trouEnTemps))).toBe(Math.sign(Math.round(trouEnEspace)));
    }
  });

  it('lève le stylo plus longuement entre les mots que dans un mot', () => {
    const trou = (i: number) => strokes[i].delay - (strokes[i - 1].delay + strokes[i - 1].duration);
    const entreMots = strokes.findIndex((s, i) => i > 8 && s.letter === 'c');

    expect(trou(entreMots)).toBeGreaterThan(trou(1));
  });

  it('supporte un lettrage vide', () => {
    expect(handwriting([])).toEqual([]);
  });
});

describe('penLift', () => {
  it("repère l'espace entre les deux mots", () => {
    // « Bienvenue » s'achève vers 66 % du parcours, « chez » reprend vers
    // 70 % : c'est la seule levée franche du stylo.
    expect(penLift(WELCOME_STROKES)).toBeGreaterThan(0.6);
    expect(penLift(WELCOME_STROKES)).toBeLessThan(0.72);
  });

  it('se rabat sur une valeur sensée quand il n\'y a rien à mesurer', () => {
    const collees: WelcomeStroke[] = [
      { letter: 'a', start: 0, end: 10, d: '' },
      { letter: 'b', start: 10, end: 20, d: '' },
    ];

    expect(penLift([])).toBeGreaterThan(0);
    expect(penLift(collees)).toBeGreaterThan(0);
  });
});

describe('introTiming', () => {
  const t = introTiming(WELCOME_STROKES);

  it('conserve exactement le minutage de la cascade remplacée', () => {
    // La consigne était de changer la nature de l'animation, pas sa durée.
    expect(t.outroStart).toBe(ANCIEN_MINUTAGE.fin);
    expect(t.finalDelay).toBe(ANCIEN_MINUTAGE.relais);
    expect(t.total).toBe(ANCIEN_MINUTAGE.total);
  });

  it("fait entrer le titre pendant que la main écrit encore", () => {
    // Le titre profite de la levée du stylo entre les deux mots. Le faire
    // attendre la fin de l'écriture laisserait un temps mort, et la
    // composition de l'affiche ne se formerait jamais sous les yeux.
    expect(t.titleDelay).toBeGreaterThan(0);
    expect(t.titleDelay).toBeLessThan(t.writeSpan);
  });

  it('laisse au titre le temps de se poser sans à-coup', () => {
    // Une entrée trop courte paraît sèche — c'était le défaut de la première
    // version, à 800 ms. Le titre a le droit de déborder sur la fin de
    // l'écriture : il achève de se préciser pendant le dernier mot. En
    // revanche il doit être posé avant que le relais ne commence, sinon trois
    // mouvements se superposeraient à l'écran.
    expect(t.titleDuration).toBeGreaterThanOrEqual(1000);
    expect(t.titleDelay + t.titleDuration).toBeLessThan(t.finalDelay);
  });

  it('enchaîne les deux actes sans écran vide', () => {
    // Le reste de l'acte 2 entre avant que l'écriture ait fini de s'effacer :
    // les deux se croisent au lieu de laisser un trou.
    expect(t.finalDelay).toBeGreaterThan(t.outroStart);
    expect(t.finalDelay).toBeLessThan(t.total);
  });
});
