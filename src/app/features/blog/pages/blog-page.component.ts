import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';

import { RouterLink } from '@angular/router';
import { SeoService } from '../../../core/seo/seo.service';
import { HeaderComponent } from '../../../core/layout/header/header.component';
import { FooterComponent } from '../../../core/layout/footer/footer.component';
import { FilterBarComponent } from '../../../shared/components/filter-bar/filter-bar.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { PublicContentService } from '../../../core/content/public-content.service';
import { SupabaseService } from '../../../core/supabase/supabase.service';
import { MEDIA_BUCKET } from '../../../core/supabase/database.types';
import { BlogHeroComponent } from '../ui/blog-hero/blog-hero.component';
import { FeaturedArticleComponent } from '../ui/featured-article/featured-article.component';
import { ArticleCardComponent } from '../ui/article-card/article-card.component';
import { toArticleView, type ArticleView } from '../data/article-view';
import { SpecialEventsComponent } from '../../../shared/components/special-events/special-events.component';

const ALL_CATEGORIES = 'Tous';

/**
 * Articles par page : trois rangées de la grille à trois colonnes.
 *
 * La pagination était jusqu'ici décorative - trois pages affichées quel que
 * soit le nombre d'articles, et toutes les cartes rendues sur chacune.
 */
const PAGE_SIZE = 9;

/** Silhouettes pendant le chargement : deux rangées de trois. */
const SKELETONS = [0, 1, 2, 3, 4, 5];

/** Normalise pour la recherche : minuscules, sans accents. */
function fold(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

@Component({
  selector: 'app-blog-page',
  standalone: true,
  imports: [
    SpecialEventsComponent,
    RouterLink,
    HeaderComponent,
    FooterComponent,
    FilterBarComponent,
    PaginationComponent,
    BlogHeroComponent,
    FeaturedArticleComponent,
    ArticleCardComponent,
  ],
  templateUrl: './blog-page.component.html',
  styleUrl: './blog-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlogPageComponent implements OnInit {
  private readonly seo = inject(SeoService);
  private readonly content = inject(PublicContentService);
  private readonly storage = inject(SupabaseService).client.storage;

  protected readonly currentPage = signal(1);
  protected readonly selectedCategory = signal(ALL_CATEGORIES);
  protected readonly searchTerm = signal('');
  protected readonly loading = signal(true);
  protected readonly skeletons = SKELETONS;

  private readonly all = signal<readonly ArticleView[]>([]);
  private readonly featuredId = signal<string | null>(null);

  /**
   * L'article à la une : celui explicitement désigné dans le cpannel, sinon
   * le plus récemment publié. Une mise en avant oubliée ne laisse donc jamais
   * la section vide.
   */
  protected readonly featured = computed(() => {
    const id = this.featuredId();
    const articles = this.all();
    return (id ? articles.find((article) => article.id === id) : null) ?? articles[0] ?? null;
  });

  /**
   * Catégories réellement utilisées par au moins un article de la grille.
   *
   * Déduites des articles chargés plutôt que de la table des catégories :
   * une catégorie créée mais encore vide n'a rien à proposer au visiteur.
   * L'article à la une est écarté du compte : il n'est pas dans la grille,
   * et une catégorie qu'il serait seul à porter ouvrirait sur une grille
   * vide.
   */
  protected readonly categories = computed(() => {
    const featured = this.featured();
    const used = [
      ...new Set(
        this.all()
          .filter((article) => article.id !== featured?.id)
          .map((article) => article.category)
          .filter(Boolean),
      ),
    ].sort((a, b) => a.localeCompare(b, 'fr'));

    return used.length > 1 ? [ALL_CATEGORIES, ...used] : used;
  });

  /** Un seul choix possible ne mérite pas une barre de filtres. */
  protected readonly showFilters = computed(() => this.categories().length > 1);

  /** Tous les articles qui répondent au filtre et à la recherche. */
  protected readonly matching = computed(() => {
    const featured = this.featured();
    const category = this.selectedCategory();
    const term = fold(this.searchTerm().trim());

    return this.all()
      .filter((article) => article.id !== featured?.id)
      .filter((article) => category === ALL_CATEGORIES || article.category === category)
      .filter(
        (article) =>
          term === '' || fold(`${article.title} ${article.excerpt} ${article.category}`).includes(term),
      );
  });

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.matching().length / PAGE_SIZE)),
  );

  /** La page courante seulement - le reste de la liste attend son tour. */
  protected readonly articles = computed(() => {
    const start = (this.currentPage() - 1) * PAGE_SIZE;
    return this.matching().slice(start, start + PAGE_SIZE);
  });

  /** Un filtre ou une recherche est actif : la liste vide n'est pas un site vide. */
  protected readonly isFiltering = computed(
    () => this.selectedCategory() !== ALL_CATEGORIES || this.searchTerm().trim() !== '',
  );

  constructor() {
    void this.load();
  }

  ngOnInit(): void {
    this.seo.apply({
      title: "Blog | Ambassadeurs Pour Christ (A.P.C)",
      description:
        "Résumés de cultes, articles de foi, témoignages et actualités de la communauté Ambassadeurs Pour Christ (A.P.C).",
      path: '/blog',
    });
  }

  protected onPageChange(page: number): void {
    this.currentPage.set(page);
    // La grille commence sous le hero et l'article à la une : y revenir
    // plutôt qu'au sommet, sinon chaque page se paie deux écrans de défilement.
    document.querySelector('.apc-blog-grid-wrap')?.scrollIntoView({ block: 'start' });
  }

  protected onCategoryChange(category: string): void {
    this.selectedCategory.set(category);
    this.currentPage.set(1);
  }

  protected onSearchChange(term: string): void {
    this.searchTerm.set(term);
    this.currentPage.set(1);
  }

  protected clearFilters(): void {
    this.selectedCategory.set(ALL_CATEGORIES);
    this.searchTerm.set('');
    this.currentPage.set(1);
  }

  private async load(): Promise<void> {
    const articles = await this.content.articles();

    this.all.set(
      articles.map((article) =>
        // Les liens ne servent ici qu'à la couverture de repli ; les charger
        // article par article pour une liste coûterait une requête par carte.
        toArticleView(article, [], (path) => this.publicUrl(path)),
      ),
    );

    this.featuredId.set(articles.find((article) => article.is_featured)?.id ?? null);
    this.loading.set(false);
  }

  private publicUrl(path: string | null): string | null {
    if (!path) return null;
    return this.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
  }
}
