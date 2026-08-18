import { Injectable, inject } from '@angular/core';

import { SupabaseService } from '../../../core/supabase/supabase.service';
import { MEDIA_BUCKET, type PannelModule } from '../../../core/supabase/database.types';
import { CpannelAuthService } from './cpannel-auth.service';
import type { ModuleConfig } from '../data/cpannel-modules';

export interface ContentRow {
  id: string;
  is_visible: boolean;
  [key: string]: unknown;
}

/**
 * Accès aux données du cpannel.
 *
 * Volontairement dépourvu de méthode de suppression : la règle du projet est
 * qu'aucun contenu n'est jamais effacé. `setVisibility()` remplace le
 * « delete » d'un CRUD classique. Il n'y a donc aucun chemin de code capable
 * de perdre une ligne, même par erreur de programmation.
 *
 * Les écritures passent par PostgREST avec le jeton de l'administrateur : ce
 * sont les politiques RLS qui autorisent ou refusent, pas ce service. Une
 * requête forgée hors du cpannel se heurte aux mêmes règles.
 */
@Injectable({ providedIn: 'root' })
export class CpannelDataService {
  private readonly supabase = inject(SupabaseService).client;
  private readonly auth = inject(CpannelAuthService);

  async list(config: ModuleConfig): Promise<ContentRow[]> {
    const { data, error } = await this.supabase
      .from(config.table)
      .select(config.listSelect ?? '*')
      .order(config.orderBy.column, {
        ascending: config.orderBy.ascending,
        nullsFirst: false,
      });

    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as ContentRow[];
  }

  async create(config: ModuleConfig, values: Record<string, unknown>): Promise<ContentRow> {
    const { data, error } = await this.supabase
      .from(config.table)
      .insert({ ...values, updated_by: this.auth.adminProfile()?.id ?? null })
      .select()
      .single();

    if (error) throw new Error(this.humanize(error.message));

    const row = data as ContentRow;
    await this.log(config.module, row.id, 'création');
    return row;
  }

  async update(
    config: ModuleConfig,
    id: string,
    values: Record<string, unknown>,
  ): Promise<ContentRow> {
    const { data, error } = await this.supabase
      .from(config.table)
      .update({ ...values, updated_by: this.auth.adminProfile()?.id ?? null })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(this.humanize(error.message));

    const row = data as ContentRow;
    await this.log(config.module, row.id, 'modification');
    return row;
  }

  /**
   * Bascule visible ↔ invisible. C'est l'équivalent de la suppression dans
   * ce projet : la ligne reste intacte et peut être remise en ligne.
   *
   * Un administrateur sans droit de publication sur ce module sera refusé
   * par un trigger en base, pas seulement par l'interface.
   */
  async setVisibility(config: ModuleConfig, id: string, isVisible: boolean): Promise<void> {
    const { error } = await this.supabase
      .from(config.table)
      .update({ is_visible: isVisible, updated_by: this.auth.adminProfile()?.id ?? null })
      .eq('id', id);

    if (error) throw new Error(this.humanize(error.message));

    await this.log(config.module, id, isVisible ? 'mise en ligne' : 'retrait');
  }

  /** Renvoie le chemin stocké, à enregistrer dans la colonne du contenu. */
  async uploadImage(file: File): Promise<string> {
    const extension = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
    const path = `${crypto.randomUUID()}.${extension}`;

    const { error } = await this.supabase.storage
      .from(MEDIA_BUCKET)
      .upload(path, file, { cacheControl: '31536000', upsert: false });

    if (error) throw new Error(this.humanize(error.message));
    return path;
  }

  publicImageUrl(path: string | null | undefined): string | null {
    if (!path) return null;
    return this.supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
  }

  async recentActivity(limit = 8): Promise<
    { id: number; action: string; module: PannelModule; occurred_at: string; author: string | null }[]
  > {
    const { data } = await this.supabase
      .from('activity_log')
      .select('id, action, module, occurred_at, admin_users(full_name, email)')
      .order('occurred_at', { ascending: false })
      .limit(limit);

    type Joined = {
      id: number;
      action: string;
      module: PannelModule;
      occurred_at: string;
      admin_users: { full_name: string | null; email: string } | null;
    };

    return ((data ?? []) as unknown as Joined[]).map((entry) => ({
      id: entry.id,
      action: entry.action,
      module: entry.module,
      occurred_at: entry.occurred_at,
      author: entry.admin_users?.full_name ?? entry.admin_users?.email ?? null,
    }));
  }

  /** Compte total et nombre de contenus visibles, par module. */
  async counts(config: ModuleConfig): Promise<{ total: number; visible: number }> {
    const [total, visible] = await Promise.all([
      this.supabase.from(config.table).select('*', { count: 'exact', head: true }),
      this.supabase
        .from(config.table)
        .select('*', { count: 'exact', head: true })
        .eq('is_visible', true),
    ]);

    return { total: total.count ?? 0, visible: visible.count ?? 0 };
  }

  private async log(module: PannelModule, recordId: string, action: string): Promise<void> {
    // Le journal ne doit jamais faire échouer l'opération métier : si la
    // trace échoue, le contenu reste enregistré.
    await this.supabase.from('activity_log').insert({
      admin_user_id: this.auth.adminProfile()?.id ?? null,
      module,
      record_id: recordId,
      action,
    });
  }

  /**
   * Les messages de Postgres sont techniques. On traduit les cas que
   * l'administrateur peut réellement provoquer, et on laisse le reste tel
   * quel plutôt que d'inventer une explication trompeuse.
   */
  private humanize(message: string): string {
    if (message.includes('Droit de publication requis')) {
      return "Vous n'avez pas le droit de publier dans ce module.";
    }
    if (message.includes('articles_slug_format')) {
      return "L'adresse (slug) ne peut contenir que des minuscules, des chiffres et des tirets.";
    }
    if (message.includes('duplicate key') && message.includes('slug')) {
      return 'Cette adresse (slug) est déjà utilisée par un autre article.';
    }
    if (message.includes('duplicate key') && message.includes('edition_number')) {
      return 'Ce numéro d\'édition existe déjà.';
    }
    if (message.includes('duplicate key') && message.includes('year')) {
      return 'Un oracle existe déjà pour cette année.';
    }
    if (message.includes('programmes_special_needs_date')) {
      return 'Un programme spécial doit avoir au moins une date de début.';
    }
    if (message.includes('programmes_recurrent_needs_days')) {
      return 'Un programme récurrent doit avoir au moins un jour coché.';
    }
    if (message.includes('dates_ordered')) {
      return 'La date de fin ne peut pas précéder la date de début.';
    }
    if (message.includes('row-level security') || message.includes('permission denied')) {
      return "Vous n'avez pas les droits nécessaires pour cette action.";
    }
    return message;
  }
}
