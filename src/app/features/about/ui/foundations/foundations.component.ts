import { ChangeDetectionStrategy, Component } from '@angular/core';

interface FoundationCard {
  readonly icon: string;
  readonly title: string;
  readonly description: string;
  readonly items?: readonly string[];
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
      title: 'Objectif',
      description:
        'Notre objectif est de gagner les âmes au Seigneur Jésus-Christ, en prêchant la bonne nouvelle du royaume des cieux.',
    },
    {
      icon: '🕊',
      title: 'Mission',
      description:
        'Notre mission est de réconcilier le monde avec Dieu. Pour cela, nous fonctionnons avec deux ailes :',
      items: [
        "Aile apostolique — planter des églises et faire des disciples en tout lieu, selon Matthieu 28:19.",
        "Aile prophétique — met l'accent sur une grande vision révélée par Dieu à son serviteur le Prophète Garry KENGE MBULU, appelée le Rassemblement des Aigles, depuis 2002, selon Job 39 : « Là où il y a des cadavres, les aigles s'assemblent. »",
      ],
    },
    {
      icon: '📜',
      title: 'Alliance',
      description: "Notre alliance avec Dieu : Sainteté à l'Éternel.",
    },
  ];
}
