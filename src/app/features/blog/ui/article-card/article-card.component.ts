import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-article-card',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './article-card.component.html',
  styleUrl: './article-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArticleCardComponent {
  readonly slug = input.required<string>();
  readonly category = input.required<string>();
  /** Valeur CSS complète : image de couverture ou dégradé de repli. */
  readonly background = input.required<string>();
  readonly title = input.required<string>();
  readonly excerpt = input.required<string>();
  readonly date = input.required<string>();
}
