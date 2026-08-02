import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-rda-intro',
  standalone: true,
  templateUrl: './rda-intro.component.html',
  styleUrl: './rda-intro.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RdaIntroComponent {}
