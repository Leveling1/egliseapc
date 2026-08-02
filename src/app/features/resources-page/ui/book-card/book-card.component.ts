import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-book-card',
  standalone: true,
  templateUrl: './book-card.component.html',
  styleUrl: './book-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookCardComponent {
  readonly coverGradient = input.required<string>();
  readonly coverRotation = input.required<string>();
  readonly badgeLabel = input.required<string>();
  readonly badgeVariant = input.required<'yellow' | 'light'>();
  readonly title = input.required<string>();
  readonly description = input.required<string>();
}
