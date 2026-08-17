import { PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, type CanActivateFn } from '@angular/router';

import { CpannelAuthService } from '../services/cpannel-auth.service';
import type { PannelModule } from '../../../core/supabase/database.types';

/**
 * Accès au cpannel : il faut être connecté ET habilité.
 *
 * Cette garde n'est qu'un confort de navigation. Elle empêche d'afficher une
 * page vide, mais ce n'est pas elle qui protège les données : quelqu'un qui
 * la contourne (JavaScript modifié, appel direct à l'API) se heurte aux
 * politiques RLS, qui sont la vraie protection. Ne jamais déplacer une règle
 * de sécurité depuis la base vers cette garde.
 */
export const cpannelGuard: CanActivateFn = async () => {
  const router = inject(Router);

  // En rendu serveur il n'y a pas de session : laisser passer, le navigateur
  // tranchera. Rediriger ici produirait un HTML de redirection figé.
  if (!isPlatformBrowser(inject(PLATFORM_ID))) return true;

  const auth = inject(CpannelAuthService);
  if (!auth.resolved()) await auth.restore();

  if (auth.isAuthorized()) return true;

  return router.createUrlTree(['/cpannel/connexion']);
};

/** Empêche d'ouvrir un module sur lequel l'administrateur n'a aucun droit. */
export function cpannelModuleGuard(module: PannelModule): CanActivateFn {
  return async () => {
    const router = inject(Router);
    if (!isPlatformBrowser(inject(PLATFORM_ID))) return true;

    const auth = inject(CpannelAuthService);
    if (!auth.resolved()) await auth.restore();

    if (auth.can(module, 'view')) return true;

    return router.createUrlTree(['/cpannel']);
  };
}

/** Réservé à la page de connexion : évite de la réafficher à un admin connecté. */
export const cpannelLoginGuard: CanActivateFn = async () => {
  const router = inject(Router);
  if (!isPlatformBrowser(inject(PLATFORM_ID))) return true;

  const auth = inject(CpannelAuthService);
  if (!auth.resolved()) await auth.restore();

  return auth.isAuthorized() ? router.createUrlTree(['/cpannel']) : true;
};
