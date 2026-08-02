import { ChangeDetectionStrategy, Component } from '@angular/core';

interface RdaStat {
  readonly value: string;
  readonly label: string;
}

@Component({
  selector: 'app-rda-stats',
  standalone: true,
  templateUrl: './rda-stats.component.html',
  styleUrl: './rda-stats.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RdaStatsComponent {
  protected readonly stats: readonly RdaStat[] = [
    { value: '15', label: 'Éditions depuis sa création' },
    { value: '7', label: "Jours d'enseignements par édition" },
    { value: '4', label: 'Orateurs prophétiques en 2026' },
  ];
}
