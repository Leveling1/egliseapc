import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
  signal,
} from '@angular/core';

interface FoundationPanel {
  /** Identifiant stable, sert aux ancres et aux points de progression. */
  readonly id: string;
  readonly title: string;
  readonly image: string;
  readonly description: string;
  readonly items?: readonly string[];
}

/**
 * Défilement pendant lequel une partie reste posée, texte net, en hauteurs
 * d'écran. Un écran entier : le temps de lire la Mission et ses deux ailes.
 */
const HOLD_SCREENS = 1;

/**
 * Défilement que prend le passage d'une partie à la suivante, en hauteurs
 * d'écran. Un demi-écran : assez pour que le fondu se voie, pas assez pour
 * qu'on lise à travers.
 */
const FADE_SCREENS = 0.5;

/**
 * Nos fondements : trois parties - Objectif, Mission, Alliance - chacune sur
 * sa photo voilée, en plein écran.
 *
 * La section s'épingle le temps de trois étapes de défilement ; l'image et le
 * texte de chaque partie se fondent dans les suivants à mesure que l'on
 * avance, et trois points disent où l'on en est.
 *
 * Sans JavaScript, ou si le mouvement est réduit, rien n'est épinglé : les
 * trois parties se suivent simplement, chacune sur sa photo. C'est aussi ce
 * que contient le HTML prérendu - le contenu est là avant tout script.
 */
@Component({
  selector: 'app-foundations',
  standalone: true,
  templateUrl: './foundations.component.html',
  styleUrl: './foundations.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FoundationsComponent {
  protected readonly panels: readonly FoundationPanel[] = [
    {
      id: 'objectif',
      title: 'Objectif',
      image: '/images/about-us/objectif.webp',
      description:
        'Notre objectif est de gagner les âmes au Seigneur Jésus-Christ, en prêchant la bonne nouvelle du royaume des cieux.',
    },
    {
      id: 'mission',
      title: 'Mission',
      image: '/images/about-us/mission.webp',
      description:
        'Notre mission est de réconcilier le monde avec Dieu. Pour cela, nous fonctionnons avec deux ailes :',
      items: [
        "Aile apostolique - planter des églises et faire des disciples en tout lieu, selon Matthieu 28:19.",
        "Aile prophétique - met l'accent sur une grande vision révélée par Dieu à son serviteur le Prophète Garry KENGE MBULU, appelée le Rassemblement des Aigles, depuis 2002, selon Job 39 : « Là où il y a des cadavres, les aigles s'assemblent. »",
      ],
    },
    {
      id: 'alliance',
      title: 'Alliance',
      image: '/images/about-us/alliance.webp',
      description: "Notre alliance avec Dieu : Sainteté à l'Éternel.",
    },
  ];

  /** Partie en cours, pour les points de progression. */
  protected readonly active = signal(0);

  /** Vrai une fois l'épinglage en place ; le CSS s'y accroche. */
  protected readonly pinned = signal(false);

  /**
   * Hauteur de l'enveloppe épinglée.
   *
   * Un palier par partie, un fondu entre chaque, plus l'écran qui reste
   * affiché : trois parties font 1 + 0,5 + 1 + 0,5 + 1 = 4 écrans de
   * défilement, soit une enveloppe de 5 écrans.
   */
  protected readonly pinHeight = `${(this.travelScreens + 1) * 100}vh`;

  private get travelScreens(): number {
    const n = this.panels.length;
    return n * HOLD_SCREENS + (n - 1) * FADE_SCREENS;
  }

  private readonly elementRef: ElementRef<HTMLElement> = inject(ElementRef);

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      // Mouvement réduit : les parties restent empilées, rien à animer.
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      if (!this.elementRef.nativeElement.querySelector('.apc-found')) return;

      this.pinned.set(true);

      let frame = 0;
      const schedule = (): void => {
        if (frame !== 0) return;
        frame = requestAnimationFrame(() => {
          frame = 0;
          this.measure();
        });
      };

      window.addEventListener('scroll', schedule, { passive: true });
      window.addEventListener('resize', schedule, { passive: true });
      this.measure();

      destroyRef.onDestroy(() => {
        window.removeEventListener('scroll', schedule);
        window.removeEventListener('resize', schedule);
        if (frame) cancelAnimationFrame(frame);
      });
    });
  }

  /**
   * Relit la position de défilement et pose l'état de chaque partie.
   *
   * Les parties sont relues dans le document à chaque mesure plutôt que
   * capturées une fois : Angular peut recréer ces nœuds (hydratation, retour
   * sur la page), et une liste figée écrirait alors sur des éléments qui
   * n'y sont plus.
   */
  private measure(): void {
    const host = this.elementRef.nativeElement;
    const pin = host.querySelector<HTMLElement>('.apc-found');
    const panels = Array.from(host.querySelectorAll<HTMLElement>('.apc-found__panel'));
    if (!pin || panels.length === 0) return;

    const rect = pin.getBoundingClientRect();
    const travel = rect.height - window.innerHeight;
    // Défilement parcouru depuis l'épinglage, en hauteurs d'écran.
    const scrolled = travel > 0 ? (-rect.top / travel) * this.travelScreens : 0;

    let active = 0;
    panels.forEach((panel, index) => {
      // Les parties s'empilent dans l'ordre, chacune au-dessus de la
      // précédente : la suivante apparaît par-dessus pendant que celle d'en
      // dessous reste entière. Deux couches à demi transparentes sur du noir
      // auraient creusé un trou sombre au milieu de chaque passage ; ici la
      // scène reste toujours pleine.
      //
      // Chaque partie tient son palier, puis la suivante entre pendant
      // FADE_SCREENS et tient le sien à son tour.
      const fadeStart = index * HOLD_SCREENS + (index - 1) * FADE_SCREENS;
      const visible =
        index === 0 ? 1 : Math.min(1, Math.max(0, (scrolled - fadeStart) / FADE_SCREENS));
      panel.style.setProperty('--apc-panel', visible.toFixed(3));
      panel.style.zIndex = String(index + 1);
      // La partie « en cours » est la plus haute qui couvre déjà plus de la
      // moitié de la scène : c'est à ce moment que les textes se relaient.
      if (visible >= 0.5) active = index;
    });

    this.active.set(active);
  }

  /** Défile jusqu'à la partie demandée, depuis un point de progression. */
  protected goTo(index: number): void {
    const pin = this.elementRef.nativeElement.querySelector<HTMLElement>('.apc-found');
    if (!pin) return;

    if (!this.pinned()) {
      // Parties empilées : chaque panneau est un écran, on y va directement.
      const panel = pin.querySelectorAll<HTMLElement>('.apc-found__panel')[index];
      panel?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    // Milieu du palier de la partie demandée.
    const target = index * (HOLD_SCREENS + FADE_SCREENS) + HOLD_SCREENS / 2;
    const travel = pin.offsetHeight - window.innerHeight;
    const top = pin.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({
      top: top + (travel * target) / this.travelScreens,
      behavior: 'smooth',
    });
  }
}
