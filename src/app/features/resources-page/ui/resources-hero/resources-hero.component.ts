import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-resources-hero',
  standalone: true,
  templateUrl: './resources-hero.component.html',
  styleUrl: './resources-hero.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourcesHeroComponent {}
