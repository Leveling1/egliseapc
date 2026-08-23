import { describe, expect, it } from 'vitest';

import {
  NARROW_MAX_WIDTH,
  advanceParallax,
  advanceSpring,
  amplitudesFor,
  columnShift,
  columnsFor,
  distributeColumns,
  masonryLayout,
  startGridCentre,
  wideColumnCount,
  initialSprings,
  latchProgress,
  mapRange,
  narrowAmplitudes,
  parallaxTargets,
  referenceAmplitudes,
  scrollProgress,
  type Proportioned,
  type SpringState,
} from './parallax-motion';

const AU_REPOS: SpringState = { value: 0, velocity: 0 };
const LARGE = referenceAmplitudes(800, 1.9);
const ETROIT = narrowAmplitudes(812, 1.9);

describe('scrollProgress', () => {
  it("vaut zéro quand la section touche le haut de l'écran", () => {
    expect(scrollProgress(0, 800)).toBe(0);
  });

  it('vaut un après la course prévue', () => {
    expect(scrollProgress(-800, 800)).toBe(1);
  });

  it('progresse linéairement entre les deux', () => {
    expect(scrollProgress(-400, 800)).toBeCloseTo(0.5, 6);
  });

  it('reste borné avant et après', () => {
    expect(scrollProgress(500, 800)).toBe(0);
    expect(scrollProgress(-9000, 800)).toBe(1);
  });

  it('se rapporte à une course fixe, non à la hauteur du mur', () => {
    // C'est le changement de fond : la hauteur de la section est désormais
    // celle du mur, donc celle de ses photos. Y rapporter la progression
    // ferait s'allonger l'entrée à chaque photo ajoutée.
    expect(scrollProgress(-400, 800)).toBe(scrollProgress(-400, 800));
  });

  it('supporte une course nulle', () => {
    expect(scrollProgress(0, 0)).toBe(0);
  });
});

describe('mapRange', () => {
  it('interpole entre les deux bornes', () => {
    expect(mapRange(0.5, 0, 1, 0, 1000)).toBe(500);
  });

  it('borne au-delà des extrémités', () => {
    expect(mapRange(2, 0, 1, 0, 1000)).toBe(1000);
    expect(mapRange(-1, 0, 1, 0, 1000)).toBe(0);
  });

  it("supporte un intervalle d'entrée vide", () => {
    expect(mapRange(5, 3, 3, 10, 20)).toBe(10);
  });
});

describe('parallaxTargets', () => {
  it("part incliné, effacé, remonté et décalé", () => {
    const t = parallaxTargets(0, LARGE);

    expect(t.rotateX).toBe(15);
    expect(t.rotateZ).toBe(20);
    expect(t.translateY).toBe(-700);
    expect(t.opacity).toBeCloseTo(0.2, 6);
    expect(t.columnOffset).toBe(LARGE.columnOffset);
    expect(t.scale).toBe(LARGE.scaleFrom);
    expect(t.spread).toBe(1);
  });

  it('arrive sur un mur strictement nu', () => {
    // C'est toute la demande : l'état final est la galerie à sa place, sans
    // la moindre transformation résiduelle.
    const t = parallaxTargets(1, LARGE);

    expect(t.rotateX).toBe(0);
    expect(t.rotateZ).toBe(0);
    expect(t.translateY).toBe(0);
    expect(t.opacity).toBe(1);
    expect(t.columnOffset).toBe(0);
    expect(t.scale).toBe(1);
    expect(t.spread).toBe(0);
  });

  it('redresse le mur avant de ranger ses colonnes', () => {
    // Le « ensuite » demandé : le mur se pose d'abord, ses colonnes se
    // rangent après. À mi-course tout est déjà droit, mais le décalage
    // subsiste.
    const t = parallaxTargets(0.5, LARGE);

    expect(t.rotateX).toBe(0);
    expect(t.rotateZ).toBe(0);
    expect(t.opacity).toBe(1);
    expect(t.columnOffset).toBeGreaterThan(0);
    // Le mur est encore agrandi : c'est pendant ce second temps que les photos
    // tranchées par le bord regagnent le cadre.
    expect(t.scale).toBeGreaterThan(1);
  });

  it('ne fait plus décroître que le décalage au-delà du redressement', () => {
    const a = parallaxTargets(0.6, LARGE);
    const b = parallaxTargets(0.9, LARGE);

    expect(a.translateY).toBe(b.translateY);
    expect(b.columnOffset).toBeLessThan(a.columnOffset);
    expect(b.scale).toBeLessThan(a.scale);
  });
});

describe('amplitudesFor', () => {
  it("conserve l'état de départ de la référence sur écran large", () => {
    // Consigne explicite : l'état initial ne change pas.
    const a = amplitudesFor(1280, 800);

    expect(a.rotateX).toBe(15);
    expect(a.rotateZ).toBe(20);
    expect(a.liftFrom).toBe(-700);
  });

  it('bascule sur des amplitudes accordées à un écran étroit', () => {
    const a = amplitudesFor(375, 812);

    expect(a.rotateZ).toBeLessThan(20);
    expect(a.liftFrom).toBeGreaterThan(-700);
  });

  it('exprime la remontée en proportion de la hauteur', () => {
    // C'était la cause du défaut sur téléphone : 700 px valaient 86 % de la
    // hauteur d'un écran de 812, et la galerie s'ouvrait sur un vide.
    const petit = narrowAmplitudes(600);
    const grand = narrowAmplitudes(900);

    expect(Math.abs(petit.liftFrom) / 600).toBeCloseTo(Math.abs(grand.liftFrom) / 900, 6);
    expect(Math.abs(petit.liftFrom)).toBeLessThan(600 * 0.5);
  });

  it('décale les colonnes plus discrètement sur écran étroit', () => {
    expect(narrowAmplitudes(812).columnOffset).toBeLessThan(
      referenceAmplitudes(812).columnOffset,
    );
  });

  it('place la bascule à la largeur annoncée', () => {
    expect(amplitudesFor(NARROW_MAX_WIDTH, 800).rotateZ).toBe(10);
    expect(amplitudesFor(NARROW_MAX_WIDTH + 1, 800).rotateZ).toBe(20);
  });
});

describe('latchProgress', () => {
  it('suit la progression tant quelle avance', () => {
    expect(latchProgress(0.3, 0.5)).toBe(0.5);
  });

  it('ne redescend jamais', () => {
    // Le défaut corrigé : remonter pour regarder une photo de plus près
    // renvoyait le mur à sa position de départ. La galerie se dérobait à qui
    // voulait l'examiner.
    expect(latchProgress(0.8, 0.2)).toBe(0.8);
    expect(latchProgress(1, 0)).toBe(1);
  });

  it('reste stable une fois le mur rangé', () => {
    let p = 0;
    for (const mesure of [0.4, 0.9, 1, 0.6, 0.1, 0]) p = latchProgress(p, mesure);

    expect(p).toBe(1);
  });
});



describe('columnShift', () => {
  it("s'annule quand le décalage est résorbé", () => {
    // `toBeCloseTo` et non `toBe` : les rangs à motif négatif rendent -0, que
    // l'égalité stricte distingue de 0 alors qu'aucun pixel ne les sépare.
    for (let i = 0; i < 5; i++) expect(columnShift(0, i)).toBeCloseTo(0, 10);
  });

  it('fait alterner le sens des colonnes voisines', () => {
    expect(Math.sign(columnShift(100, 0))).not.toBe(Math.sign(columnShift(100, 1)));
    expect(Math.sign(columnShift(100, 1))).not.toBe(Math.sign(columnShift(100, 2)));
  });

  it('ne fait pas repartir ensemble la première et la troisième colonne', () => {
    // Avec une simple alternance, un mur à trois colonnes n'en montrerait
    // qu'une décalée au milieu de deux jumelles.
    expect(columnShift(100, 0)).not.toBeCloseTo(columnShift(100, 2), 3);
  });

  it("ne dépasse jamais l'amplitude demandée", () => {
    for (let i = 0; i < 8; i++) expect(Math.abs(columnShift(100, i))).toBeLessThanOrEqual(100);
  });
});

describe('columnsFor', () => {
  it('resserre le mur à deux colonnes sur écran étroit', () => {
    expect(columnsFor(375)).toBe(2);
    expect(columnsFor(NARROW_MAX_WIDTH)).toBe(2);
  });

  it('en donne trois au-delà', () => {
    expect(columnsFor(NARROW_MAX_WIDTH + 1)).toBe(3);
    expect(columnsFor(1920)).toBe(3);
  });
});

describe('distributeColumns', () => {
  const photo = (width: number, height: number): Proportioned => ({ width, height });

  it('rend le nombre de colonnes demandé', () => {
    expect(distributeColumns([photo(3, 2), photo(3, 2)], 3)).toHaveLength(3);
  });

  it("n'égare aucune photo", () => {
    const photos = Array.from({ length: 12 }, () => photo(3, 2));
    const colonnes = distributeColumns(photos, 3);

    expect(colonnes.flat()).toHaveLength(12);
  });

  it("ne laisse jamais un écart supérieur à la plus haute photo", () => {
    // C'est la garantie du placement au plus court, et la bonne borne à
    // vérifier — j'avais d'abord exigé un équilibre que ce placement ne
    // promet pas : il traite les photos dans l'ordre reçu, sans les trier,
    // parce que l'ordre d'une galerie a un sens.
    //
    // La garantie tient parce qu'une colonne ne dépasse le minimum qu'après
    // avoir reçu une photo alors qu'elle était elle-même la plus courte : son
    // avance ne peut donc excéder la hauteur de cette photo.
    const photos = [
      photo(3, 2), // 0,67
      photo(2, 3), // 1,50
      photo(1, 1), // 1,00
      photo(3, 2),
      photo(2, 3),
      photo(1, 1),
      photo(3, 2),
      photo(2, 3),
      photo(1, 1),
    ];
    const hauteurs = distributeColumns(photos, 3).map((c) =>
      c.reduce((total, p) => total + p.height / p.width, 0),
    );
    const plusHaute = Math.max(...photos.map((p) => p.height / p.width));

    expect(Math.max(...hauteurs) - Math.min(...hauteurs)).toBeLessThanOrEqual(plusHaute);
  });

  it('égalise parfaitement des photos de même format', () => {
    // Le cas du site aujourd'hui : douze photos au même rapport. Le bas du mur
    // doit alors être rigoureusement droit.
    const hauteurs = distributeColumns(
      Array.from({ length: 12 }, () => photo(3, 2)),
      3,
    ).map((c) => c.length);

    expect(hauteurs).toEqual([4, 4, 4]);
  });

  it('place chaque photo dans la colonne la plus courte', () => {
    const colonnes = distributeColumns([photo(1, 3), photo(1, 1), photo(1, 1)], 2);

    // La grande part seule ; les deux petites se rejoignent en face.
    expect(colonnes[0]).toHaveLength(1);
    expect(colonnes[1]).toHaveLength(2);
  });

  it('supporte une liste vide et un nombre de colonnes absurde', () => {
    expect(distributeColumns([], 3)).toEqual([[], [], []]);
    expect(distributeColumns([photo(3, 2)], 0)).toEqual([]);
  });

  it('ignore une photo de largeur nulle', () => {
    // Une division par zéro contaminerait la hauteur de sa colonne, et donc
    // toute la répartition qui suit.
    const colonnes = distributeColumns([photo(0, 100), photo(3, 2)], 2);

    expect(colonnes.flat()).toHaveLength(1);
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
    // dépassement est précisément ce qui lui donne sa souplesse.
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
    // et projetterait le mur hors de l'écran.
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
    const springs = initialSprings(0.6, ETROIT);
    const cible = parallaxTargets(0.6, ETROIT);

    expect(springs.spread.value).toBe(cible.spread);
    expect(springs.opacity.value).toBe(cible.opacity);
  });

  it('converge vers le mur nu', () => {
    let springs = initialSprings(0, LARGE);
    for (let i = 0; i < 240; i++) springs = advanceParallax(springs, 1, 1 / 60, LARGE);

    expect(springs.rotateX.value).toBeCloseTo(0, 2);
    expect(springs.rotateZ.value).toBeCloseTo(0, 2);
    expect(springs.translateY.value).toBeCloseTo(0, 1);
    expect(springs.columnOffset.value).toBeCloseTo(0, 1);
    expect(springs.scale.value).toBeCloseTo(1, 3);
    expect(springs.spread.value).toBeCloseTo(0, 3);
    expect(springs.opacity.value).toBeCloseTo(1, 2);
  });
});


describe('wideColumnCount', () => {
  it('ajoute une colonne au mur définitif', () => {
    expect(wideColumnCount(3)).toBe(4);
    expect(wideColumnCount(2)).toBe(3);
  });

  it("s'en tient à une seule", () => {
    // La surface des photos étant fixe, élargir la grille la raccourcit :
    // mesuré sur la page, quatre colonnes couvrent 71 % de l'écran de départ
    // et cinq n'en couvrent plus que 51 %.
    expect(wideColumnCount(3) - 3).toBe(1);
  });
});

describe('masonryLayout', () => {
  const photo = (width: number, height: number): Proportioned => ({ width, height });
  const carres = Array.from({ length: 6 }, () => photo(100, 100));

  it('aligne les colonnes sur la largeur et le pas demandés', () => {
    const l = masonryLayout(carres, 3, 200, 20);

    expect(l.cells[0].x).toBe(0);
    expect(l.cells[1].x).toBe(220);
    expect(l.cells[2].x).toBe(440);
    expect(l.width).toBe(3 * 200 + 2 * 20);
  });

  it('empile la seconde rangée sous la première', () => {
    const l = masonryLayout(carres, 3, 200, 20);

    // Photos carrées : une case fait 200 de haut, plus 20 de pas.
    expect(l.cells[3].y).toBe(220);
    expect(l.height).toBe(2 * 200 + 20);
  });

  it('place chaque photo dans la colonne la plus courte', () => {
    const l = masonryLayout([photo(1, 3), photo(1, 1), photo(1, 1)], 2, 100, 0);

    // La haute occupe la première colonne ; les deux basses se suivent dans
    // la seconde.
    expect(l.cells[0]).toEqual({ x: 0, y: 0 });
    expect(l.cells[1]).toEqual({ x: 100, y: 0 });
    expect(l.cells[2]).toEqual({ x: 100, y: 100 });
  });

  it('range les mêmes photos autrement selon le nombre de colonnes', () => {
    // C'est tout le réagencement : une photo qui débordait à droite dans la
    // grille large se retrouve plus bas dans le mur.
    //
    // Douze photos et non six : à six, quatre colonnes comme trois donnent
    // deux rangées, et la grille large n'est pas plus courte. Il faut de quoi
    // faire une rangée d'écart pour que la propriété se voie.
    const douze = Array.from({ length: 12 }, () => photo(100, 100));
    const large = masonryLayout(douze, 4, 100, 0);
    const mur = masonryLayout(douze, 3, 100, 0);

    expect(large.width).toBeGreaterThan(mur.width);
    expect(large.height).toBeLessThan(mur.height);
    expect(large.cells).not.toEqual(mur.cells);
  });

  it('reste cohérent avec la répartition en paquets', () => {
    // Les deux suivent la même règle : une photo ne peut pas tomber dans une
    // colonne ici et dans une autre là.
    const colonnes = distributeColumns(carres, 3);
    const l = masonryLayout(carres, 3, 200, 20);
    const parColonne = new Map<number, number>();
    for (const cell of l.cells) parColonne.set(cell.x, (parColonne.get(cell.x) ?? 0) + 1);

    expect([...parColonne.values()].sort()).toEqual(colonnes.map((c) => c.length).sort());
  });

  it('supporte une liste vide', () => {
    expect(masonryLayout([], 3, 200, 20)).toEqual({ cells: [], width: 0, height: 0 });
  });
});

describe('startGridCentre', () => {
  const MUR = 1778;
  const ECRAN = 820;
  const REMONTEE = -700;

  it("compense la remontée et l'agrandissement", () => {
    // Vérification par le calcul inverse : le centre trouvé doit bien
    // atterrir au milieu de l'écran, à la retouche près.
    const zoom = 2.4;
    const centre = startGridCentre(MUR, ECRAN, REMONTEE, zoom);
    const ecran = MUR + REMONTEE + zoom * (centre - MUR);

    expect(ecran).toBeCloseTo(ECRAN / 2 + zoom * 120, 6);
  });

  it("remonte d'autant moins que l'agrandissement est fort", () => {
    // Plus on agrandit, plus un écart au centre du mur est amplifié : il faut
    // donc poser la grille plus près de ce centre.
    const faible = Math.abs(startGridCentre(MUR, ECRAN, REMONTEE, 1.4) - MUR);
    const fort = Math.abs(startGridCentre(MUR, ECRAN, REMONTEE, 2.6) - MUR);

    expect(fort).toBeLessThan(faible);
  });

  it("se protège d'un agrandissement absurde", () => {
    expect(startGridCentre(MUR, ECRAN, REMONTEE, 0)).toBe(MUR);
  });
});
