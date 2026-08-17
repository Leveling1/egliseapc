// Modèle à copier vers environment.ts pour le développement local :
//   cp src/environments/environment.example.ts src/environments/environment.ts
//
// En CI, environment.ts est généré par scripts/set-env.mjs à partir des
// secrets GitHub SUPABASE_URL / SUPABASE_ANON_KEY.
//
// La clé ci-dessous est une clé « publishable » : elle est conçue pour être
// exposée dans le bundle navigateur. La sécurité réelle repose sur les
// politiques RLS de Supabase, jamais sur le secret de cette clé.
export const environment = {
  supabaseUrl: 'https://VOTRE_PROJET.supabase.co',
  supabaseAnonKey: 'sb_publishable_XXXXXXXXXXXXXXXXXXXXXXXX',
  functionsBase: 'https://VOTRE_PROJET.supabase.co/functions/v1',
};
