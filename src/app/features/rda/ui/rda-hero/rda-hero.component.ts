import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-rda-hero',
  standalone: true,
  templateUrl: './rda-hero.component.html',
  styleUrl: './rda-hero.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RdaHeroComponent {}
