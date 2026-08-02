import { ChangeDetectionStrategy, Component } from '@angular/core';

interface WorldPresenceCity {
  readonly name: string;
  readonly top: string;
  readonly dotLeft: string;
  readonly labelLeft: string;
  readonly dotSize: number;
  readonly dotColor: string;
  readonly labelColor: string;
  readonly labelFontSize: number;
  readonly labelTransform: string;
}

@Component({
  selector: 'app-world-presence',
  standalone: true,
  templateUrl: './world-presence.component.html',
  styleUrl: './world-presence.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorldPresenceComponent {
  protected readonly cities: readonly WorldPresenceCity[] = [
    {
      name: 'Paris',
      top: '30%',
      dotLeft: '22%',
      labelLeft: '22.5%',
      dotSize: 14,
      dotColor: 'var(--color-apc-yellow)',
      labelColor: '#fff',
      labelFontSize: 11,
      labelTransform: 'translateY(-20px)',
    },
    {
      name: 'Kinshasa',
      top: '38%',
      dotLeft: '48%',
      labelLeft: '49.5%',
      dotSize: 14,
      dotColor: 'var(--color-apc-yellow)',
      labelColor: '#fff',
      labelFontSize: 11,
      labelTransform: 'translateX(8px)',
    },
    {
      name: 'Nairobi',
      top: '34%',
      dotLeft: '50%',
      labelLeft: '51.5%',
      dotSize: 10,
      dotColor: 'var(--color-apc-yellow)',
      labelColor: 'rgba(255,255,255,.7)',
      labelFontSize: 10,
      labelTransform: 'translateX(6px)',
    },
    {
      name: 'Bruxelles',
      top: '32%',
      dotLeft: '22%',
      labelLeft: '23.5%',
      dotSize: 10,
      dotColor: 'var(--color-apc-yellow)',
      labelColor: 'rgba(255,255,255,.7)',
      labelFontSize: 10,
      labelTransform: 'translateX(6px)',
    },
    {
      name: 'Luanda',
      top: '55%',
      dotLeft: '30%',
      labelLeft: '31.5%',
      dotSize: 10,
      dotColor: 'var(--color-apc-yellow)',
      labelColor: 'rgba(255,255,255,.7)',
      labelFontSize: 10,
      labelTransform: 'translateX(6px)',
    },
    {
      name: 'Lisbonne',
      top: '42%',
      dotLeft: '15%',
      labelLeft: '16.5%',
      dotSize: 10,
      dotColor: 'rgba(255,255,255,.55)',
      labelColor: 'rgba(255,255,255,.5)',
      labelFontSize: 10,
      labelTransform: 'translateX(6px)',
    },
  ];
}
