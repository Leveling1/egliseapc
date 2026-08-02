import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

import { HeaderComponent } from '../../../core/layout/header/header.component';
import { FooterComponent } from '../../../core/layout/footer/footer.component';
import { NewsletterCtaComponent } from '../../../shared/components/newsletter-cta/newsletter-cta.component';
import { ResourcesHeroComponent } from '../ui/resources-hero/resources-hero.component';
import { AppShowcaseComponent } from '../ui/app-showcase/app-showcase.component';
import { BookCardComponent } from '../ui/book-card/book-card.component';

interface BookData {
  readonly coverGradient: string;
  readonly coverRotation: string;
  readonly badgeLabel: string;
  readonly badgeVariant: 'yellow' | 'light';
  readonly title: string;
  readonly description: string;
}

@Component({
  selector: 'app-resources-page',
  standalone: true,
  imports: [
    HeaderComponent,
    FooterComponent,
    NewsletterCtaComponent,
    ResourcesHeroComponent,
    AppShowcaseComponent,
    BookCardComponent,
  ],
  templateUrl: './resources-page.component.html',
  styleUrl: './resources-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourcesPageComponent implements OnInit {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  protected readonly books: readonly BookData[] = [
    {
      coverGradient: 'linear-gradient(145deg,#1C1C8C,#FFE600)',
      coverRotation: '-2deg',
      badgeLabel: 'En rédaction',
      badgeVariant: 'yellow',
      title: 'La Marche du Disciple',
      description:
        "Un guide pratique pour vivre sa foi au quotidien et grandir en tant qu'ambassadeur du Christ.",
    },
    {
      coverGradient: 'linear-gradient(145deg,#FFE600,#1C1C8C)',
      coverRotation: '1deg',
      badgeLabel: 'En rédaction',
      badgeVariant: 'yellow',
      title: "L'Appel de l'Ambassadeur",
      description:
        "Comprendre et embrasser l'appel à être ambassadeur du Christ dans le monde d'aujourd'hui.",
    },
    {
      coverGradient: 'linear-gradient(145deg,#1C1C8C,#1C1C8C)',
      coverRotation: '-1deg',
      badgeLabel: 'Bientôt',
      badgeVariant: 'light',
      title: 'Prières et Méditations',
      description: 'Un recueil de prières et méditations pour accompagner votre vie spirituelle au quotidien.',
    },
  ];

  ngOnInit(): void {
    this.title.setTitle('Nos Ressources | Ambassadeurs Pour Christ (A.P.C)');
    this.meta.updateTag({
      name: 'description',
      content:
        'Application mobile, livres et outils pour grandir dans la foi au quotidien avec Ambassadeurs Pour Christ (A.P.C).',
    });
  }
}
