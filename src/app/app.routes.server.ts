import { RenderMode, ServerRoute } from '@angular/ssr';

import { allArticles } from './features/blog/data/blog-articles';

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
      return allArticles().map((article) => ({ slug: article.slug }));
    },
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
