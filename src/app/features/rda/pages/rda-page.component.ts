import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

import { PublicContentService } from '../../../core/content/public-content.service';

import { HeaderComponent } from '../../../core/layout/header/header.component';
import { FooterComponent } from '../../../core/layout/footer/footer.component';
import { NewsletterCtaComponent } from '../../../shared/components/newsletter-cta/newsletter-cta.component';
import { TimelineComponent, type TimelineEntry } from '../../../shared/components/timeline/timeline.component';
import { RdaHeroComponent } from '../ui/rda-hero/rda-hero.component';
import { RdaIntroComponent } from '../ui/rda-intro/rda-intro.component';
import { RdaLatestEditionComponent } from '../ui/rda-latest-edition/rda-latest-edition.component';


@Component({
  selector: 'app-rda-page',
  standalone: true,
  imports: [
    HeaderComponent,
    FooterComponent,
    NewsletterCtaComponent,
    TimelineComponent,
    RdaHeroComponent,
    RdaIntroComponent,
    RdaLatestEditionComponent,
  ],
  templateUrl: './rda-page.component.html',
  styleUrl: './rda-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RdaPageComponent implements OnInit {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly content = inject(PublicContentService);

  protected readonly timelineEntries = signal<readonly TimelineEntry[]>([]);

  constructor() {
    void this.loadEditions();
  }

  /**
   * Historique des rassemblements, lu depuis Supabase.
   *
   * Seule l'année est connue pour ces éditions passées : la date exacte reste
   * vide plutôt que d'être inventée, et l'affichage s'en accommode.
   */
  private async loadEditions(): Promise<void> {
    const editions = await this.content.rdaEditions();

    this.timelineEntries.set(
      editions.map((edition) => ({
        year: edition.year ? String(edition.year) : `${edition.edition_number}e édition`,
        title: edition.title,
        location: edition.location ?? '',
        startDate: edition.start_date ?? '',
        description: edition.description ?? undefined,
      })),
    );
  }

  ngOnInit(): void {
    this.title.setTitle('Rassemblement des Aigles (RDA) | Ambassadeurs Pour Christ (A.P.C)');
    this.meta.updateTag({
      name: 'description',
      content:
        "Le Rassemblement des Aigles : l'événement annuel qui rassemble la communauté A.P.C du monde entier pour un temps fort de communion, d'enseignement et de prière.",
    });
  }
}
