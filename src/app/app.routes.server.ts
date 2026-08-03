import { RenderMode, ServerRoute } from '@angular/ssr';

import { allArticles } from './features/blog/data/blog-articles';

export const serverRoutes: ServerRoute[] = [
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
