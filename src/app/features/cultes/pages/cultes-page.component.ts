import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';

import { SeoService } from '../../../core/seo/seo.service';
import {
  YoutubeService,
  formatDuration,
  formatPublished,
  watchUrl,
  type YoutubeLive,
  type YoutubeVideo,
} from '../../../core/content/youtube.service';
import { HeaderComponent } from '../../../core/layout/header/header.component';
import { FooterComponent } from '../../../core/layout/footer/footer.component';
import { SpecialEventsComponent } from '../../../shared/components/special-events/special-events.component';
import { LiveBannerComponent } from '../ui/live-banner/live-banner.component';
import { CultesHeroComponent } from '../ui/cultes-hero/cultes-hero.component';
import { FeaturedCulteComponent } from '../ui/featured-culte/featured-culte.component';
import { CulteVideoCardComponent } from '../ui/culte-video-card/culte-video-card.component';

interface CulteVideo {
  readonly id: string;
  readonly title: string;
  readonly date: string;
  readonly duration: string;
  readonly thumbnail: string;
  /** Page de la vidéo sur YouTube. */
  readonly href: string;
}

/** Délai entre la dernière frappe et la recherche, en ms. */
const SEARCH_DELAY_MS = 350;

/**
 * Nos cultes : la chaîne YouTube de l'église, en direct et en replay.
 *
 * Tout vient de la fonction Edge `get-youtube` : la vidéo à la une est la
 * plus récente, la grille suit, page après page (« Voir plus de cultes »),
 * et la bannière du direct n'apparaît que si la chaîne diffuse. La recherche
 * interroge toute la chaîne, par titre - pas seulement ce qui est affiché.
 *
 * La lecture se fait sur YouTube, dans un nouvel onglet : chaque vignette est
 * un lien vers la page de la vidéo, pas un lecteur intégré.
 */
@Component({
  selector: 'app-cultes-page',
  standalone: true,
  imports: [
    SpecialEventsComponent,
    HeaderComponent,
    FooterComponent,
    LiveBannerComponent,
    CultesHeroComponent,
    FeaturedCulteComponent,
    CulteVideoCardComponent,
  ],
  templateUrl: './cultes-page.component.html',
  styleUrl: './cultes-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CultesPageComponent implements OnInit {
  private readonly seo = inject(SeoService);
  private readonly youtube = inject(YoutubeService);

  protected readonly live = signal<YoutubeLive | null>(null);
  protected readonly all = signal<readonly CulteVideo[]>([]);
  protected readonly nextPage = signal<string | null>(null);
  protected readonly loading = signal(true);
  protected readonly loadingMore = signal(false);

  protected readonly search = signal('');
  protected readonly searching = signal(false);
  /** Résultats de la dernière recherche ; null hors recherche. */
  protected readonly results = signal<readonly CulteVideo[] | null>(null);

  /** La plus récente, mise en avant ; la grille commence à la suivante. */
  protected readonly featured = computed(() => this.all()[0] ?? null);

  protected readonly isSearching = computed(() => this.search().trim().length >= 2);

  /** En recherche : les résultats ; sinon la grille, sans la vidéo à la une. */
  protected readonly videos = computed(() =>
    this.isSearching() ? (this.results() ?? []) : this.all().slice(1),
  );

  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    void this.load();
    inject(DestroyRef).onDestroy(() => {
      if (this.searchTimer) clearTimeout(this.searchTimer);
    });
  }

  ngOnInit(): void {
    this.seo.apply({
      title: 'Nos cultes et enseignements | Ambassadeurs Pour Christ (A.P.C)',
      description:
        "Cultes en direct, replays et enseignements de l'Église Les Ambassadeurs Pour Christ (A.P.C), suivis depuis Kinshasa et toutes ses extensions.",
      path: '/nos-cultes',
    });
  }

  protected onSearch(term: string): void {
    this.search.set(term);
    if (this.searchTimer) clearTimeout(this.searchTimer);

    if (term.trim().length < 2) {
      this.results.set(null);
      this.searching.set(false);
      return;
    }

    // On attend la fin de la frappe : une requête par mot, pas par lettre.
    this.searching.set(true);
    this.searchTimer = setTimeout(() => void this.runSearch(term), SEARCH_DELAY_MS);
  }

  protected clearSearch(): void {
    this.onSearch('');
  }

  private async runSearch(term: string): Promise<void> {
    const videos = await this.youtube.search(term);
    // La saisie a pu changer pendant la requête : on n'affiche que la
    // réponse à ce qui est encore dans le champ.
    if (this.search() !== term) return;
    this.results.set(videos.map(toCulteVideo));
    this.searching.set(false);
  }

  protected async loadMore(): Promise<void> {
    const token = this.nextPage();
    if (!token || this.loadingMore()) return;

    this.loadingMore.set(true);
    try {
      const page = await this.youtube.page(token);
      this.all.update((videos) => [...videos, ...page.videos.map(toCulteVideo)]);
      this.nextPage.set(page.nextPage);
    } finally {
      this.loadingMore.set(false);
    }
  }

  private async load(): Promise<void> {
    const page = await this.youtube.page();
    this.live.set(page.live);
    this.all.set(page.videos.map(toCulteVideo));
    this.nextPage.set(page.nextPage);
    this.loading.set(false);
  }
}

function toCulteVideo(video: YoutubeVideo): CulteVideo {
  return {
    id: video.id,
    title: video.title,
    date: formatPublished(video.publishedAt),
    duration: formatDuration(video.duration),
    thumbnail: video.thumbnail,
    href: watchUrl(video.id),
  };
}
