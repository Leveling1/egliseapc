import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-featured-culte',
  standalone: true,
  templateUrl: './featured-culte.component.html',
  styleUrl: './featured-culte.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeaturedCulteComponent {
  readonly title = input.required<string>();
  readonly meta = input.required<string>();
  /** Vignette YouTube ; sans elle, le dégradé de la charte tient lieu d'image. */
  readonly thumbnail = input<string | null>(null);
  /** Page de la vidéo sur YouTube : la lecture se fait là-bas, dans un nouvel onglet. */
  readonly href = input.required<string>();
}
