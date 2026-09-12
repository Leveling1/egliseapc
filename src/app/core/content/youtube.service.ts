import { Injectable, inject } from '@angular/core';

import { SupabaseService } from '../supabase/supabase.service';

/** Une vidéo de la chaîne, telle que la fonction Edge la livre. */
export interface YoutubeVideo {
  readonly id: string;
  readonly title: string;
  readonly publishedAt: string;
  /** Durée ISO 8601 (« PT1H12M4S »). */
  readonly duration: string;
  readonly thumbnail: string;
}

export interface YoutubeLive {
  readonly id: string;
  readonly title: string;
}

export interface YoutubePage {
  /** Diffusion en cours, s'il y en a une. */
  readonly live: YoutubeLive | null;
  readonly videos: readonly YoutubeVideo[];
  /** Jeton de la page suivante ; null quand tout est lu. */
  readonly nextPage: string | null;
}

/** Vidéos par page - grille de trois colonnes, quatre rangées. */
export const YOUTUBE_PAGE_SIZE = 12;

/**
 * Première page : une de plus, pour la vidéo à la une. La grille commence à
 * la deuxième et remplit ainsi ses quatre rangées sans case vide.
 */
export const YOUTUBE_FIRST_PAGE_SIZE = YOUTUBE_PAGE_SIZE + 1;

const EMPTY: YoutubePage = { live: null, videos: [], nextPage: null };

/**
 * Chaîne YouTube de l'église, par la fonction Edge `get-youtube`.
 *
 * Le site ne parle jamais à YouTube directement : la clé API reste sur le
 * serveur, et la fonction met en cache pour que le quota tienne la journée.
 * Une panne renvoie une page vide : les composants savent l'afficher, et une
 * grille de cultes qui manque ne doit pas casser le reste de la page.
 */
@Injectable({ providedIn: 'root' })
export class YoutubeService {
  private readonly supabase = inject(SupabaseService).client;

  private firstPage: Promise<YoutubePage> | null = null;

  /**
   * Une page de vidéos, la plus récente d'abord.
   *
   * La première page est partagée entre les composants qui la demandent
   * (accueil, page des cultes, bannière du direct) : une seule requête.
   */
  page(token: string | null = null): Promise<YoutubePage> {
    if (token === null) {
      this.firstPage ??= this.fetch(null);
      return this.firstPage;
    }
    return this.fetch(token);
  }

  /**
   * Recherche par titre dans TOUTES les vidéos de la chaîne - pas seulement
   * celles déjà affichées. La fonction Edge tient un index de la chaîne et
   * cherche dedans, sans accents ni casse.
   */
  async search(term: string): Promise<readonly YoutubeVideo[]> {
    const q = term.trim();
    if (q.length < 2) return [];

    const params = new URLSearchParams({ q });
    try {
      const { data, error } = await this.supabase.functions.invoke<YoutubePage>(
        `get-youtube?${params}`,
        { method: 'GET' },
      );
      if (error || !data) return [];
      return data.videos;
    } catch {
      return [];
    }
  }

  private async fetch(token: string | null): Promise<YoutubePage> {
    const params = new URLSearchParams({
      limit: String(token ? YOUTUBE_PAGE_SIZE : YOUTUBE_FIRST_PAGE_SIZE),
    });
    if (token) params.set('page', token);

    try {
      const { data, error } = await this.supabase.functions.invoke<YoutubePage>(
        `get-youtube?${params}`,
        { method: 'GET' },
      );
      if (error || !data) return EMPTY;
      return data;
    } catch {
      return EMPTY;
    }
  }
}

/** « PT1H12M4S » → « 1:12:04 » ; « PT52M18S » → « 52:18 ». */
export function formatDuration(iso: string): string {
  const match = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso);
  if (!match) return '';

  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  const seconds = Number(match[3] ?? 0);
  const pad = (n: number) => String(n).padStart(2, '0');

  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;
}

/** « 2026-07-21T09:00:00Z » → « Dimanche 21 juil. 2026 ». */
export function formatPublished(iso: string): string {
  const text = new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Page de la vidéo sur YouTube - pour le partage et le repli sans lecteur. */
export function watchUrl(id: string): string {
  return `https://www.youtube.com/watch?v=${id}`;
}
