import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  /**
   * Lien d'évitement : envoie le focus directement dans le contenu.
   *
   * Un simple `href="#contenu"` suffirait à défiler, mais pas à déplacer le
   * focus : la tabulation suivante repartirait de l'en-tête, et l'on aurait
   * évité la navigation pour rien. On place donc le focus nous-mêmes, et l'on
   * annule la navigation du navigateur, qui ajouterait un fragment à l'URL.
   */
  protected skipToContent(event: Event): void {
    event.preventDefault();
    const main = document.getElementById('contenu');
    if (!main) return;
    // Un <main> n'est pas focalisable par défaut ; -1 le rend focalisable au
    // script sans l'ajouter à l'ordre de tabulation.
    main.setAttribute('tabindex', '-1');
    main.focus({ preventScroll: true });
    main.scrollIntoView({ block: 'start' });
  }
}
