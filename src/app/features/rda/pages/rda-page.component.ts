import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';

import { SeoService } from '../../../core/seo/seo.service';
import { PublicContentService } from '../../../core/content/public-content.service';

import { HeaderComponent } from '../../../core/layout/header/header.component';
import { FooterComponent } from '../../../core/layout/footer/footer.component';
import { NewsletterCtaComponent } from '../../../shared/components/newsletter-cta/newsletter-cta.component';
import { TimelineComponent, type TimelineEntry } from '../../../shared/components/timeline/timeline.component';
import { RdaHeroComponent } from '../ui/rda-hero/rda-hero.component';
import { RdaIntroComponent } from '../ui/rda-intro/rda-intro.component';
import { RdaLatestEditionComponent } from '../ui/rda-latest-edition/rda-latest-edition.component';
import { PerfumeDayComponent } from '../ui/perfume-day/perfume-day.component';
import type { ProgrammePublic } from '../../../core/supabase/database.types';


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
    PerfumeDayComponent,
  ],
  templateUrl: './rda-page.component.html',
  styleUrl: './rda-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RdaPageComponent implements OnInit {
  private readonly seo = inject(SeoService);
  private readonly content = inject(PublicContentService);

  protected readonly timelineEntries = signal<readonly TimelineEntry[]>([]);

  /**
   * La Journée du Parfum, lue parmi les programmes spéciaux.
   *
   * On la reconnaît à son nom : c'est le cpannel qui la crée et la met à jour
   * dans le module Programmes, comme n'importe quel autre rendez-vous. Absente,
   * la section s'affiche tout de même avec un simple « date à venir ».
   */
  protected readonly perfumeDay = signal<ProgrammePublic | null>(null);

  constructor() {
    void this.loadEditions();
    void this.loadPerfumeDay();
  }

  private async loadPerfumeDay(): Promise<void> {
    const programmes = await this.content.programmes();
    this.perfumeDay.set(
      programmes.find((p) => p.kind === 'special' && /parfum/i.test(p.name)) ?? null,
    );
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
    this.seo.apply({
      title: 'Nos activités | Ambassadeurs Pour Christ (A.P.C)',
      description:
        "Les grands rendez-vous de l'Église Les Ambassadeurs Pour Christ (A.P.C) : le Rassemblement des Aigles (RDA), ses éditions passées, et la Journée du Parfum.",
      path: '/nos-activites',
    });
  }
}
