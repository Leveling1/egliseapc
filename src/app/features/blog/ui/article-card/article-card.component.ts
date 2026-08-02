import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-article-card',
  standalone: true,
  templateUrl: './article-card.component.html',
  styleUrl: './article-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArticleCardComponent {
  readonly category = input.required<string>();
  readonly gradient = input.required<string>();
  readonly title = input.required<string>();
  readonly excerpt = input.required<string>();
  readonly date = input.required<string>();
}
