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
  readonly gradient = input.required<string>();
}
