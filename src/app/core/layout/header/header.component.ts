import { ChangeDetectionStrategy, Component, ElementRef, HostListener, inject, input, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { PublicContentService } from '../../content/public-content.service';

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
  private readonly content = inject(PublicContentService);

  /** Le lien « Ressources » n'apparaît que si la page a du contenu. */
  protected readonly showResources = this.content.resourcesAvailable;

  readonly variant = input<HeaderVariant>('overlay');

  private readonly elementRef = inject(ElementRef);

  protected readonly menuOpen = signal(false);

  constructor() {
    // Une seule interrogation pour tout le site : le service met le résultat
    // en cache et le pied de page réutilise le même signal.
    void this.content.ensureResourcesProbe();
  }

  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.closeMenu();
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    if (this.menuOpen() && !this.elementRef.nativeElement.contains(event.target as Node)) {
      this.closeMenu();
    }
  }
}
