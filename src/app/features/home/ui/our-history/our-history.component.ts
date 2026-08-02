import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-our-history',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './our-history.component.html',
  styleUrl: './our-history.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OurHistoryComponent {}
