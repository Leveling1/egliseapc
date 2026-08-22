import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  input,
} from '@angular/core';

import {
  advanceParallax,
  initialSprings,
  reverseTranslate,
  scrollProgress,
  splitRows,
  type ParallaxSprings,
} from './parallax-motion';

export interface GalleryPhoto {
  readonly src: string;
  /** Description pour les lecteurs d'écran. */
  readonly alt: string;
  /** Légende révélée au survol. */
  readonly caption: string;
}

interface GalleryRow {
  readonly photos: readonly GalleryPhoto[];
  /** Rangée composée de droite à gauche, comme dans la référence. */
  readonly reversed: boolean;
  /** Sens du glissement : vers la droite, ou à contresens. */
  readonly forward: boolean;
  /** Seule la première rangée est chargée sans attendre. */
  readonly eager: boolean;
}

/** Nombre de photos par rangée, comme dans la référence. */
const PER_ROW = 5;

/**
 * Galerie en parallaxe, transposée du composant React de référence.
 *
 * Trois rangées de photos glissent en sens alternés pendant que la grille
 * entière se redresse : elle entre inclinée, remontée et presque effacée, puis
 * se pose à plat sur le premier cinquième du défilement.
 *
 * Toute la mécanique — progression, interpolations, ressorts — vit dans
 * parallax-motion.ts, testé à part. Ce composant ne fait que mesurer et
 * appliquer.
 */
@Component({
  selector: 'app-parallax-gallery',
  standalone: true,
  templateUrl: './parallax-gallery.component.html',
  styleUrl: './parallax-gallery.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParallaxGalleryComponent {
  readonly photos = input.required<readonly GalleryPhoto[]>();

  protected readonly rows = computed<readonly GalleryRow[]>(() => {
    const [first, second, third] = splitRows(this.photos(), PER_ROW);

    return [
      { photos: first, reversed: true, forward: true, eager: true },
      { photos: second, reversed: false, forward: false, eager: false },
      { photos: third, reversed: true, forward: true, eager: false },
    ];
  });

  private readonly elementRef: ElementRef<HTMLElement> = inject(ElementRef);

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const root = this.elementRef.nativeElement.querySelector<HTMLElement>('.apc-parallax');
      const grid = root?.querySelector<HTMLElement>('.apc-parallax__grid');
      const rows = root?.querySelectorAll<HTMLElement>('.apc-parallax__row');

      if (!root || !grid || !rows || rows.length < 3) return;

      // Sans mouvement, la grille reste telle que le CSS la pose : à plat,
      // pleinement visible. C'est aussi l'état que voient ceux dont le
      // JavaScript n'a pas abouti — la galerie reste alors une galerie.
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      const measure = (): number => {
        const rect = root.getBoundingClientRect();
        return scrollProgress(rect.top, rect.height);
      };

      let springs: ParallaxSprings = initialSprings(measure());
      let previous = performance.now();
      let running = true;

      const update = (now: number): void => {
        const elapsed = (now - previous) / 1000;
        previous = now;

        springs = advanceParallax(springs, measure(), elapsed);

        // L'ordre reproduit celui qu'appliquait la référence : la translation
        // d'abord, les rotations ensuite. L'inverser inclinerait le
        // déplacement au lieu de déplacer l'inclinaison.
        grid.style.transform =
          `translateY(${springs.translateY.value.toFixed(2)}px) ` +
          `rotateX(${springs.rotateX.value.toFixed(3)}deg) ` +
          `rotateZ(${springs.rotateZ.value.toFixed(3)}deg)`;
        grid.style.opacity = springs.opacity.value.toFixed(3);

        const x = springs.translateX.value;
        const reverse = reverseTranslate(x);
        rows.forEach((row, index) => {
          // Une seule écriture par rangée, et non par carte : toutes les
          // cartes d'une rangée partagent le même déplacement, qu'elles
          // héritent par cette variable.
          const value = index === 1 ? reverse : x;
          row.style.setProperty('--apc-parallax-x', `${value.toFixed(2)}px`);
        });

        if (running) requestAnimationFrame(update);
      };

      // Boucle continue plutôt qu'écoute de l'événement `scroll` : le ressort
      // doit continuer de se poser après l'arrêt du doigt, et un défilement
      // inertiel regroupe ou saute des événements.
      requestAnimationFrame(update);

      destroyRef.onDestroy(() => {
        running = false;
      });
    });
  }
}
