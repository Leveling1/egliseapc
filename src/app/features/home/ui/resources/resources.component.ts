import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-resources',
  standalone: true,
  templateUrl: './resources.component.html',
  styleUrl: './resources.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourcesComponent {}
