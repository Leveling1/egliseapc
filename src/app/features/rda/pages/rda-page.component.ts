import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

import { HeaderComponent } from '../../../core/layout/header/header.component';
import { FooterComponent } from '../../../core/layout/footer/footer.component';
import { NewsletterCtaComponent } from '../../../shared/components/newsletter-cta/newsletter-cta.component';
import { TimelineComponent, type TimelineEntry } from '../../../shared/components/timeline/timeline.component';
import { RdaHeroComponent } from '../ui/rda-hero/rda-hero.component';
import { RdaIntroComponent } from '../ui/rda-intro/rda-intro.component';
import { RdaLatestEditionComponent } from '../ui/rda-latest-edition/rda-latest-edition.component';

const TOTAL_EDITIONS = 18;

function ordinalLabel(edition: number): string {
  return edition === 1 ? '1ère édition' : `${edition}ème édition`;
}

// TODO(historique RDA): aucune donnée réelle (titres, lieux, dates,
// photos, liens) n'a été fournie pour les 18 éditions passées. Ces
// entrées sont des placeholders à remplacer une par une — inventer des
// dates ou lieux précis pour un vrai historique d'église serait
// trompeur pour les visiteurs.
const RDA_TIMELINE_ENTRIES: readonly TimelineEntry[] = Array.from(
  { length: TOTAL_EDITIONS },
  (_, index): TimelineEntry => {
    const edition = TOTAL_EDITIONS - index;
    return {
      year: ordinalLabel(edition),
      title: 'Titre à confirmer',
      location: 'Lieu à confirmer',
      startDate: 'Date à confirmer',
    };
  },
);

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

  protected readonly timelineEntries = RDA_TIMELINE_ENTRIES;

  ngOnInit(): void {
    this.title.setTitle('Rassemblement des Aigles (RDA) | Ambassadeurs Pour Christ (A.P.C)');
    this.meta.updateTag({
      name: 'description',
      content:
        "Le Rassemblement des Aigles : l'événement annuel qui rassemble la communauté A.P.C du monde entier pour un temps fort de communion, d'enseignement et de prière.",
    });
  }
}
