import { Injectable, PendingTasks, inject, signal } from '@angular/core';

import { SupabaseService } from '../supabase/supabase.service';
import type {
  GalleryPhotoPublic,
  ArticlePublic,
  BookPublic,
  ContentLinkPublic,
  MobileAppPublic,
  ExtensionPublic,
  OraclePublic,
  ProgrammePublic,
  RdaEditionPublic,
} from '../supabase/database.types';

/**
 * Lecture du contenu publié, pour le site grand public.
 *
 * Passe par les vues `*_public`, jamais par les tables : ces vues ne
 * contiennent que les colonnes destinées à l'affichage, et le rôle anonyme
 * n'a de toute façon aucun privilège sur les colonnes internes.
 *
 * Les appels sont enveloppés dans `PendingTasks` : sans cela, le prérendu
 * générerait le HTML avant la fin des requêtes et le site partirait en
 * production avec des pages vides. C'est le même mécanisme qui fait attendre
 * le rendu serveur sur les requêtes HttpClient.
 */
/**
 * Photos par page dans la galerie.
 *
 * Vingt : assez pour que le mur ait de la matière à répartir sur ses colonnes,
 * assez peu pour que la page s'affiche vite sur une connexion modeste.
 */
export const GALLERY_PAGE_SIZE = 20;

@Injectable({ providedIn: 'root' })
export class PublicContentService {
  private readonly supabase = inject(SupabaseService).client;
  private readonly pendingTasks = inject(PendingTasks);

  /**
   * Présence de contenu dans la page Ressources, partagée par le menu et le
   * pied de page. Chargée une seule fois : sans ce cache, chaque en-tête
   * relancerait la même requête à chaque navigation.
   */
  readonly resourcesAvailable = signal(false);
  private resourcesProbe: Promise<void> | null = null;

  ensureResourcesProbe(): Promise<void> {
    this.resourcesProbe ??= this.hasResources().then((available) => {
      this.resourcesAvailable.set(available);
    });
    return this.resourcesProbe;
  }

  /**
   * Signale une tâche en cours au rendu, puis la libère quoi qu'il arrive.
   *
   * `PendingTasks.run()` ne renvoie pas la valeur produite ; `add()` rend une
   * fonction de libération, ce qui permet d'attendre la requête tout en
   * récupérant son résultat.
   */
  private async awaited<T>(work: () => Promise<T>): Promise<T> {
    const done = this.pendingTasks.add();
    try {
      return await work();
    } finally {
      done();
    }
  }

  async articles(): Promise<ArticlePublic[]> {
    return this.awaited(async () => {
      const { data, error } = await this.supabase
        .from('articles_public')
        .select('*')
        .returns<ArticlePublic[]>();

      // Une panne de lecture ne doit pas casser la page : on rend une liste
      // vide, que les composants savent afficher.
      if (error) return [];
      return data ?? [];
    });
  }

  async articleBySlug(slug: string): Promise<ArticlePublic | null> {
    return this.awaited(async () => {
      const { data } = await this.supabase
        .from('articles_public')
        .select('*')
        .eq('slug', slug)
        .maybeSingle<ArticlePublic>();

      return data ?? null;
    });
  }

  /** Liens rattachés à un article : vidéo du culte, publication Facebook… */
  async linksForArticle(articleId: string): Promise<ContentLinkPublic[]> {
    return this.awaited(async () => {
      const { data } = await this.supabase
        .from('content_links_public')
        .select('*')
        .eq('article_id', articleId)
        .returns<ContentLinkPublic[]>();

      return data ?? [];
    });
  }

  /**
   * Oracle de l'année en cours.
   *
   * La règle de l'église est stricte : la section « Rejoignez-nous » affiche
   * l'oracle de l'année courante, pas le plus récent disponible. Montrer
   * celui d'une année passée en le présentant comme actuel serait faux, donc
   * on préfère ne rien afficher si l'année n'a pas encore son oracle.
   */
  async currentOracle(): Promise<OraclePublic | null> {
    return this.awaited(async () => {
      const { data } = await this.supabase
        .from('oracles_public')
        .select('*')
        .eq('year', new Date().getFullYear())
        .maybeSingle<OraclePublic>();

      return data ?? null;
    });
  }

  async oracles(): Promise<OraclePublic[]> {
    return this.awaited(async () => {
      const { data } = await this.supabase
        .from('oracles_public')
        .select('*')
        .returns<OraclePublic[]>();

      return data ?? [];
    });
  }

  private programmesCache: Promise<ProgrammePublic[]> | null = null;

  /**
   * Mémoïsé : la grille affichée et les horaires déclarés à Google lisent la
   * même liste. Deux requêtes identiques par page seraient du gaspillage, et
   * surtout deux sources qui pourraient diverger.
   */
  async programmes(): Promise<ProgrammePublic[]> {
    this.programmesCache ??= this.loadProgrammes();
    return this.programmesCache;
  }

  private async loadProgrammes(): Promise<ProgrammePublic[]> {
    return this.awaited(async () => {
      const { data } = await this.supabase
        .from('programmes_public')
        .select('*')
        .returns<ProgrammePublic[]>();

      return data ?? [];
    });
  }

  async extensions(): Promise<ExtensionPublic[]> {
    return this.awaited(async () => {
      const { data } = await this.supabase
        .from('extensions_public')
        .select('*')
        .returns<ExtensionPublic[]>();

      return data ?? [];
    });
  }

  async rdaEditions(): Promise<RdaEditionPublic[]> {
    return this.awaited(async () => {
      const { data } = await this.supabase
        .from('rda_editions_public')
        .select('*')
        .returns<RdaEditionPublic[]>();

      return data ?? [];
    });
  }

  /**
   * Édition mise en avant pour la section « Dernier événement ».
   * À défaut de choix explicite, la plus récente, comme pour les articles.
   */
  async featuredRdaEdition(): Promise<RdaEditionPublic | null> {
    const editions = await this.rdaEditions();
    return editions.find((edition) => edition.is_featured) ?? editions[0] ?? null;
  }

  async linksForRdaEdition(editionId: string): Promise<ContentLinkPublic[]> {
    return this.awaited(async () => {
      const { data } = await this.supabase
        .from('content_links_public')
        .select('*')
        .eq('rda_edition_id', editionId)
        .returns<ContentLinkPublic[]>();

      return data ?? [];
    });
  }

  /**
   * Une page de photos de la galerie, et le total.
   *
   * Découpée par la base, non par le navigateur : une galerie a vocation à
   * grandir, et charger cent photos pour n'en montrer vingt ferait payer au
   * visiteur tout ce qu'il ne regarde pas.
   */
  async galleryPhotos(
    options: { page?: number; pageSize?: number } = {},
  ): Promise<{ photos: GalleryPhotoPublic[]; total: number }> {
    return this.awaited(async () => {
      const page = Math.max(1, options.page ?? 1);
      const pageSize = Math.max(1, options.pageSize ?? GALLERY_PAGE_SIZE);
      const from = (page - 1) * pageSize;

      const { data, count } = await this.supabase
        .from('gallery_photos_public')
        .select('*', { count: 'exact' })
        .range(from, from + pageSize - 1)
        .returns<GalleryPhotoPublic[]>();

      return { photos: data ?? [], total: count ?? 0 };
    });
  }

  async books(): Promise<BookPublic[]> {
    return this.awaited(async () => {
      const { data } = await this.supabase
        .from('books_public')
        .select('*')
        .returns<BookPublic[]>();

      return data ?? [];
    });
  }

  async mobileApps(): Promise<MobileAppPublic[]> {
    return this.awaited(async () => {
      const { data } = await this.supabase
        .from('mobile_apps_public')
        .select('*')
        .returns<MobileAppPublic[]>();

      return data ?? [];
    });
  }

  /**
   * La page Ressources n'existe que si elle a quelque chose à montrer.
   * Un seul livre ou une seule application visible suffit à la faire
   * apparaître ; sans rien, le lien disparaît du site.
   */
  async hasResources(): Promise<boolean> {
    const [books, apps] = await Promise.all([this.books(), this.mobileApps()]);
    return books.length > 0 || apps.length > 0;
  }

  /** Slugs à prérendre au build. */
  async articleSlugs(): Promise<string[]> {
    const { data } = await this.supabase
      .from('articles_public')
      .select('slug')
      .returns<{ slug: string }[]>();

    return (data ?? []).map((row) => row.slug);
  }
}
