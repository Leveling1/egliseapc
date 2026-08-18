import { RenderMode, ServerRoute } from '@angular/ssr';
import { createClient } from '@supabase/supabase-js';

import { environment } from '../environments/environment';

/**
 * Liste des articles à prérendre, lue depuis Supabase au moment du build.
 *
 * La production est un site statique : ce sont ces pages, générées ici, qui
 * seront servies. Un article publié depuis le cpannel apparaîtra donc au
 * prochain déploiement — le navigateur, lui, voit le contenu à jour dès la
 * première visite puisque les composants relisent la base au chargement.
 *
 * Le client est créé directement plutôt qu'injecté : cette fonction s'exécute
 * dans Node pendant le build, hors de tout contexte d'injection Angular.
 */
async function publishedArticleSlugs(): Promise<string[]> {
  const supabase = createClient(environment.supabaseUrl, environment.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase
    .from('articles_public')
    .select('slug')
    .returns<{ slug: string }[]>();

  if (error) {
    // Ne pas faire échouer le build entier pour autant : les pages d'articles
    // resteront servies par le repli SPA, et le problème est signalé ici.
    console.warn('[prerender] Lecture des articles impossible :', error.message);
    return [];
  }

  return (data ?? []).map((row) => row.slug);
}

export const serverRoutes: ServerRoute[] = [
  {
    // Le cpannel est rendu uniquement côté navigateur.
    //
    // Le prérendre n'aurait pas de sens et serait dangereux : une page
    // authentifiée figée dans du HTML public exposerait la structure du
    // back-office, et le rendu serveur ne connaît de toute façon aucune
    // session. Cette route est aussi exclue de l'indexation (voir robots.txt).
    path: 'cpannel/**',
    renderMode: RenderMode.Client,
  },
  {
    path: 'blog/:slug',
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      return (await publishedArticleSlugs()).map((slug) => ({ slug }));
    },
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
