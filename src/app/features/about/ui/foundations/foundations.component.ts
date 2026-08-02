import { ChangeDetectionStrategy, Component } from '@angular/core';

interface FoundationCard {
  readonly icon: string;
  readonly title: string;
  readonly description: string;
}

@Component({
  selector: 'app-foundations',
  standalone: true,
  templateUrl: './foundations.component.html',
  styleUrl: './foundations.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FoundationsComponent {
  protected readonly cards: readonly FoundationCard[] = [
    {
      icon: '🎯',
      title: 'Ambassadeurs',
      description:
        'Envoyés et représentants de Christ sur la terre, chargés de traduire sa volonté au monde et de défendre les intérêts de son royaume.',
    },
    {
      icon: '👁',
      title: 'Réconciliation',
      description:
        "Dieu a pris l'initiative de nous réconcilier avec lui par Christ et a déposé en nous la parole de la réconciliation.",
    },
    {
      icon: '💎',
      title: 'Notre Mission',
      description:
        "Annoncer aux hommes ce ministère de réconciliation, pour qu'ils retrouvent la paix et la communion avec Dieu.",
    },
  ];
}
