import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-visionary',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './visionary.component.html',
  styleUrl: './visionary.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VisionaryComponent {}
