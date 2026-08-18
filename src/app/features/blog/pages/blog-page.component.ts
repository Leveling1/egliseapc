import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

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

const ALL_CATEGORIES = 'Tous';

@Component({
  selector: 'app-blog-page',
  standalone: true,
  imports: [
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
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly content = inject(PublicContentService);
  private readonly storage = inject(SupabaseService).client.storage;

  protected readonly currentPage = signal(1);
  protected readonly selectedCategory = signal(ALL_CATEGORIES);

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
   * Catégories réellement utilisées par au moins un article visible.
   *
   * Déduites des articles chargés plutôt que de la table des catégories :
   * une catégorie créée mais encore vide n'a rien à proposer au visiteur.
   */
  protected readonly categories = computed(() => {
    const used = [...new Set(this.all().map((article) => article.category).filter(Boolean))].sort(
      (a, b) => a.localeCompare(b, 'fr'),
    );

    return used.length > 1 ? [ALL_CATEGORIES, ...used] : used;
  });

  /** Un seul choix possible ne mérite pas une barre de filtres. */
  protected readonly showFilters = computed(() => this.categories().length > 1);

  protected readonly articles = computed(() => {
    const featured = this.featured();
    const category = this.selectedCategory();

    return this.all()
      .filter((article) => article.id !== featured?.id)
      .filter((article) => category === ALL_CATEGORIES || article.category === category);
  });

  constructor() {
    void this.load();
  }

  ngOnInit(): void {
    this.title.setTitle('Blog | Ambassadeurs Pour Christ (A.P.C)');
    this.meta.updateTag({
      name: 'description',
      content:
        'Résumés de cultes, articles de foi, témoignages et actualités de la communauté Ambassadeurs Pour Christ (A.P.C).',
    });
  }

  protected onPageChange(page: number): void {
    this.currentPage.set(page);
  }

  protected onCategoryChange(category: string): void {
    this.selectedCategory.set(category);
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
  }

  private publicUrl(path: string | null): string | null {
    if (!path) return null;
    return this.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
  }
}
