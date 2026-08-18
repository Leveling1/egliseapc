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

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [
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
      title: "Ambassadeurs Pour Christ (A.P.C) — Église chrétienne",
      description:
        "Église Les Ambassadeurs Pour Christ (A.P.C) : cultes, enseignements, programmes hebdomadaires et Rassemblement des Aigles (RDA). Siège à Kinshasa et extensions dans plusieurs pays.",
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
