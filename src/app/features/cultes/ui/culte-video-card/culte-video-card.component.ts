import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-culte-video-card',
  standalone: true,
  templateUrl: './culte-video-card.component.html',
  styleUrl: './culte-video-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CulteVideoCardComponent {
  readonly title = input.required<string>();
  readonly date = input.required<string>();
  readonly duration = input.required<string>();
  /** Vignette YouTube de la vidéo. */
  readonly thumbnail = input.required<string>();
  /** Page de la vidéo sur YouTube : la lecture se fait là-bas, dans un nouvel onglet. */
  readonly href = input.required<string>();
}
