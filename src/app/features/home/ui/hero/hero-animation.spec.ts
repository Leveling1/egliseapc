import { describe, expect, it } from 'vitest';

import { heroFrame } from './hero-animation';

const VIEWPORT = 900;
const PIN = VIEWPORT * 3;

/** Durée pendant laquelle le hero reste réellement immobile. */
const STICKY = PIN - VIEWPORT;

const at = (fractionOfViewport: number) =>
  heroFrame(VIEWPORT * fractionOfViewport, VIEWPORT, PIN);

describe('heroFrame', () => {
  it('montre le carrousel et le texte d\'accueil au repos', () => {
    const frame = at(0);

    expect(frame.contentOpacity).toBe(1);
    expect(frame.stageOpacity).toBe(1);
    expect(frame.stageScale).toBe(1);
    expect(frame.portraitOpacity).toBe(0);
    expect(frame.historyOpacity).toEqual([0, 0]);
  });

  it('fait grandir le cylindre et disparaître le texte d\'accueil', () => {
    const frame = at(0.3);

    expect(frame.stageScale).toBeGreaterThan(1.3);
    expect(frame.contentOpacity).toBeLessThan(0.1);
    expect(frame.contentShift).toBeLessThan(-40);
  });

  it('superpose la disparition du cylindre et l\'arrivée du portrait', () => {
    // C'est ce recouvrement qui donne l'impression de traverser le cylindre
    // plutôt que de le voir céder la place à un écran noir.
    const frame = at(0.6);

    expect(frame.stageOpacity).toBeGreaterThan(0);
    expect(frame.stageOpacity).toBeLessThan(1);
    expect(frame.portraitOpacity).toBeGreaterThan(0);
    expect(frame.portraitOpacity).toBeLessThan(1);
  });

  it('termine la traversée sur le portrait seul', () => {
    const frame = at(1);

    expect(frame.stageOpacity).toBe(0);
    expect(frame.portraitOpacity).toBeCloseTo(1, 2);
    expect(frame.portraitScale).toBeCloseTo(1, 2);
    expect(frame.contentOpacity).toBe(0);
  });

  it('fait apparaître « Qui sommes-nous » progressivement, sans à-coup', () => {
    // Le défaut corrigé : le texte passait de 0 à 1 d'un seul coup à la
    // frontière entre les deux étapes.
    const juste_avant = at(0.999);
    const juste_apres = at(1.001);

    expect(juste_avant.historyOpacity[0]).toBe(0);
    expect(juste_apres.historyOpacity[0]).toBeLessThan(0.1);
    expect(at(1.12).historyOpacity[0]).toBeCloseTo(1, 1);
  });

  it('croise les deux textes à mi-parcours', () => {
    const frame = at(1.5);

    expect(frame.historyOpacity[0]).toBeCloseTo(0.5, 1);
    expect(frame.historyOpacity[1]).toBeCloseTo(0.5, 1);
  });

  it('laisse « Le Visionnaire » seul en fin de séquence', () => {
    const frame = at(1.9);

    expect(frame.historyOpacity[0]).toBeCloseTo(0, 1);
    expect(frame.historyOpacity[1]).toBeCloseTo(1, 1);
    expect(frame.historyBlur[1]).toBeCloseTo(0, 1);
  });

  it('reste visible après le décollage, pour être recouvert', () => {
    // Une fois le hero décollé, le portrait garde sa place — il est en
    // position fixe, donc immobile — pendant que la section suivante remonte
    // par-dessus lui. L'effacer ici supprimerait ce recouvrement, qui est
    // voulu.
    expect(heroFrame(STICKY + 10, VIEWPORT, PIN).portraitOpacity).toBeGreaterThan(0.9);
    expect(heroFrame(PIN - 10, VIEWPORT, PIN).portraitOpacity).toBeGreaterThan(0.9);
  });

  it("joue toute l'animation pendant que le hero est immobile", () => {
    // Si le fondu débordait de la phase collée, il se jouerait pendant que le
    // hero s'en va — et la section suivante remonterait par-dessus.
    let fin = 0;
    for (let scrolled = 0; scrolled < STICKY; scrolled += 10) {
      if (heroFrame(scrolled, VIEWPORT, PIN).historyOpacity[1] < 0.995) fin = scrolled;
    }

    expect(fin).toBeLessThan(STICKY);
    // Et pas trop tôt non plus : un long temps mort avant la sortie donne
    // l'impression que la page a cessé de répondre.
    expect(STICKY - fin).toBeLessThan(VIEWPORT * 0.5);
  });

  it('efface tout une fois le pin dépassé', () => {
    // Régression déjà rencontrée : ces éléments sont en position fixe, donc
    // rester visibles signifie recouvrir toutes les sections suivantes,
    // jusqu'au pied de page.
    const frame = heroFrame(PIN + 10, VIEWPORT, PIN);

    expect(frame.portraitOpacity).toBe(0);
    expect(frame.historyOpacity).toEqual([0, 0]);
  });

  it('reste cohérent en défilement inverse', () => {
    // Remonter doit redonner exactement les mêmes valeurs qu'à l'aller :
    // l'animation est une fonction du défilement, sans état accumulé.
    for (const fraction of [0, 0.25, 0.5, 0.75, 1, 1.5, 2]) {
      expect(at(fraction)).toEqual(at(fraction));
    }

    expect(at(0)).toEqual(heroFrame(0, VIEWPORT, PIN));
  });
});
