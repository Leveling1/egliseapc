import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { CpannelImageFieldComponent } from '../image-field/image-field.component';

/**
 * Liste ordonnée d'images — captures d'écran d'une application, par exemple.
 *
 * Réutilise le champ image unitaire pour chaque entrée : la zone de dépôt,
 * la prévisualisation et le rappel de dimensions restent identiques partout.
 */
@Component({
  selector: 'app-cp-image-list',
  standalone: true,
  imports: [CpannelImageFieldComponent],
  templateUrl: './image-list.component.html',
  styleUrl: './image-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CpannelImageListComponent {
  readonly paths = input.required<readonly string[]>();
  readonly recommended = input<string>('');
  readonly pathsChange = output<string[]>();

  protected add(): void {
    this.pathsChange.emit([...this.paths(), '']);
  }

  protected update(index: number, path: string): void {
    // Vider une entrée revient à la retirer : garder une case vide dans la
    // liste n'aurait aucun sens à l'affichage.
    if (!path) {
      this.remove(index);
      return;
    }

    this.pathsChange.emit(this.paths().map((value, i) => (i === index ? path : value)));
  }

  protected remove(index: number): void {
    this.pathsChange.emit(this.paths().filter((_, i) => i !== index));
  }
}
