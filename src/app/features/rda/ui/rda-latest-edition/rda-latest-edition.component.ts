import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';

import { PublicContentService } from '../../../../core/content/public-content.service';
import { youtubeThumbnail } from '../../../../core/media/link-media';
import { SupabaseService } from '../../../../core/supabase/supabase.service';
import { MEDIA_BUCKET } from '../../../../core/supabase/database.types';
import type {
  ContentLinkPublic,
  RdaEditionPublic,
} from '../../../../core/supabase/database.types';

@Component({
  selector: 'app-rda-latest-edition',
  standalone: true,
  templateUrl: './rda-latest-edition.component.html',
  styleUrl: './rda-latest-edition.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RdaLatestEditionComponent {
  private readonly content = inject(PublicContentService);
  private readonly storage = inject(SupabaseService).client.storage;

  protected readonly edition = signal<RdaEditionPublic | null>(null);
  protected readonly links = signal<readonly ContentLinkPublic[]>([]);

  /** « 15ème édition — La lampe brûle encore », ou l'année si le numéro manque. */
  protected readonly heading = computed(() => {
    const edition = this.edition();
    if (!edition) return '';

    const rank = edition.edition_number === 1 ? '1ère édition' : `${edition.edition_number}ème édition`;
    return `${rank} — ${edition.title}`;
  });

  protected readonly replayUrl = computed(() => {
    const edition = this.edition();
    if (edition?.video_url) return edition.video_url;

    // À défaut de lien vidéo dédié, on accepte un lien YouTube joint.
    return this.links().find((link) => youtubeThumbnail(link.url))?.url ?? null;
  });

  /** Tout lien qui n'est ni le replay ni une vidéo : galerie, article… */
  protected readonly extraLinks = computed(() =>
    this.links().filter((link) => link.url !== this.replayUrl() && !youtubeThumbnail(link.url)),
  );

  /** Affiche de l'édition, ou miniature de la vidéo à défaut. */
  protected readonly cover = computed(() => {
    const edition = this.edition();
    if (edition?.poster_path) {
      return this.storage.from(MEDIA_BUCKET).getPublicUrl(edition.poster_path).data.publicUrl;
    }

    const replay = this.replayUrl();
    return replay ? youtubeThumbnail(replay) : null;
  });

  constructor() {
    void this.load();
  }

  private async load(): Promise<void> {
    const edition = await this.content.featuredRdaEdition();
    this.edition.set(edition);

    if (edition) {
      this.links.set(await this.content.linksForRdaEdition(edition.id));
    }
  }
}
