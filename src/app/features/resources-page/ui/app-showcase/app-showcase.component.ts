import { ChangeDetectionStrategy, Component } from '@angular/core';

interface AppFeature {
  readonly icon: string;
  readonly label: string;
}

@Component({
  selector: 'app-app-showcase',
  standalone: true,
  templateUrl: './app-showcase.component.html',
  styleUrl: './app-showcase.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShowcaseComponent {
  protected readonly features: readonly AppFeature[] = [
    { icon: '▶', label: 'Cultes en direct et replays' },
    { icon: '📅', label: 'Programme de la semaine' },
    { icon: '🔔', label: 'Notifications et actualités' },
  ];
}
