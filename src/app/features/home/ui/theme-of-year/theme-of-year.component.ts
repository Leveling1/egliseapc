import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-theme-of-year',
  standalone: true,
  templateUrl: './theme-of-year.component.html',
  styleUrl: './theme-of-year.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemeOfYearComponent {}
