import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';

import { PublicContentService } from '../../../core/content/public-content.service';
import { formatTimeRange } from '../../../core/content/programme-format';
import { SupabaseService } from '../../../core/supabase/supabase.service';
import { MEDIA_BUCKET, type ProgrammePublic } from '../../../core/supabase/database.types';

interface SpecialEvent {
  readonly id: string;
  readonly name: string;
  readonly when: string | null;
  readonly location: string | null;
  readonly address: string | null;
  readonly description: string | null;
  readonly poster: string | null;
  /** Itinéraire Google Maps vers le lieu ; null sans adresse ni coordonnées. */
  readonly directions: string | null;
}

/**
 * Événements spéciaux à venir - les programmes de type « spécial » saisis
 * dans le cpannel et dont la date n'est pas passée.
 *
 * La base ne livre que les programmes encore d'actualité : ceux dont la date
 * est passée en sont retirés chaque nuit (colonne `is_past`, tâche cron),
 * cette section n'a donc rien à trier par date du jour.
 *
 * Sans événement, la section n'existe pas : ni titre, ni cadre vide.
 */
@Component({
  selector: 'app-special-events',
  standalone: true,
  templateUrl: './special-events.component.html',
  styleUrl: './special-events.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpecialEventsComponent {
  private readonly content = inject(PublicContentService);
  private readonly storage = inject(SupabaseService).client.storage;

  protected readonly events = signal<readonly SpecialEvent[]>([]);

  /** Un seul événement : il prend toute la largeur, affiche à côté du texte. */
  protected readonly single = computed(() => this.events().length === 1);

  constructor() {
    void this.load();
  }

  private async load(): Promise<void> {
    const programmes = await this.content.programmes();

    this.events.set(
      programmes
        .filter((programme) => programme.kind === 'special')
        .sort((a, b) => (a.start_date ?? '').localeCompare(b.start_date ?? ''))
        .map((programme) => this.toEvent(programme)),
    );
  }

  private toEvent(programme: ProgrammePublic): SpecialEvent {
    const path = programme.image_path;
    return {
      id: programme.id,
      name: programme.name,
      when: this.formatWhen(programme),
      location: programme.location,
      address: programme.address,
      description: programme.description,
      poster: path ? this.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl : null,
      directions: directionsUrl(programme),
    };
  }

  private formatWhen(programme: ProgrammePublic): string | null {
    if (!programme.start_date) return null;

    const format = (iso: string) =>
      new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

    const dates =
      programme.end_date && programme.end_date !== programme.start_date
        ? `Du ${format(programme.start_date)} au ${format(programme.end_date)}`
        : format(programme.start_date);

    const hours = formatTimeRange(programme.start_time, programme.end_time);
    return hours ? `${dates} · ${hours}` : dates;
  }
}

/**
 * Itinéraire Google Maps vers le lieu de l'événement.
 *
 * Les coordonnées, quand le géocodage les a trouvées, sont plus sûres qu'une
 * adresse en texte que Maps devrait interpréter ; l'adresse reste le repli.
 * `api=1` ouvre l'application ou le site selon l'appareil, avec la position
 * du visiteur comme point de départ.
 */
function directionsUrl(programme: ProgrammePublic): string | null {
  const destination =
    programme.latitude !== null && programme.longitude !== null
      ? `${programme.latitude},${programme.longitude}`
      : programme.address?.trim() || null;

  if (!destination) return null;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
}
