import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Title } from '@angular/platform-browser';

import { SupabaseService } from '../../../../core/supabase/supabase.service';
import { CpannelAuthService } from '../../services/cpannel-auth.service';
import type {
  AdminPermission,
  AdminUser,
  PannelModule,
} from '../../../../core/supabase/database.types';
import { CPANNEL_MODULES } from '../../data/cpannel-modules';

type Right = 'can_view' | 'can_edit' | 'can_publish';

interface AdminRow extends AdminUser {
  permissions: AdminPermission[];
}

@Component({
  selector: 'app-cpannel-users-page',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './users-page.component.html',
  styleUrl: './users-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CpannelUsersPageComponent {
  private readonly supabase = inject(SupabaseService).client;
  private readonly auth = inject(CpannelAuthService);

  protected readonly rows = signal<readonly AdminRow[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly notice = signal<string | null>(null);

  protected readonly newEmail = signal('');
  protected readonly inviting = signal(false);

  /** Ligne dont on modifie les droits ; null quand le panneau est fermé. */
  protected readonly editing = signal<AdminRow | null>(null);
  protected readonly pendingDeactivate = signal<AdminRow | null>(null);

  protected readonly modules = CPANNEL_MODULES.map((config) => ({
    module: config.module,
    label: config.label,
  }));

  /** Le module « utilisateurs » n'est pas un module de contenu, on l'ajoute. */
  protected readonly allModules: readonly { module: PannelModule; label: string }[] = [
    ...this.modules,
    { module: 'users' as PannelModule, label: 'Utilisateurs' },
  ];

  protected readonly isSuperAdmin = this.auth.isSuperAdmin;
  protected readonly canEdit = computed(() => this.auth.can('users', 'edit'));
  protected readonly currentAdminId = computed(() => this.auth.adminProfile()?.id ?? null);

  /**
   * Nombre de super-administrateurs encore actifs. Sert à prévenir l'utilisateur
   * avant qu'il ne tente une opération que la base refusera : on ne peut pas
   * retirer le dernier accès complet, sinon plus personne n'entre.
   */
  protected readonly activeSuperAdmins = computed(
    () => this.rows().filter((row) => row.is_super_admin && row.is_active).length,
  );

  constructor() {
    inject(Title).setTitle('Utilisateurs — cpannel A.P.C');
    void this.load();
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    const { data, error } = await this.supabase
      .from('admin_users')
      .select('*, admin_permissions(*)')
      .order('created_at', { ascending: true });

    if (error) {
      this.error.set(error.message);
      this.loading.set(false);
      return;
    }

    type Joined = AdminUser & { admin_permissions: AdminPermission[] | null };

    this.rows.set(
      ((data ?? []) as unknown as Joined[]).map((row) => ({
        ...row,
        permissions: row.admin_permissions ?? [],
      })),
    );
    this.loading.set(false);
  }

  // ---------- Pré-autorisation ----------

  /**
   * Ajoute une adresse à la liste des comptes autorisés.
   *
   * On ne crée pas de compte : c'est Google qui authentifie. On inscrit
   * seulement l'adresse, et le rattachement au compte Google se fait
   * automatiquement à sa première connexion.
   */
  protected async invite(): Promise<void> {
    const email = this.newEmail().trim().toLowerCase();

    if (!email) {
      this.error.set('Saisissez une adresse email.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.error.set("Cette adresse email n'est pas valide.");
      return;
    }

    this.inviting.set(true);
    this.error.set(null);
    this.notice.set(null);

    const { error } = await this.supabase
      .from('admin_users')
      .insert({ email, is_active: true, is_super_admin: false });

    this.inviting.set(false);

    if (error) {
      this.error.set(
        error.message.includes('duplicate key')
          ? 'Cette adresse figure déjà dans la liste.'
          : error.message,
      );
      return;
    }

    this.newEmail.set('');
    this.notice.set(
      `${email} est autorisé. L'accès sera actif dès sa première connexion Google. ` +
        "Pensez à lui attribuer des droits, sinon il n'aura accès à aucun module.",
    );
    await this.load();
  }

  // ---------- Droits ----------

  protected openRights(row: AdminRow): void {
    this.error.set(null);
    this.editing.set(row);
  }

  protected closeRights(): void {
    this.editing.set(null);
  }

  protected hasRight(row: AdminRow, module: PannelModule, right: Right): boolean {
    if (row.is_super_admin) return true;
    return row.permissions.find((p) => p.module === module)?.[right] === true;
  }

  protected async toggleRight(
    row: AdminRow,
    module: PannelModule,
    right: Right,
  ): Promise<void> {
    this.error.set(null);
    const existing = row.permissions.find((p) => p.module === module);
    const nextValue = !(existing?.[right] ?? false);

    // Un droit de modification ou de publication sans droit de consultation
    // serait incohérent : on ouvre la consultation en même temps.
    const patch: Partial<AdminPermission> = { [right]: nextValue };
    if (nextValue && right !== 'can_view') patch.can_view = true;

    const { error } = existing
      ? await this.supabase.from('admin_permissions').update(patch).eq('id', existing.id)
      : await this.supabase
          .from('admin_permissions')
          .insert({ admin_user_id: row.id, module, ...patch });

    if (error) {
      this.error.set(error.message);
      return;
    }

    await this.load();
    this.editing.set(this.rows().find((r) => r.id === row.id) ?? null);
  }

  protected async toggleSuperAdmin(row: AdminRow): Promise<void> {
    this.error.set(null);

    const { error } = await this.supabase
      .from('admin_users')
      .update({ is_super_admin: !row.is_super_admin })
      .eq('id', row.id);

    if (error) {
      this.error.set(this.humanize(error.message));
      return;
    }

    await this.load();
    this.editing.set(this.rows().find((r) => r.id === row.id) ?? null);
  }

  // ---------- Activation (remplace la suppression) ----------

  protected askDeactivate(row: AdminRow): void {
    this.pendingDeactivate.set(row);
  }

  protected cancelDeactivate(): void {
    this.pendingDeactivate.set(null);
  }

  protected async setActive(row: AdminRow, isActive: boolean): Promise<void> {
    this.error.set(null);
    this.notice.set(null);
    this.pendingDeactivate.set(null);

    const { error } = await this.supabase
      .from('admin_users')
      .update({ is_active: isActive })
      .eq('id', row.id);

    if (error) {
      this.error.set(this.humanize(error.message));
      return;
    }

    await this.load();
  }

  protected statusLabel(row: AdminRow): string {
    if (!row.is_active) return 'Désactivé';
    if (!row.user_id) return 'En attente de connexion';
    return 'Actif';
  }

  private humanize(message: string): string {
    if (message.includes('super-administrateur actif doit subsister')) {
      return (
        'Impossible : il doit rester au moins un super-administrateur actif. ' +
        "Attribuez d'abord ce rôle à quelqu'un d'autre."
      );
    }
    if (message.includes('row-level security') || message.includes('permission denied')) {
      return "Vous n'avez pas les droits nécessaires pour cette action.";
    }
    return message;
  }
}
