import { ChangeDetectionStrategy, Component, input } from '@angular/core';

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
  readonly isLive = input(false);
}
