import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import type { ArticleView } from '../../data/article-view';

@Component({
  selector: 'app-featured-article',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './featured-article.component.html',
  styleUrl: './featured-article.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeaturedArticleComponent {
  /** L'article le plus récent, choisi par la page qui affiche ce composant. */
  readonly article = input.required<ArticleView>();
}
