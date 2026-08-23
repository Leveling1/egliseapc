import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import {
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
  withViewTransitions,
} from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' }),
      // Transition uniforme d'une page à l'autre, confiée au navigateur.
      //
      // Chaque page se découvrait jusqu'ici à sa manière — la page Ressources
      // surtout, dont le contenu arrive après une lecture en base et sautait à
      // l'écran. L'API de transition de vues prend un cliché de l'ancienne
      // page et l'enchaîne avec la nouvelle, ce qui donne le même passage
      // partout sans que chaque page ait à s'en occuper.
      //
      // Les navigateurs qui ne la connaissent pas naviguent comme avant : la
      // fonction ne fait alors rien, elle ne casse rien.
      withViewTransitions({ skipInitialTransition: true }),
    ),
    provideClientHydration(),
  ],
};
