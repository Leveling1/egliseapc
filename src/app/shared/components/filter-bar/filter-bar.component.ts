import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';

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

  protected readonly selectedIndex = signal(0);

  protected select(index: number): void {
    this.selectedIndex.set(index);
  }
}
