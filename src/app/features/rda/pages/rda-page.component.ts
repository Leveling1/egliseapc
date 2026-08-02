import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

import { HeaderComponent } from '../../../core/layout/header/header.component';
import { FooterComponent } from '../../../core/layout/footer/footer.component';
import { NewsletterCtaComponent } from '../../../shared/components/newsletter-cta/newsletter-cta.component';
import { RdaHeroComponent } from '../ui/rda-hero/rda-hero.component';
import { RdaIntroComponent } from '../ui/rda-intro/rda-intro.component';
import { RdaLatestEditionComponent } from '../ui/rda-latest-edition/rda-latest-edition.component';
import { RdaStatsComponent } from '../ui/rda-stats/rda-stats.component';
import { RdaGalleryComponent } from '../ui/rda-gallery/rda-gallery.component';

@Component({
  selector: 'app-rda-page',
  standalone: true,
  imports: [
    HeaderComponent,
    FooterComponent,
    NewsletterCtaComponent,
    RdaHeroComponent,
    RdaIntroComponent,
    RdaLatestEditionComponent,
    RdaStatsComponent,
    RdaGalleryComponent,
  ],
  templateUrl: './rda-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RdaPageComponent implements OnInit {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  ngOnInit(): void {
    this.title.setTitle('Rassemblement des Aigles (RDA) | Ambassadeurs Pour Christ (A.P.C)');
    this.meta.updateTag({
      name: 'description',
      content:
        "Le Rassemblement des Aigles : l'événement annuel qui rassemble la communauté A.P.C du monde entier pour un temps fort de communion, d'enseignement et de prière.",
    });
  }
}
