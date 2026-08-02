import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-about-hero',
  standalone: true,
  templateUrl: './about-hero.component.html',
  styleUrl: './about-hero.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutHeroComponent {}
