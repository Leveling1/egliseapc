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
}
