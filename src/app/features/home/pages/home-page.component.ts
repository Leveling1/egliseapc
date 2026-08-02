import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

import { HeaderComponent } from '../../../core/layout/header/header.component';
import { FooterComponent } from '../../../core/layout/footer/footer.component';
import { HeroComponent } from '../ui/hero/hero.component';
import { ThemeOfYearComponent } from '../ui/theme-of-year/theme-of-year.component';
import { OurHistoryComponent } from '../ui/our-history/our-history.component';
import { VisionaryComponent } from '../ui/visionary/visionary.component';
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
    ThemeOfYearComponent,
    OurHistoryComponent,
    VisionaryComponent,
    ProgramsComponent,
    SermonsComponent,
    WorldPresenceComponent,
  ],
  templateUrl: './home-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePageComponent implements OnInit {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  ngOnInit(): void {
    this.title.setTitle('Accueil | Ambassadeurs Pour Christ (A.P.C)');
    this.meta.updateTag({
      name: 'description',
      content:
        "L'Église les Ambassadeurs Pour Christ (A.P.C) — Sainteté à l'Éternel. Cultes, programmes hebdomadaires, enseignements et actualités de notre communauté.",
    });
  }
}
