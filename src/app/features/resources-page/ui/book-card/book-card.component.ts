import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-book-card',
  standalone: true,
  templateUrl: './book-card.component.html',
  styleUrl: './book-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookCardComponent {
  readonly title = input.required<string>();
  readonly description = input<string>('');
  /** Couverture envoyée depuis le cpannel ; prioritaire sur le dégradé. */
  readonly coverUrl = input<string | null>(null);
  readonly coverGradient = input<string>('linear-gradient(145deg,#1C1C8C,#1C1C8C)');
  readonly coverRotation = input<string>('0deg');
  readonly badgeLabel = input<string>('');
  readonly badgeVariant = input<'yellow' | 'light'>('yellow');
  /** Achat ou téléchargement ; sans lien, la carte n'est pas cliquable. */
  readonly linkUrl = input<string | null>(null);
}
