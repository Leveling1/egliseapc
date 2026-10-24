import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';

import { SeoService } from '../../../core/seo/seo.service';
import { churchSchema, webSiteSchema } from '../../../core/seo/structured-data';
import { PublicContentService } from '../../../core/content/public-content.service';
import { HeaderComponent } from '../../../core/layout/header/header.component';
import { FooterComponent } from '../../../core/layout/footer/footer.component';
import { HeroComponent } from '../ui/hero/hero.component';
import { ProgramsComponent } from '../ui/programs/programs.component';
import { SermonsComponent } from '../ui/sermons/sermons.component';
import { WorldPresenceComponent } from '../ui/world-presence/world-presence.component';
import { SpecialEventsComponent } from '../../../shared/components/special-events/special-events.component';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [
    SpecialEventsComponent,
    HeaderComponent,
    FooterComponent,
    HeroComponent,
    ProgramsComponent,
    SermonsComponent,
    WorldPresenceComponent,
  ],
  templateUrl: './home-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePageComponent implements OnInit {
  private readonly seo = inject(SeoService);
  private readonly content = inject(PublicContentService);

  ngOnInit(): void {
    this.seo.apply({
      title: 'Les Ambassadeurs Pour Christ (A.P.C) | Église A.P.C',
      description:
        'Église chrétienne à Kinshasa et dans ses extensions. Découvrez nos cultes, nos enseignements, nos activités et la vision des Ambassadeurs pour Christ.',
      path: '/',
    });

    void this.describeChurch();
  }

  /**
   * Décrit l'église pour les moteurs de recherche : nom, adresse, réseaux et
   * horaires. Ces derniers proviennent des programmes publiés, donc ce qui
   * est déclaré à Google ne peut pas diverger de ce qu'affiche le site.
   *
   * N'ajoute rien de visible à la page.
   */
  private async describeChurch(): Promise<void> {
    this.seo.setJsonLd('website', webSiteSchema());
    const [programmes, extensions] = await Promise.all([
      this.content.programmes(),
      this.content.extensions(),
    ]);

    this.seo.setJsonLd('church', churchSchema(programmes, extensions));
  }
}
