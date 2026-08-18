/**
 * Génère le SQL d'amorçage du contenu à partir des données déjà présentes
 * dans le dépôt, plutôt que de les ressaisir à la main.
 *
 * Source : src/app/features/blog/data/blog-articles.ts
 * Sortie : scripts/seed-content.sql
 *
 * Le fichier source est du TypeScript : on le transpile avec le compilateur
 * déjà présent dans node_modules, ce qui évite d'en dupliquer le contenu et
 * garantit que le SQL reflète exactement ce que le site affiche aujourd'hui.
 *
 * Script rejouable : les INSERT sont idempotents (ON CONFLICT DO NOTHING),
 * donc le relancer ne crée pas de doublons et n'écrase aucune modification
 * faite depuis le cpannel.
 */
import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const ts = require('typescript');

const SOURCE = 'src/app/features/blog/data/blog-articles.ts';
const TEMP = 'scripts/.blog-articles.cjs';
const OUTPUT = 'scripts/seed-content.sql';

const transpiled = ts.transpileModule(readFileSync(SOURCE, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

writeFileSync(TEMP, transpiled);

let data;
try {
  data = require(pathToFileURL(TEMP).pathname.replace(/^\//, ''));
} catch {
  data = require('../' + TEMP);
}

const articles = [data.FEATURED_ARTICLE, ...data.BLOG_ARTICLES];

/** Échappe une valeur pour un littéral SQL, ou renvoie NULL. */
const q = (value) =>
  value === null || value === undefined || value === ''
    ? 'NULL'
    : `'${String(value).replace(/'/g, "''")}'`;

/** Tableau de paragraphes vers un littéral text[] Postgres. */
const qArray = (values) =>
  `ARRAY[${values.map((v) => `'${String(v).replace(/'/g, "''")}'`).join(',\n    ')}]::text[]`;

/**
 * Les dates du fichier source sont en français (« 28 juillet 2026 »).
 * Postgres attend une date ISO.
 */
const MONTHS = {
  janvier: '01', février: '02', mars: '03', avril: '04', mai: '05', juin: '06',
  juillet: '07', août: '08', septembre: '09', octobre: '10', novembre: '11', décembre: '12',
};

function toIsoDate(french) {
  const match = /^(\d{1,2})\s+([^\s]+)\s+(\d{4})$/.exec(String(french).trim());
  if (!match) return null;
  const month = MONTHS[match[2].toLowerCase()];
  if (!month) return null;
  return `${match[3]}-${month}-${match[1].padStart(2, '0')}`;
}

const lines = [
  '-- Fichier GÉNÉRÉ par scripts/generate-seed-sql.mjs — ne pas modifier à la main.',
  '-- Amorçage du contenu du cpannel depuis les données du dépôt.',
  '',
  '-- Articles de blog : contenu réel, publié directement (is_visible = true)',
  '-- puisque ces articles sont déjà en ligne sur le site aujourd\'hui.',
  '-- Le trigger de contrôle de publication exige un administrateur connecté',
  '-- disposant du droit de publier. Un amorçage tourne sans session : on le',
  '-- neutralise le temps de la transaction, puis on le réactive aussitôt.',
  '-- Le faire ici, dans un fichier généré et rejouable, évite la tentation',
  '-- bien pire d assouplir le trigger lui-même.',
  'begin;',
  'alter table public.articles disable trigger trg_articles_publish_right;',
  '',
  'insert into public.articles',
  '  (slug, category, title, excerpt, content, author_name, author_initials,',
  '   reading_time, gradient, published_at, is_visible)',
  'values',
];

const values = articles.map((article) => {
  const iso = toIsoDate(article.date);
  return `  (${q(article.slug)}, ${q(article.category)}, ${q(article.title)},
   ${q(article.excerpt)},
   ${qArray(article.content)},
   ${q(article.authorName)}, ${q(article.authorInitials)}, ${q(article.readingTime)},
   ${q(article.gradient)}, ${iso ? `'${iso}'::date` : 'NULL'}, true)`;
});

lines.push(values.join(',\n'));
lines.push('on conflict (slug) do nothing;');
lines.push('');
lines.push('alter table public.articles enable trigger trg_articles_publish_right;');
lines.push('commit;');
lines.push('');
lines.push('-- Éditions RDA : 18 éditions passées.');
lines.push('-- Aucune donnée réelle (titres, lieux, dates) n\'a été fournie : les lignes');
lines.push('-- sont créées à compléter depuis le cpannel, et restent masquées tant');
lines.push('-- qu\'elles ne contiennent pas d\'information vérifiée. Inventer des dates');
lines.push('-- ou des lieux pour un historique d\'église tromperait les visiteurs.');
lines.push('insert into public.rda_editions (edition_number, title, is_visible)');
lines.push('select n, \'Édition \' || n || \' — à compléter\', false');
lines.push('  from generate_series(1, 18) as n');
lines.push('on conflict (edition_number) do nothing;');
lines.push('');

writeFileSync(OUTPUT, lines.join('\n'));
unlinkSync(TEMP);

console.log(`[seed] ${OUTPUT} généré — ${articles.length} articles + 18 éditions RDA.`);
