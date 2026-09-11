import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';

import { formatTimeRange } from '../../../../core/content/programme-format';
import { SupabaseService } from '../../../../core/supabase/supabase.service';
import { MEDIA_BUCKET, type ProgrammePublic } from '../../../../core/supabase/database.types';

/**
 * Présentation de la Journée du Parfum.
 *
 * Le contenu - dates, lieu, description, affiche - n'est pas écrit ici : il
 * vient du programme spécial « Journée du Parfum » du module Programmes, que
 * le cpannel gère comme n'importe quel autre rendez-vous. La section ne
 * connaît que le titre. Tant que le programme n'est pas renseigné, elle
 * annonce simplement que la prochaine date sera communiquée.
 *
 * On aurait pu rédiger un texte ; on ne l'a pas fait faute d'en connaître le
 * contenu réel, et une présentation inventée d'un rendez-vous d'église serait
 * pire qu'une case vide.
 */
@Component({
  selector: 'app-perfume-day',
  standalone: true,
  templateUrl: './perfume-day.component.html',
  styleUrl: './perfume-day.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PerfumeDayComponent {
  readonly programme = input<ProgrammePublic | null>(null);

  private readonly storage = inject(SupabaseService).client.storage;

  protected readonly poster = computed(() => {
    const path = this.programme()?.image_path;
    return path ? this.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl : null;
  });

  protected readonly when = computed(() => {
    const p = this.programme();
    if (!p?.start_date) return null;

    const format = (iso: string) =>
      new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

    const dates =
      p.end_date && p.end_date !== p.start_date
        ? `Du ${format(p.start_date)} au ${format(p.end_date)}`
        : format(p.start_date);

    const hours = formatTimeRange(p.start_time, p.end_time);
    return hours ? `${dates} · ${hours}` : dates;
  });
}
