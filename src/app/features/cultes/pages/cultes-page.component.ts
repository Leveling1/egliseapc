import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';

import { SeoService } from '../../../core/seo/seo.service';
import { HeaderComponent } from '../../../core/layout/header/header.component';
import { FooterComponent } from '../../../core/layout/footer/footer.component';
import { FilterBarComponent } from '../../../shared/components/filter-bar/filter-bar.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { LiveBannerComponent } from '../ui/live-banner/live-banner.component';
import { CultesHeroComponent } from '../ui/cultes-hero/cultes-hero.component';
import { FeaturedCulteComponent } from '../ui/featured-culte/featured-culte.component';
import { CulteVideoCardComponent } from '../ui/culte-video-card/culte-video-card.component';

interface CulteVideo {
  readonly title: string;
  readonly date: string;
  readonly duration: string;
  readonly gradient: string;
}

@Component({
  selector: 'app-cultes-page',
  standalone: true,
  imports: [
    HeaderComponent,
    FooterComponent,
    FilterBarComponent,
    PaginationComponent,
    LiveBannerComponent,
    CultesHeroComponent,
    FeaturedCulteComponent,
    CulteVideoCardComponent,
  ],
  templateUrl: './cultes-page.component.html',
  styleUrl: './cultes-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CultesPageComponent implements OnInit {
  private readonly seo = inject(SeoService);

  protected readonly filters = ['Tous', 'Dimanche', 'Mercredi', 'Vendredi', 'Prière'] as const;
  protected readonly currentPage = signal(1);

  // Drives both the live banner and the header's nav theme: the banner's
  // dark gradient needs light nav text ("overlay"), but once hidden the
  // hero underneath is plain white and needs dark nav text ("light").
  protected readonly isLive = signal(false);

  protected readonly videos: readonly CulteVideo[] = [
    {
      title: 'Marcher dans la grâce',
      date: 'Mercredi 24 juil. 2026',
      duration: '52:18',
      gradient: 'linear-gradient(135deg,#0B0B0B,#1C1C8C)',
    },
    {
      title: "L'appel du disciple",
      date: 'Dimanche 21 juil. 2026',
      duration: '1:12:04',
      gradient: 'linear-gradient(135deg,#0B0B0B,#1C1C8C)',
    },
    {
      title: 'Le combat spirituel',
      date: 'Vendredi 18 juil. 2026',
      duration: '1:05:32',
      gradient: 'linear-gradient(135deg,#1C1C8C,#0B0B0B)',
    },
    {
      title: 'Vivre par la Parole',
      date: 'Mercredi 16 juil. 2026',
      duration: '48:22',
      gradient: 'linear-gradient(135deg,#1C1C8C,#1C1C8C)',
    },
    {
      title: "L'onction de Dieu",
      date: 'Dimanche 14 juil. 2026',
      duration: '1:18:45',
      gradient: 'linear-gradient(135deg,#0B0B0B,#1C1C8C)',
    },
    {
      title: 'La prière efficace',
      date: 'Vendredi 11 juil. 2026',
      duration: '55:10',
      gradient: 'linear-gradient(135deg,#1C1C8C,#1C1C8C)',
    },
  ];

  ngOnInit(): void {
    this.seo.apply({
      title: "Nos cultes et enseignements | Ambassadeurs Pour Christ (A.P.C)",
      description:
        "Cultes en direct, replays et enseignements de l'Église Les Ambassadeurs Pour Christ (A.P.C), suivis depuis Kinshasa et toutes ses extensions.",
      path: '/nos-cultes',
    });
  }

  protected onPageChange(page: number): void {
    this.currentPage.set(page);
  }
}
