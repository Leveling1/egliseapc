/**
 * Génère src/environments/environment.ts à partir des variables
 * d'environnement (secrets GitHub Actions en CI).
 *
 * - En CI : SUPABASE_URL et SUPABASE_ANON_KEY sont obligatoires.
 * - En local : si les variables sont absentes mais qu'un environment.ts
 *   existe déjà (copié depuis environment.example.ts), il est conservé.
 */
import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const TARGET = 'src/environments/environment.ts';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  if (existsSync(TARGET)) {
    console.log(
      '[set-env] SUPABASE_URL / SUPABASE_ANON_KEY absents — environment.ts existant conservé (dev local).',
    );
    process.exit(0);
  }
  console.error(
    '[set-env] ERREUR : SUPABASE_URL et SUPABASE_ANON_KEY sont requis ' +
      "(aucun src/environments/environment.ts existant). En local, copiez " +
      'environment.example.ts vers environment.ts.',
  );
  process.exit(1);
}

// Garde-fou : le projet Supabase attendu.
//
// Le secret GitHub SUPABASE_URL a existé avant que le projet ne soit fixé, et
// pointer par erreur sur un autre projet produirait un site qui compile
// parfaitement mais n'affiche aucun contenu — un échec silencieux, découvert
// en production. Mieux vaut casser le build tout de suite.
//
// Ce n'est pas un secret : ce ref apparaît dans l'URL publique de l'API.
const EXPECTED_PROJECT_REF = 'frcatxbhpwtkqroumqrp';

if (!supabaseUrl.includes(EXPECTED_PROJECT_REF)) {
  console.error(
    `[set-env] ERREUR : SUPABASE_URL pointe sur « ${supabaseUrl} », or le projet ` +
      `attendu est « ${EXPECTED_PROJECT_REF} ».\n` +
      "Corrigez le secret SUPABASE_URL (et SUPABASE_ANON_KEY, qui doit venir du " +
      'même projet), ou mettez à jour EXPECTED_PROJECT_REF si le projet a ' +
      'volontairement changé.',
  );
  process.exit(1);
}

const content = `// Fichier GÉNÉRÉ par scripts/set-env.mjs — ne pas modifier, ne pas commiter.
export const environment = {
  supabaseUrl: '${supabaseUrl}',
  supabaseAnonKey: '${supabaseAnonKey}',
  functionsBase: '${supabaseUrl}/functions/v1',
};
`;

mkdirSync(dirname(TARGET), { recursive: true });
writeFileSync(TARGET, content);
console.log("[set-env] environment.ts généré depuis les variables d'environnement.");
