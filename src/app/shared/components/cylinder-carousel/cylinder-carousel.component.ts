import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';

import {
  cardTransform,
  cylinderGeometry,
  fillCylinder,
  type CylinderAxis,
} from './cylinder-geometry';

export interface CarouselImage {
  readonly src: string;
  readonly alt?: string;
}

/** En deçà de cette largeur, le cylindre bascule en rotation verticale. */
const VERTICAL_BREAKPOINT = 768;

/**
 * Carrousel cylindrique : les images tapissent la paroi d'un cylindre qui
 * tourne indéfiniment.
 *
 * Sur grand écran il tourne autour de l'axe vertical et remplit la largeur ;
 * sur téléphone, où la largeur manque mais la hauteur abonde, il bascule
 * autour de l'axe horizontal et remplit la hauteur.
 *
 * Toute la géométrie est calculée dans `cylinder-geometry`, à partir de la
 * taille du conteneur : le cylindre s'adapte donc à son cadre au lieu de le
 * subir. Les images fournies sont répétées autant que nécessaire pour fermer
 * le cylindre.
 */
@Component({
  selector: 'app-cylinder-carousel',
  standalone: true,
  templateUrl: './cylinder-carousel.component.html',
  styleUrl: './cylinder-carousel.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CylinderCarouselComponent {
  readonly images = input.required<readonly CarouselImage[]>();

  /** Durée d'un tour complet, en secondes. */
  readonly animationDuration = input(38);

  /** Espace entre deux cartes voisines, en pixels. */
  readonly gap = input(10);

  /** Rapport largeur / hauteur d'une carte. */
  readonly aspectRatio = input(0.7);

  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);

  /**
   * Taille mesurée du conteneur. Les valeurs de départ ne servent qu'au rendu
   * serveur, où aucune mesure n'est possible ; le navigateur les remplace dès
   * le premier affichage.
   */
  private readonly size = signal({ width: 1280, height: 720 });

  protected readonly axis = computed<CylinderAxis>(() =>
    this.size().width < VERTICAL_BREAKPOINT ? 'vertical' : 'horizontal',
  );

  protected readonly geometry = computed(() =>
    cylinderGeometry({
      containerWidth: this.size().width,
      containerHeight: this.size().height,
      axis: this.axis(),
      gap: this.gap(),
      aspectRatio: this.aspectRatio(),
    }),
  );

  /** Les images fournies, répétées pour fermer le cylindre. */
  protected readonly cards = computed(() =>
    fillCylinder(this.images(), this.geometry().count),
  );

  protected transformFor(index: number): string {
    return cardTransform(this.geometry(), index);
  }

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const element = this.host.nativeElement;

      const measure = (): void => {
        const rect = element.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          this.size.set({ width: rect.width, height: rect.height });
        }
      };

      measure();

      // ResizeObserver plutôt que l'événement `resize` de la fenêtre : le
      // conteneur peut changer de taille sans que la fenêtre bouge — barre
      // d'adresse mobile qui se rétracte, polices qui finissent de charger.
      const observer = new ResizeObserver(measure);
      observer.observe(element);

      destroyRef.onDestroy(() => observer.disconnect());
    });
  }
}
