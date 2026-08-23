/**
 * Relève les dimensions réelles des photos de la galerie et en écrit un module
 * TypeScript.
 *
 * Pourquoi les connaître au build plutôt que dans le navigateur : le mur
 * conserve les proportions de chaque photo, donc la hauteur d'une vignette ne
 * se déduit que de son rapport. Attendre le chargement de l'image pour
 * l'apprendre ferait s'effondrer puis se rétablir toute la mise en page sous
 * les yeux du visiteur. Portées en attributs `width` et `height`, elles
 * permettent au navigateur de réserver la place dès la lecture du HTML — y
 * compris sur le HTML prérendu, avant que le moindre script ne s'exécute.
 *
 *   node scripts/generate-gallery-photos.mjs
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Dossiers lus, dans l'ordre.
 *
 * `galerie` est le dossier propre à cette page ; `home` fournit en plus les
 * photos du carrousel d'accueil, qui n'ont pas de raison d'être absentes de la
 * galerie. Le préfixe ne sert qu'à ce second dossier, où toutes les images ne
 * sont pas des photos — il s'y trouve aussi le logo et des fonds.
 */
const SOURCES = [
  { dir: 'public/images/galerie', url: '/images/galerie', prefix: '' },
  { dir: 'public/images/home', url: '/images/home', prefix: 'hero_' },
];

const TARGET = 'src/app/features/gallery/data/gallery-photos.ts';

/**
 * Dimensions d'un JPEG, lues dans son en-tête.
 *
 * On parcourt les segments jusqu'au marqueur de début de trame (SOFn), seul à
 * porter la taille de l'image. Les marqueurs DHT, DAC et RSTn partagent la
 * même plage sans être des SOF : ils sont écartés.
 */
function jpegSize(buffer) {
  let offset = 2;

  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset++;
      continue;
    }

    const marker = buffer[offset + 1];
    const isStartOfFrame =
      marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;

    if (isStartOfFrame) {
      return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) };
    }

    offset += 2 + buffer.readUInt16BE(offset + 2);
  }

  return null;
}

/** Trie « hero_2 » avant « hero_10 », ce que l'ordre alphabétique ne fait pas. */
function naturalOrder(a, b) {
  const number = (name) => Number(name.replace(/\D+/g, '')) || 0;
  return number(a) - number(b);
}

/**
 * Entrelace deux listes en répartissant la plus courte dans la plus longue.
 *
 * Sans cela, les portraits — tous rangés dans le même dossier — se
 * retrouveraient groupés en tête, et le mur commencerait par une bande de
 * photos hautes suivie d'un bloc de photos larges. Le placement au plus court
 * équilibrerait bien les hauteurs, mais l'œil verrait deux zones au lieu d'un
 * mur. Les alterner les mêle d'un bout à l'autre.
 */
function interleave(long, short) {
  if (short.length === 0) return long;
  if (long.length === 0) return short;

  const out = [];
  const every = long.length / short.length;
  let next = 0;

  for (let i = 0; i < long.length; i++) {
    if (next < short.length && i >= next * every) out.push(short[next++]);
    out.push(long[i]);
  }
  while (next < short.length) out.push(short[next++]);

  return out;
}

function readSource({ dir, url, prefix }) {
  let names;
  try {
    names = readdirSync(dir);
  } catch {
    return [];
  }

  return names
    .filter((name) => name.startsWith(prefix) && /\.jpe?g$/i.test(name))
    .sort(naturalOrder)
    .map((name) => {
      const path = join(dir, name);
      const size = jpegSize(readFileSync(path));

      if (!size || !size.width || !size.height) {
        throw new Error(`dimensions illisibles : ${path}`);
      }

      return { src: `${url}/${name}`, ...size, weight: statSync(path).size };
    });
}

const groups = SOURCES.map(readSource).filter((group) => group.length > 0);

if (groups.length === 0) {
  throw new Error(`aucune photo trouvée dans ${SOURCES.map((s) => s.dir).join(' ni ')}`);
}

// Les portraits d'un dossier se mêlent aux paysages de l'autre plutôt que de
// les suivre en bloc.
const photos = groups
  .sort((a, b) => b.length - a.length)
  .reduce((merged, group) => interleave(merged, group));

const body = photos
  .map((p) => `  { src: '${p.src}', width: ${p.width}, height: ${p.height} },`)
  .join('\n');

writeFileSync(
  TARGET,
  `/**
 * Photos de la galerie, avec leurs dimensions réelles.
 *
 * FICHIER GÉNÉRÉ — ne pas modifier à la main.
 * Régénérer avec : node scripts/generate-gallery-photos.mjs
 *
 * Les dimensions ne sont pas décoratives : le mur conserve les proportions de
 * chaque photo, et ce sont elles qui permettent au navigateur de réserver la
 * bonne place avant même que l'image n'arrive. Sans elles, la mise en page se
 * réorganiserait sous les yeux du visiteur au fur et à mesure des chargements.
 *
 * Pour ajouter des photos : déposer les fichiers dans public/images/galerie,
 * puis relancer le script.
 */

export interface GalleryPhotoSource {
  readonly src: string;
  /** Largeur réelle du fichier, en pixels. */
  readonly width: number;
  /** Hauteur réelle du fichier, en pixels. */
  readonly height: number;
}

export const GALLERY_PHOTOS: readonly GalleryPhotoSource[] = [
${body}
];
`,
  'utf8',
);

const ratios = photos.map((p) => p.width / p.height);
const portraits = ratios.filter((r) => r < 0.95).length;

console.log(`${photos.length} photos écrites dans ${TARGET}`);
console.log(
  `rapports de ${Math.min(...ratios).toFixed(2)} à ${Math.max(...ratios).toFixed(2)} — ` +
    `${portraits} en portrait`,
);

if (portraits === 0) {
  console.warn(
    "\nAvertissement : aucune photo verticale. Le mur sera régulier plutôt qu'irrégulier,\n" +
      "l'allure d'un mur Pinterest venant du contraste entre formats, non de la technique.",
  );
}
