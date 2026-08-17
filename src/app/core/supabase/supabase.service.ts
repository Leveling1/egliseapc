import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { environment } from '../../../environments/environment';

/**
 * Point d'accès unique au backend Supabase.
 *
 * Le site étant rendu côté serveur (SSR), le client est configuré différemment
 * selon la plateforme : sur le serveur il n'existe ni `localStorage` ni URL de
 * redirection OAuth, donc toute persistance de session y est désactivée. Sans
 * cela, le rendu serveur tenterait d'écrire une session dans un stockage
 * inexistant — et surtout, une session lue côté serveur serait partagée entre
 * toutes les requêtes, donc entre tous les visiteurs.
 */
@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly client: SupabaseClient = createClient(
    environment.supabaseUrl,
    environment.supabaseAnonKey,
    {
      auth: {
        persistSession: this.isBrowser,
        autoRefreshToken: this.isBrowser,
        detectSessionInUrl: this.isBrowser,
        storageKey: 'apc-auth',
      },
    },
  );
}
