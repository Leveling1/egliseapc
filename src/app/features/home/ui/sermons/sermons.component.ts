import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface SermonSummary {
  readonly title: string;
  readonly date: string;
  readonly duration: string;
}

@Component({
  selector: 'app-sermons',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './sermons.component.html',
  styleUrl: './sermons.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SermonsComponent {
  protected readonly featuredSermon: SermonSummary = {
    title: 'Culte dominical — La puissance de la foi',
    date: 'Dimanche 28 juillet 2026',
    duration: '1h 24min',
  };

  protected readonly recentSermons: readonly SermonSummary[] = [
    { title: 'Marcher dans la grâce', date: 'Mercredi 24 juillet', duration: '52min' },
    { title: "L'appel du disciple", date: 'Dimanche 21 juillet', duration: '1h 12min' },
  ];
}
