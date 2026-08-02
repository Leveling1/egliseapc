import { ChangeDetectionStrategy, Component } from '@angular/core';

interface ProgramScheduleEntry {
  readonly day: string;
  readonly title: string;
  readonly time: string;
  readonly background: string;
  readonly featured?: boolean;
  readonly compactDayLabel?: boolean;
}

@Component({
  selector: 'app-programs',
  standalone: true,
  templateUrl: './programs.component.html',
  styleUrl: './programs.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgramsComponent {
  protected readonly schedule: readonly ProgramScheduleEntry[] = [
    {
      day: 'Lundi',
      title: "Culte d'enseignement",
      time: '17h00 – 19h00',
      background: 'rgba(255,255,255,.08)',
    },
    {
      day: 'Mercredi',
      title: 'Réunion des femmes',
      time: '16h30 – 18h30',
      background: 'rgba(255,255,255,.02)',
    },
    {
      day: 'Jeudi',
      title: "Culte d'intercession",
      time: '16h30 – 19h00',
      background: 'rgba(255,255,255,.08)',
    },
    {
      day: 'Dimanche',
      title: "Culte de louange et d'action de grâce",
      time: '08h00 – 10h30',
      background: 'linear-gradient(135deg,#1C1C8C,#1C1C8C)',
      featured: true,
    },
    {
      day: 'Lun. – Ven.',
      title: 'Prière matinale',
      time: '05h50 – 06h50',
      background: 'rgba(255,255,255,.02)',
      compactDayLabel: true,
    },
  ];
}
