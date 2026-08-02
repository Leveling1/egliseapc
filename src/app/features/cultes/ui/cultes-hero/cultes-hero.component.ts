import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-cultes-hero',
  standalone: true,
  templateUrl: './cultes-hero.component.html',
  styleUrl: './cultes-hero.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CultesHeroComponent {}
