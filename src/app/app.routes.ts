import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/home/pages/home-page.component').then((m) => m.HomePageComponent),
  },
  {
    path: 'a-propos',
    loadComponent: () =>
      import('./features/about/pages/about-page.component').then((m) => m.AboutPageComponent),
  },
  {
    path: 'nos-cultes',
    loadComponent: () =>
      import('./features/cultes/pages/cultes-page.component').then((m) => m.CultesPageComponent),
  },
  {
    path: 'rda',
    loadComponent: () => import('./features/rda/pages/rda-page.component').then((m) => m.RdaPageComponent),
  },
  {
    path: 'galerie',
    loadComponent: () =>
      import('./features/gallery/pages/gallery-page.component').then((m) => m.GalleryPageComponent),
  },
  {
    path: 'ressources',
    loadComponent: () =>
      import('./features/resources-page/pages/resources-page.component').then(
        (m) => m.ResourcesPageComponent,
      ),
  },
  {
    path: 'blog',
    loadComponent: () => import('./features/blog/pages/blog-page.component').then((m) => m.BlogPageComponent),
  },
  {
    path: 'blog/:slug',
    loadComponent: () =>
      import('./features/blog/pages/article-detail-page.component').then(
        (m) => m.ArticleDetailPageComponent,
      ),
  },
  {
    // Back-office. Chargé à la demande : son code ne pèse pas sur le site
    // grand public, qui ne le télécharge jamais.
    path: 'cpannel',
    loadChildren: () => import('./features/cpannel/cpannel.routes').then((m) => m.cpannelRoutes),
  },
];
