import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { FEATURED_ARTICLE } from '../../data/blog-articles';

@Component({
  selector: 'app-featured-article',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './featured-article.component.html',
  styleUrl: './featured-article.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeaturedArticleComponent {
  protected readonly article = FEATURED_ARTICLE;
}
