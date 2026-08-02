import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-founding-verse',
  standalone: true,
  templateUrl: './founding-verse.component.html',
  styleUrl: './founding-verse.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FoundingVerseComponent {}
