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

  // Connecté mais sans habilitation : renvoi au site public, et non à la page
  // de connexion. Se reconnecter n'y changerait rien — le compte existe, il
  // n'a simplement aucun droit — et le laisser tourner en boucle sur l'écran
  // de connexion lui laisserait croire à un problème d'identifiants.
  //
  // Cette redirection ne protège rien par elle-même : les politiques RLS
  // restent seules garantes des données. Elle évite une impasse.
  if (auth.isAuthenticatedButRejected()) return router.createUrlTree(['/']);

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

    // Un compte désactivé ou sans aucun droit n'a rien à faire dans le
    // back-office : le renvoyer au tableau de bord le ferait rebondir d'une
    // page vide à l'autre.
    if (!auth.isAuthorized()) return router.createUrlTree(['/']);

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
