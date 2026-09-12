import { Injectable, inject } from '@angular/core';

import { SupabaseService } from '../../../core/supabase/supabase.service';
import type { PannelModule } from '../../../core/supabase/database.types';
import { readFunctionError } from './cpannel-media.service';

/** Une ligne du journal, telle que la fonction Edge la livre. */
export interface ActivityEntry {
  readonly id: number;
  readonly action: string;
  readonly module: PannelModule;
  readonly occurred_at: string;
  readonly author: string | null;
}

export interface ActivityPage {
  readonly entries: readonly ActivityEntry[];
  /** Identifiant à partir duquel demander la suite ; null quand tout est lu. */
  readonly nextCursor: number | null;
}

/** Lignes par page, celui du journal et de sa fonction Edge. */
export const ACTIVITY_PAGE_SIZE = 20;

/**
 * Lecture du journal d'activité, par la fonction Edge `get-activity-pannel`.
 *
 * Le journal passe par une fonction plutôt que par une lecture directe de la
 * table : elle applique le double contrôle (connecté, puis administrateur
 * actif), pagine par curseur et ne rend que les colonnes affichées.
 */
@Injectable({ providedIn: 'root' })
export class CpannelActivityService {
  private readonly supabase = inject(SupabaseService).client;

  /**
   * Une page du journal, la plus récente d'abord.
   *
   * `cursor` est l'identifiant de la dernière ligne déjà reçue : la page
   * suivante commence strictement en dessous, même si de nouvelles lignes
   * sont arrivées entre-temps.
   */
  async page(cursor: number | null, limit = ACTIVITY_PAGE_SIZE): Promise<ActivityPage> {
    const params = new URLSearchParams({ limit: String(limit) });
    if (cursor !== null) params.set('cursor', String(cursor));

    // `functions.invoke` joint le jeton de l'administrateur ; c'est lui que
    // la fonction relit et sur lequel la base évalue `is_pannel_admin()`.
    const { data, error } = await this.supabase.functions.invoke<ActivityPage>(
      `get-activity-pannel?${params}`,
      { method: 'GET' },
    );

    if (error) throw new Error(await readFunctionError(error));
    if (!data) throw new Error('Réponse vide du journal.');
    return data;
  }
}
