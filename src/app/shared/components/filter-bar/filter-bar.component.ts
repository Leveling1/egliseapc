import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

@Component({
  selector: 'app-filter-bar',
  standalone: true,
  templateUrl: './filter-bar.component.html',
  styleUrl: './filter-bar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterBarComponent {
  readonly filters = input.required<readonly string[]>();
  readonly searchPlaceholder = input('Rechercher…');
  /** Filtre actif, piloté par la page : elle peut le réinitialiser. */
  readonly selected = input<string | null>(null);
  /** Texte de recherche, piloté par la page pour la même raison. */
  readonly search = input('');

  /** Filtre choisi, pour que la page puisse réellement filtrer sa liste. */
  readonly filterChange = output<string>();
  /** Texte saisi, à chaque frappe : la page décide de quoi le faire. */
  readonly searchChange = output<string>();

  protected readonly selectedIndex = computed(() => {
    const index = this.filters().indexOf(this.selected() ?? '');
    return index === -1 ? 0 : index;
  });

  protected select(index: number): void {
    this.filterChange.emit(this.filters()[index] ?? '');
  }

  protected onSearch(event: Event): void {
    this.searchChange.emit((event.target as HTMLInputElement).value);
  }
}
