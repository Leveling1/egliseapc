import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

import { HeaderComponent } from '../../../core/layout/header/header.component';
import { FooterComponent } from '../../../core/layout/footer/footer.component';
import { FilterBarComponent } from '../../../shared/components/filter-bar/filter-bar.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { BlogHeroComponent } from '../ui/blog-hero/blog-hero.component';
import { FeaturedArticleComponent } from '../ui/featured-article/featured-article.component';
import { ArticleCardComponent } from '../ui/article-card/article-card.component';

interface Article {
  readonly category: string;
  readonly gradient: string;
  readonly title: string;
  readonly excerpt: string;
  readonly date: string;
}

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

  protected readonly articles: readonly Article[] = [
    {
      category: 'Article',
      gradient: 'linear-gradient(135deg,#1C1C8C,#1C1C8C)',
      title: 'Vivre sa foi en milieu professionnel',
      excerpt:
        'Comment concilier engagement professionnel et vie de foi ? Des pistes concrètes pour être un ambassadeur au travail.',
      date: '24 juil. 2026',
    },
    {
      category: 'Témoignage',
      gradient: 'linear-gradient(135deg,#0B0B0B,#1C1C8C)',
      title: '« Dieu a transformé ma vie »',
      excerpt:
        "Le témoignage poignant de Marie, membre de l'extension de Bruxelles, qui raconte comment la foi a changé son parcours.",
      date: '21 juil. 2026',
    },
    {
      category: 'Résumé',
      gradient: 'linear-gradient(135deg,#1C1C8C,rgba(255,255,255,.55))',
      title: 'Marcher dans la grâce — Résumé',
      excerpt: "Les points essentiels de l'enseignement du mercredi sur la grâce et la miséricorde divine.",
      date: '18 juil. 2026',
    },
    {
      category: 'Actualité',
      gradient: 'linear-gradient(135deg,#1C1C8C,#0B0B0B)',
      title: 'RDA 2026 : les premières annonces',
      excerpt:
        "Le prochain Rassemblement des Aigles se prépare ! Découvrez les premières informations sur l'édition 2026.",
      date: '15 juil. 2026',
    },
    {
      category: 'Résumé',
      gradient: 'linear-gradient(135deg,#1C1C8C,#0B0B0B)',
      title: "L'appel du disciple — Résumé",
      excerpt: "Retour sur l'enseignement puissant du dimanche 21 juillet sur l'appel et l'engagement du disciple.",
      date: '12 juil. 2026',
    },
    {
      category: 'Article',
      gradient: 'linear-gradient(135deg,rgba(255,255,255,.55),#1C1C8C)',
      title: 'La prière : arme du croyant',
      excerpt: "Pourquoi la prière est au cœur de la vie de l'ambassadeur. Redécouvrez sa puissance et sa nécessité.",
      date: '8 juil. 2026',
    },
  ];

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
