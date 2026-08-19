import { describe, expect, it } from 'vitest';

import { cardTransform, cylinderGeometry, fillCylinder } from './cylinder-geometry';

const desktop = () =>
  cylinderGeometry({
    containerWidth: 1280,
    containerHeight: 720,
    axis: 'horizontal',
    gap: 10,
    aspectRatio: 0.7,
  });

const phone = () =>
  cylinderGeometry({
    containerWidth: 390,
    containerHeight: 780,
    axis: 'vertical',
    gap: 10,
    aspectRatio: 0.7,
  });

/** Échelle appliquée par la perspective à un point situé à la profondeur z. */
const scaleAt = (perspective: number, z: number) => perspective / (perspective - z);

describe('cylinderGeometry', () => {
  it('déduit un rayon qui remplit la largeur disponible', () => {
    const geometry = desktop();

    // La silhouette du cylindre mesure 2 × rayon : elle doit couvrir
    // l'essentiel du cadre, faute de quoi le carrousel flotte au milieu du
    // noir au lieu d'aller d'un bord à l'autre.
    expect(2 * geometry.radius).toBeGreaterThan(1280 * 0.85);
  });

  it('produit assez de cartes pour une paroi continue', () => {
    const geometry = desktop();

    // La moitié des cartes fait face au spectateur, l'autre est masquée par
    // `backface-visibility`. Il en faut donc le double de ce qu'on veut voir.
    expect(geometry.count).toBeGreaterThanOrEqual(12);
    expect(Math.floor(geometry.count / 2)).toBeGreaterThanOrEqual(6);
  });

  it('garde les cartes à distance raisonnable de l\'œil', () => {
    const geometry = desktop();

    // C'était le défaut du premier essai : avec une perspective fixe, la
    // paroi avant frôlait l'œil et les cartes fonçaient sur le spectateur.
    const nearest = scaleAt(geometry.perspective, geometry.radius);
    const farthest = scaleAt(geometry.perspective, -geometry.radius);

    expect(nearest / farthest).toBeLessThan(3);
    expect(geometry.perspective - geometry.radius).toBeGreaterThan(geometry.radius);
  });

  it('conserve ce rapport quelle que soit la taille de l\'écran', () => {
    // La distance de l'œil suit le rayon : l'allure du cylindre ne dépend
    // donc pas de la taille du cadre.
    const petit = cylinderGeometry({
      containerWidth: 900, containerHeight: 600,
      axis: 'horizontal', gap: 10, aspectRatio: 0.7,
    });
    const grand = cylinderGeometry({
      containerWidth: 2400, containerHeight: 1300,
      axis: 'horizontal', gap: 10, aspectRatio: 0.7,
    });

    const rapport = (g: typeof petit) =>
      scaleAt(g.perspective, g.radius) / scaleAt(g.perspective, -g.radius);

    expect(rapport(petit)).toBeCloseTo(rapport(grand), 5);
  });

  it('bascule sur la hauteur en rotation verticale', () => {
    const geometry = phone();

    // Sur téléphone la largeur manque mais la hauteur abonde : c'est elle
    // qui doit dicter le rayon.
    expect(2 * geometry.radius).toBeGreaterThan(780 * 0.85);
  });

  it('élargit les cartes en rotation verticale sans toucher à leur hauteur', () => {
    const geometry = phone();

    // La largeur ne participe pas à la géométrie quand le cylindre tourne
    // autour de l'axe horizontal : on peut l'élargir librement.
    expect(geometry.cardWidth).toBeGreaterThan(geometry.cardHeight);
  });

  it("garde la carte la plus proche à l'intérieur de l'écran", () => {
    // Le défaut du premier essai : la perspective agrandit les cartes de
    // premier plan, si bien qu'une largeur nominale trop généreuse les
    // faisait déborder largement du cadre.
    const geometry = phone();
    const agrandissement = geometry.perspective / (geometry.perspective - geometry.radius);

    expect(geometry.cardWidth * agrandissement).toBeLessThanOrEqual(390);
  });

  it("n'étire pas les cartes à l'excès sur un écran large en vertical", () => {
    const tablette = cylinderGeometry({
      containerWidth: 760, containerHeight: 1024,
      axis: 'vertical', gap: 10, aspectRatio: 0.7,
    });

    expect(tablette.cardWidth / tablette.cardHeight).toBeLessThanOrEqual(2.2);
  });

  it('respecte le rapport demandé en rotation horizontale', () => {
    // Ce rapport ne vaut qu'en rotation horizontale : c'est là que la largeur
    // des cartes détermine leur répartition sur le cylindre. En rotation
    // verticale, c'est la hauteur qui joue ce rôle et la largeur est libre.
    expect(desktop().cardWidth / desktop().cardHeight).toBeCloseTo(0.7, 5);
  });

  it('fait tourner les cartes autour du bon axe', () => {
    expect(cardTransform(desktop(), 1)).toContain('rotateY');
    expect(cardTransform(phone(), 1)).toContain('rotateX');
  });

  it('répartit les cartes régulièrement sur un tour complet', () => {
    const geometry = desktop();

    expect(geometry.stepAngle * geometry.count).toBeCloseTo(360, 5);
    expect(cardTransform(geometry, 0)).toContain('(0deg)');
  });
});

describe('fillCylinder', () => {
  it('répète les images fournies pour fermer le cylindre', () => {
    // Un cylindre incomplet laisserait un trou qui passe devant le
    // spectateur à chaque tour.
    const rempli = fillCylinder(['a', 'b', 'c'], 8);

    expect(rempli).toHaveLength(8);
    expect(rempli).toEqual(['a', 'b', 'c', 'a', 'b', 'c', 'a', 'b']);
  });

  it('ne produit rien sans image', () => {
    expect(fillCylinder([], 12)).toEqual([]);
  });
});
