import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-featured-article',
  standalone: true,
  templateUrl: './featured-article.component.html',
  styleUrl: './featured-article.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeaturedArticleComponent {}
