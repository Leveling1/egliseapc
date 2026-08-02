import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-about-today',
  standalone: true,
  templateUrl: './about-today.component.html',
  styleUrl: './about-today.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutTodayComponent {}
