import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * 'full'   : Accueil — 4 columns (brand+socials, Navigation, Ressources, Contact)
 * 'simple' : every other page — 3 columns (brand, Navigation, Contact), no socials
 */
export type FooterVariant = 'full' | 'simple';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterComponent {
  readonly variant = input<FooterVariant>('simple');

  protected readonly year = new Date().getFullYear();
}
