import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-blog-hero',
  standalone: true,
  templateUrl: './blog-hero.component.html',
  styleUrl: './blog-hero.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlogHeroComponent {}
