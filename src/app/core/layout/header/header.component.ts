import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

/**
 * Reflects three distinct nav stylings found across the source mockups:
 * - 'home'    : Accueil — Helvetica, white text @ .85 opacity, yellow underline
 * - 'overlay' : dark/photo hero pages (À propos, Nos Cultes, RDA) — Poppins, white text @ .75 opacity, yellow underline
 * - 'light'   : white-hero pages (Ressources, Blog) — Poppins, dark text @ .65 opacity, blue underline
 */
export type HeaderVariant = 'home' | 'overlay' | 'light';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  readonly variant = input<HeaderVariant>('overlay');
}
