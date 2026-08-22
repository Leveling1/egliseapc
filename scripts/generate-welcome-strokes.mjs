/**
 * Extrait les lettres de « Bienvenue chez » depuis le SVG fourni, mesure leur
 * position horizontale, et en écrit un module TypeScript.
 *
 * Pourquoi une génération plutôt qu'une saisie à la main : le fichier compte
 * treize tracés de plus de mille caractères chacun. Les recopier serait une
 * source d'erreurs silencieuses, et les mesures seraient invérifiables.
 *
 * Ce que l'on mesure, et pourquoi c'est l'abscisse : l'écriture est révélée
 * par un balayage qui progresse de gauche à droite à vitesse constante, comme
 * une main qui avance. Le moment où une lettre apparaît est donc dicté par sa
 * position horizontale, et sa durée par sa largeur. Les lettres cursives se
 * chevauchent — la levée du « B » passe sous le « i » — et ce chevauchement se
 * traduit naturellement en fenêtres de temps qui se recouvrent.
 *
 *   node scripts/generate-welcome-strokes.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';

const SOURCE = 'public/icons/welcome_to.svg';
const TARGET = 'src/app/features/home/ui/hero/welcome-strokes.ts';

/* ---------------------------------------------------------------- parsing */

function tokenize(d) {
  return d.match(/[MmLlHhVvCcSsQqTtAaZz]|-?\d*\.?\d+(?:[eE][-+]?\d+)?/g) ?? [];
}

/** Extremums d'une courbe cubique sur un axe, racines de la dérivée. */
function cubicExtrema(p0, p1, p2, p3) {
  const a = -p0 + 3 * p1 - 3 * p2 + p3;
  const b = 2 * (p0 - 2 * p1 + p2);
  const c = p1 - p0;
  const out = [p0, p3];
  const push = (t) => {
    if (t > 0 && t < 1) {
      const u = 1 - t;
      out.push(u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3);
    }
  };

  if (Math.abs(a) < 1e-12) {
    if (Math.abs(b) > 1e-12) push(-c / b);
  } else {
    const disc = b * b - 4 * a * c;
    if (disc >= 0) {
      const r = Math.sqrt(disc);
      push((-b + r) / (2 * a));
      push((-b - r) / (2 * a));
    }
  }
  return out;
}

/** Extremums d'une courbe quadratique sur un axe. */
function quadExtrema(p0, p1, p2) {
  const out = [p0, p2];
  const den = p0 - 2 * p1 + p2;
  if (Math.abs(den) > 1e-12) {
    const t = (p0 - p1) / den;
    if (t > 0 && t < 1) {
      const u = 1 - t;
      out.push(u * u * p0 + 2 * u * t * p1 + t * t * p2);
    }
  }
  return out;
}

/**
 * Points échantillonnés le long d'un arc elliptique.
 *
 * Premier essai écarté : encadrer l'arc par ses extrémités élargies de ses
 * rayons. C'est un majorant valide, mais bien trop lâche ici — le lettrage
 * emploie des arcs de rayon 60 pour de simples inflexions, et la boîte
 * obtenue débordait la viewBox de plus de cent unités.
 *
 * On repasse donc en paramétrisation par le centre, comme le prescrit la
 * spécification SVG, et on relève une vingtaine de points. L'erreur résiduelle
 * se compte en centièmes d'unité, sans commune mesure avec la précision utile.
 */
function arcPoints(x1, y1, rx, ry, phiDeg, fA, fS, x2, y2) {
  if (rx === 0 || ry === 0) return [[x2, y2]];

  const phi = (phiDeg * Math.PI) / 180;
  const cosP = Math.cos(phi);
  const sinP = Math.sin(phi);

  const dx = (x1 - x2) / 2;
  const dy = (y1 - y2) / 2;
  const x1p = cosP * dx + sinP * dy;
  const y1p = -sinP * dx + cosP * dy;

  // Rayons trop courts pour joindre les deux extrémités : la spécification
  // impose de les agrandir jusqu'à ce que l'arc devienne possible.
  const lambda = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
  if (lambda > 1) {
    const k = Math.sqrt(lambda);
    rx *= k;
    ry *= k;
  }

  const num = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p;
  const den = rx * rx * y1p * y1p + ry * ry * x1p * x1p;
  const coef = (fA !== fS ? 1 : -1) * Math.sqrt(Math.max(0, num / den));
  const cxp = (coef * rx * y1p) / ry;
  const cyp = (-coef * ry * x1p) / rx;

  const cx = cosP * cxp - sinP * cyp + (x1 + x2) / 2;
  const cy = sinP * cxp + cosP * cyp + (y1 + y2) / 2;

  const angle = (ux, uy, vx, vy) => {
    const sign = ux * vy - uy * vx < 0 ? -1 : 1;
    const cos = (ux * vx + uy * vy) / (Math.hypot(ux, uy) * Math.hypot(vx, vy));
    return sign * Math.acos(Math.min(1, Math.max(-1, cos)));
  };

  const ux = (x1p - cxp) / rx;
  const uy = (y1p - cyp) / ry;
  const vx = (-x1p - cxp) / rx;
  const vy = (-y1p - cyp) / ry;

  const theta = angle(1, 0, ux, uy);
  let sweep = angle(ux, uy, vx, vy);
  if (!fS && sweep > 0) sweep -= 2 * Math.PI;
  if (fS && sweep < 0) sweep += 2 * Math.PI;

  const STEPS = 24;
  const points = [];
  for (let i = 0; i <= STEPS; i++) {
    const t = theta + (sweep * i) / STEPS;
    points.push([
      cx + rx * cosP * Math.cos(t) - ry * sinP * Math.sin(t),
      cy + rx * sinP * Math.cos(t) + ry * cosP * Math.sin(t),
    ]);
  }
  return points;
}

/**
 * Boîte englobante d'un tracé.
 *
 * Les cubiques et les quadratiques sont traitées exactement, par les racines
 * de leur dérivée ; les arcs par échantillonnage.
 */
function boundingBox(d) {
  const t = tokenize(d);
  let i = 0;
  let cmd = '';
  let x = 0;
  let y = 0;
  let sx = 0;
  let sy = 0;
  let lastCx = 0;
  let lastCy = 0;
  let lastQx = 0;
  let lastQy = 0;
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  const see = (px, py) => {
    if (px < minX) minX = px;
    if (px > maxX) maxX = px;
    if (py < minY) minY = py;
    if (py > maxY) maxY = py;
  };
  const seeAll = (xs, ys) => {
    for (const v of xs) see(v, y);
    for (const v of ys) see(x, v);
  };

  const num = () => Number(t[i++]);

  while (i < t.length) {
    if (/[A-Za-z]/.test(t[i])) cmd = t[i++];
    // Une commande répétée sans être renommée : « M » enchaîné devient « L ».
    else if (cmd === 'M') cmd = 'L';
    else if (cmd === 'm') cmd = 'l';

    const upper = cmd.toUpperCase();
    const rel = cmd !== upper;
    const ox = rel ? x : 0;
    const oy = rel ? y : 0;

    switch (upper) {
      case 'M': {
        x = num() + ox;
        y = num() + oy;
        sx = x;
        sy = y;
        see(x, y);
        lastCx = x;
        lastCy = y;
        lastQx = x;
        lastQy = y;
        break;
      }
      case 'L': {
        x = num() + ox;
        y = num() + oy;
        see(x, y);
        lastCx = x;
        lastCy = y;
        lastQx = x;
        lastQy = y;
        break;
      }
      case 'H': {
        x = num() + ox;
        see(x, y);
        lastCx = x;
        lastCy = y;
        lastQx = x;
        lastQy = y;
        break;
      }
      case 'V': {
        y = num() + oy;
        see(x, y);
        lastCx = x;
        lastCy = y;
        lastQx = x;
        lastQy = y;
        break;
      }
      case 'C':
      case 'S': {
        let x1;
        let y1;
        if (upper === 'C') {
          x1 = num() + ox;
          y1 = num() + oy;
        } else {
          x1 = 2 * x - lastCx;
          y1 = 2 * y - lastCy;
        }
        const x2 = num() + ox;
        const y2 = num() + oy;
        const nx = num() + ox;
        const ny = num() + oy;
        seeAll(cubicExtrema(x, x1, x2, nx), cubicExtrema(y, y1, y2, ny));
        lastCx = x2;
        lastCy = y2;
        x = nx;
        y = ny;
        lastQx = x;
        lastQy = y;
        break;
      }
      case 'Q':
      case 'T': {
        let x1;
        let y1;
        if (upper === 'Q') {
          x1 = num() + ox;
          y1 = num() + oy;
        } else {
          x1 = 2 * x - lastQx;
          y1 = 2 * y - lastQy;
        }
        const nx = num() + ox;
        const ny = num() + oy;
        seeAll(quadExtrema(x, x1, nx), quadExtrema(y, y1, ny));
        lastQx = x1;
        lastQy = y1;
        x = nx;
        y = ny;
        lastCx = x;
        lastCy = y;
        break;
      }
      case 'A': {
        const rx = Math.abs(num());
        const ry = Math.abs(num());
        const phi = num();
        const fA = num() !== 0;
        const fS = num() !== 0;
        const nx = num() + ox;
        const ny = num() + oy;
        for (const [px, py] of arcPoints(x, y, rx, ry, phi, fA, fS, nx, ny)) see(px, py);
        x = nx;
        y = ny;
        lastCx = x;
        lastCy = y;
        lastQx = x;
        lastQy = y;
        break;
      }
      case 'Z': {
        x = sx;
        y = sy;
        break;
      }
      default:
        throw new Error('commande inconnue : ' + cmd);
    }
  }

  return { minX, maxX, minY, maxY };
}

/* ------------------------------------------------------------- extraction */

const svg = readFileSync(SOURCE, 'utf8');

const viewBox = svg.match(/viewBox="([^"]+)"/)?.[1];
if (!viewBox) throw new Error('viewBox absente de ' + SOURCE);

const raw = [...svg.matchAll(/<path\b([^>]*)>/g)].map((m) => {
  const d = m[1].match(/\bd="([^"]*)"/)?.[1];
  const transform = m[1].match(/\btransform="translate\(([-\d.]+)[ ,]+([-\d.]+)\)"/);
  if (!d) throw new Error('tracé sans attribut d');
  return { d, dx: transform ? Number(transform[1]) : 0, dy: transform ? Number(transform[2]) : 0 };
});

const first = raw[0];
if (!raw.every((p) => p.dx === first.dx && p.dy === first.dy)) {
  throw new Error('les tracés ne partagent pas la même translation');
}

const LETTERS = [...'Bienvenue chez'].filter((c) => c !== ' ');
if (LETTERS.length !== raw.length) {
  throw new Error(raw.length + ' tracés pour ' + LETTERS.length + ' lettres attendues');
}

const strokes = raw.map((p, index) => {
  const box = boundingBox(p.d);
  const origin = p.d.match(/M\s*(-?[\d.]+)[, ]\s*(-?[\d.]+)/);
  return {
    letter: LETTERS[index],
    d: p.d,
    start: box.minX + p.dx,
    end: box.maxX + p.dx,
    // Point où le stylo se pose. Distinct du bord gauche de la lettre : en
    // cursive une boucle peut repartir vers la gauche, par-dessus la lettre
    // précédente.
    origin: Number(origin[1]) + p.dx,
  };
});

// L'ordre des tracés doit suivre celui de l'écriture : c'est lui qui fait
// avancer le stylo. Un export qui les mélangerait écrirait dans le désordre,
// et le défaut serait difficile à diagnostiquer sur le rendu final.
//
// C'est bien le point de pose qu'on teste, et non le bord gauche de la
// lettre : les boîtes englobantes, elles, se chevauchent légitimement — la
// hampe du « h » déborde sur le « c » qui le précède. Exiger des boîtes
// disjointes reviendrait à refuser une écriture liée.
for (let i = 1; i < strokes.length; i++) {
  if (strokes[i].origin < strokes[i - 1].origin) {
    throw new Error('tracé ' + (i + 1) + ' (' + strokes[i].letter + ') se pose avant le précédent');
  }
}

const spanStart = Math.min(...strokes.map((s) => s.start));
const spanEnd = Math.max(...strokes.map((s) => s.end));

// Le lettrage doit tenir dans sa viewBox : c'est ce qu'affirme le fichier
// d'origine, et le mesurer nous-mêmes vérifie du même coup notre calcul de
// boîte englobante. Une première version, qui encadrait les arcs par leurs
// rayons, débordait de plus de cent unités — sans ce contrôle, l'erreur se
// serait vue non pas ici mais dans le minutage, où elle aurait été bien plus
// difficile à rattacher à sa cause.
const [, , boxWidth] = viewBox.split(/[\s,]+/).map(Number);
const TOLERANCE = 1;
if (spanStart < -TOLERANCE || spanEnd > boxWidth + TOLERANCE) {
  throw new Error(
    `le lettrage mesuré (${spanStart.toFixed(1)} → ${spanEnd.toFixed(1)}) ` +
      `déborde la viewBox (0 → ${boxWidth})`,
  );
}

/* --------------------------------------------------------------- écriture */

const body = strokes
  .map(
    (s) =>
      "  {\n    letter: '" +
      s.letter +
      "',\n    start: " +
      s.start.toFixed(2) +
      ',\n    end: ' +
      s.end.toFixed(2) +
      ",\n    d: '" +
      s.d +
      "',\n  },",
  )
  .join('\n');

const file = `/**
 * Lettres de « Bienvenue chez », extraites de ${SOURCE}.
 *
 * FICHIER GÉNÉRÉ — ne pas modifier à la main.
 * Régénérer avec : node scripts/generate-welcome-strokes.mjs
 *
 * Chaque entrée est une lettre du lettrage, avec les abscisses où elle
 * commence et se termine dans le repère de la viewBox. Ces deux nombres
 * suffisent à minuter l'écriture : le balayage traverse le mot à vitesse
 * constante, chaque lettre s'inscrivant pendant qu'il franchit sa largeur.
 */

export interface WelcomeStroke {
  /** Lettre représentée, à titre documentaire. */
  readonly letter: string;
  /** Abscisse du bord gauche de la lettre, dans le repère de la viewBox. */
  readonly start: number;
  /** Abscisse de son bord droit. */
  readonly end: number;
  /** Contour de la lettre. */
  readonly d: string;
}

export const WELCOME_VIEWBOX = '${viewBox}';

/**
 * Translation portée par les tracés dans le fichier d'origine.
 *
 * Conservée telle quelle et appliquée à un groupe unique, plutôt que répétée
 * sur chaque tracé comme dans l'export.
 */
export const WELCOME_TRANSFORM = 'translate(${first.dx} ${first.dy})';

/** Abscisses extrêmes du lettrage, bornes du balayage. */
export const WELCOME_SPAN = { start: ${spanStart.toFixed(2)}, end: ${spanEnd.toFixed(2)} } as const;

export const WELCOME_STROKES: readonly WelcomeStroke[] = [
${body}
];
`;

writeFileSync(TARGET, file, 'utf8');

console.log(strokes.length + ' lettres écrites dans ' + TARGET);
console.log('balayage de ' + spanStart.toFixed(1) + ' à ' + spanEnd.toFixed(1));
for (const s of strokes) {
  const pc = (v) => (((v - spanStart) / (spanEnd - spanStart)) * 100).toFixed(1).padStart(5);
  console.log('  ' + s.letter + '  ' + pc(s.start) + '% → ' + pc(s.end) + '%');
}
