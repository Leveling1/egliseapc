import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { watchUrl, type YoutubeLive } from '../../../../core/content/youtube.service';

@Component({
  selector: 'app-live-banner',
  standalone: true,
  templateUrl: './live-banner.component.html',
  styleUrl: './live-banner.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LiveBannerComponent {
  // Defaults to false: showing "live" without a real YouTube live-status
  // integration would mislead visitors into thinking a culte is in progress.
  /** Diffusion en cours, telle que la chaîne la signale ; null sans direct. */
  readonly live = input<YoutubeLive | null>(null);

  /** Page du direct sur YouTube, ouverte dans un nouvel onglet. */
  protected readonly href = computed(() => {
    const current = this.live();
    return current ? watchUrl(current.id) : '';
  });
}
