import type { Routes } from '@angular/router';

import { cpannelGuard, cpannelLoginGuard, cpannelModuleGuard } from './guards/cpannel.guard';
import { CPANNEL_MODULES } from './data/cpannel-modules';

/**
 * Routes du back-office.
 *
 * La page de connexion et l'éditeur d'article sont en dehors du shell :
 * la première parce qu'elle ne doit pas afficher la navigation d'un espace
 * encore inaccessible, le second parce que la rédaction occupe tout l'écran,
 * comme sur Medium.
 */
export const cpannelRoutes: Routes = [
  {
    path: 'connexion',
    canActivate: [cpannelLoginGuard],
    loadComponent: () =>
      import('./pages/login/login-page.component').then((m) => m.CpannelLoginPageComponent),
  },
  {
    path: 'articles/nouveau',
    canActivate: [cpannelGuard, cpannelModuleGuard('articles')],
    loadComponent: () =>
      import('./pages/article-editor/article-editor-page.component').then(
        (m) => m.CpannelArticleEditorPageComponent,
      ),
  },
  {
    path: 'articles/:id',
    canActivate: [cpannelGuard, cpannelModuleGuard('articles')],
    loadComponent: () =>
      import('./pages/article-editor/article-editor-page.component').then(
        (m) => m.CpannelArticleEditorPageComponent,
      ),
  },
  {
    path: '',
    canActivate: [cpannelGuard],
    loadComponent: () =>
      import('./layout/shell/cpannel-shell.component').then((m) => m.CpannelShellComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/dashboard/dashboard-page.component').then(
            (m) => m.CpannelDashboardPageComponent,
          ),
      },
      {
        path: 'utilisateurs',
        canActivate: [cpannelModuleGuard('users')],
        loadComponent: () =>
          import('./pages/users/users-page.component').then((m) => m.CpannelUsersPageComponent),
      },
      {
        path: 'parametres',
        canActivate: [cpannelModuleGuard('settings')],
        loadComponent: () =>
          import('./pages/settings/settings-page.component').then(
            (m) => m.CpannelSettingsPageComponent,
          ),
      },
      // Une route par module de contenu, toutes servies par le même
      // composant. Les déclarer explicitement (plutôt qu'un `:modulePath`
      // fourre-tout) permet d'attacher à chacune la garde du bon module et
      // fait qu'une URL inventée retombe sur la redirection finale.
      ...CPANNEL_MODULES.map((config) => ({
        path: config.path,
        canActivate: [cpannelModuleGuard(config.module)],
        data: { modulePath: config.path },
        loadComponent: () =>
          import('./pages/resource/resource-page.component').then(
            (m) => m.CpannelResourcePageComponent,
          ),
      })),
      { path: '**', redirectTo: '' },
    ],
  },
];
