import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import {
  YoutubeService,
  formatDuration,
  formatPublished,
  watchUrl,
  type YoutubeVideo,
} from '../../../../core/content/youtube.service';
import { VideoSkeletonComponent } from '../../../../shared/components/video-skeleton/video-skeleton.component';

interface SermonSummary {
  readonly id: string;
  readonly title: string;
  readonly date: string;
  readonly duration: string;
  readonly thumbnail: string;
  /** Page de la vidéo sur YouTube. */
  readonly href: string;
}

/** Vidéos sous celle à la une : une rangée. */
const RECENT_COUNT = 3;

const RECENT_SKELETONS = Array.from({ length: RECENT_COUNT }, (_, i) => i);

/**
 * Les derniers cultes de la chaîne YouTube, sur l'accueil.
 *
 * La vidéo la plus récente à la une, les trois suivantes en rangée ; tout
 * vient de la fonction Edge `get-youtube`, comme la page des cultes. Pendant
 * le chargement, la section montre déjà ses quatre silhouettes ; si la
 * chaîne est injoignable, elle s'efface - un accueil sans vidéo vaut mieux
 * qu'un accueil avec des cadres vides.
 */
@Component({
  selector: 'app-sermons',
  standalone: true,
  imports: [RouterLink, VideoSkeletonComponent],
  templateUrl: './sermons.component.html',
  styleUrl: './sermons.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SermonsComponent {
  private readonly youtube = inject(YoutubeService);

  private readonly videos = signal<readonly SermonSummary[]>([]);
  protected readonly loading = signal(true);
  protected readonly recentSkeletons = RECENT_SKELETONS;

  protected readonly featuredSermon = computed(() => this.videos()[0] ?? null);
  protected readonly recentSermons = computed(() => this.videos().slice(1, 1 + RECENT_COUNT));

  constructor() {
    void this.load();
  }

  private async load(): Promise<void> {
    const page = await this.youtube.page();
    this.videos.set(page.videos.slice(0, 1 + RECENT_COUNT).map(toSummary));
    this.loading.set(false);
  }
}

function toSummary(video: YoutubeVideo): SermonSummary {
  return {
    id: video.id,
    title: video.title,
    date: formatPublished(video.publishedAt),
    duration: formatDuration(video.duration),
    thumbnail: video.thumbnail,
    href: watchUrl(video.id),
  };
}
