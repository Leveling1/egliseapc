import { Injectable, computed, inject, signal } from '@angular/core';
import type { Session } from '@supabase/supabase-js';

import { SupabaseService } from '../../../core/supabase/supabase.service';
import type {
  AdminPermission,
  AdminUser,
  PannelModule,
} from '../../../core/supabase/database.types';
import { hasModuleRight, type ModuleRight } from './module-rights';

export type { ModuleRight };

/**
 * Authentification et autorisation du cpannel.
 *
 * Ces deux notions sont délibérément séparées, car les confondre est la
 * faille évidente d'un portail ouvert par Google : n'importe qui possède un
 * compte Google et peut donc obtenir une session valide.
 *
 *   `session`      → l'utilisateur est AUTHENTIFIÉ (barrière 1)
 *   `adminProfile` → il est AUTORISÉ, c'est-à-dire inscrit et actif dans
 *                    admin_users (barrière 2)
 *
 * Un visiteur qui trouve l'URL du portail et se connecte franchit la
 * barrière 1 et se heurte à la barrière 2, où il n'existe pas.
 *
 * Ce service ne fait que refléter l'état ; la sécurité réelle est appliquée
 * en base par RLS. Contourner ce code ne donne accès à rien.
 */
@Injectable({ providedIn: 'root' })
export class CpannelAuthService {
  private readonly supabase = inject(SupabaseService).client;

  private readonly sessionSignal = signal<Session | null>(null);
  private readonly profileSignal = signal<AdminUser | null>(null);
  private readonly permissionsSignal = signal<readonly AdminPermission[]>([]);
  private readonly resolvedSignal = signal(false);

  readonly session = this.sessionSignal.asReadonly();
  readonly adminProfile = this.profileSignal.asReadonly();
  readonly permissions = this.permissionsSignal.asReadonly();

  /** Passe à true dès que le premier état d'authentification est connu. */
  readonly resolved = this.resolvedSignal.asReadonly();

  readonly isAuthenticated = computed(() => this.sessionSignal() !== null);

  /** Connecté ET habilité. C'est la seule condition d'accès au cpannel. */
  readonly isAuthorized = computed(() => {
    const profile = this.profileSignal();
    return this.sessionSignal() !== null && profile !== null && profile.is_active;
  });

  /** Connecté mais pas habilité : cas à signaler explicitement à l'écran. */
  readonly isAuthenticatedButRejected = computed(
    () => this.isAuthenticated() && !this.isAuthorized(),
  );

  readonly isSuperAdmin = computed(
    () => this.profileSignal()?.is_super_admin === true,
  );

  readonly displayName = computed(() => {
    const profile = this.profileSignal();
    if (!profile) return '';
    return profile.full_name?.split(' ')[0] ?? profile.email;
  });

  constructor() {
    this.supabase.auth.onAuthStateChange((_event, session) => {
      this.sessionSignal.set(session);
      void this.loadProfile();
    });
  }

  /** À appeler une fois au démarrage du cpannel. */
  async restore(): Promise<void> {
    const { data } = await this.supabase.auth.getSession();
    this.sessionSignal.set(data.session);
    await this.loadProfile();
  }

  async signInWithGoogle(): Promise<{ error: string | null }> {
    const { error } = await this.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/cpannel` },
    });
    return { error: error?.message ?? null };
  }

  async signOut(): Promise<void> {
    await this.supabase.auth.signOut();
    this.profileSignal.set(null);
    this.permissionsSignal.set([]);
  }

  /**
   * Droit sur un module. La règle elle-même vit dans `hasModuleRight()`, une
   * fonction pure testée séparément ; ce service ne fournit que le contexte.
   */
  can(module: PannelModule, right: ModuleRight = 'view'): boolean {
    const profile = this.profileSignal();
    if (!profile || !this.isAuthenticated()) return false;

    return hasModuleRight(
      {
        isActive: profile.is_active,
        isSuperAdmin: profile.is_super_admin,
        permissions: this.permissionsSignal(),
      },
      module,
      right,
    );
  }

  private async loadProfile(): Promise<void> {
    const userId = this.sessionSignal()?.user.id;

    if (!userId) {
      this.profileSignal.set(null);
      this.permissionsSignal.set([]);
      this.resolvedSignal.set(true);
      return;
    }

    // RLS n'autorise la lecture que de sa propre ligne : un utilisateur non
    // habilité obtient simplement zéro résultat, sans erreur.
    const { data: profile } = await this.supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle<AdminUser>();

    this.profileSignal.set(profile ?? null);

    if (profile) {
      const { data: permissions } = await this.supabase
        .from('admin_permissions')
        .select('*')
        .eq('admin_user_id', profile.id)
        .returns<AdminPermission[]>();

      this.permissionsSignal.set(permissions ?? []);

      // Trace de connexion, sans bloquer l'affichage si elle échoue.
      void this.supabase
        .from('admin_users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', profile.id);
    } else {
      this.permissionsSignal.set([]);
    }

    this.resolvedSignal.set(true);
  }
}
