import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

import { HeaderComponent } from '../../../core/layout/header/header.component';
import { FooterComponent } from '../../../core/layout/footer/footer.component';
import { FilterBarComponent } from '../../../shared/components/filter-bar/filter-bar.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { BlogHeroComponent } from '../ui/blog-hero/blog-hero.component';
import { FeaturedArticleComponent } from '../ui/featured-article/featured-article.component';
import { ArticleCardComponent } from '../ui/article-card/article-card.component';
import { BLOG_ARTICLES } from '../data/blog-articles';

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

  protected readonly filters = [
    'Tous',
    'Résumés de culte',
    'Articles',
    'Témoignages',
    'Actualités',
  ] as const;
  protected readonly currentPage = signal(1);

  protected readonly articles = BLOG_ARTICLES;

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
}
