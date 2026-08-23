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
  advanceParallax,
  amplitudesFor,
  columnShift,
  columnsFor,
  distributeColumns,
  initialSprings,
  latchProgress,
  masonryLayout,
  startGridCentre,
  scrollProgress,
  wideColumnCount,
  type ParallaxSprings,
} from './parallax-motion';

export interface GalleryPhoto {
  readonly src: string;
  /** Largeur réelle du fichier, en pixels. */
  readonly width: number;
  /** Hauteur réelle du fichier, en pixels. */
  readonly height: number;
  /**
   * Description pour les lecteurs d'écran.
   *
   * Vide pour une photo décorative : une description générique répétée à
   * l'identique sur toute une galerie est plus gênante que pas de description
   * du tout, car elle s'annonce sans rien apprendre.
   */
  readonly alt?: string;
  /** Légende révélée au survol. Omise, aucun cartouche n'est posé. */
  readonly caption?: string;
}

/**
 * Nombre de colonnes retenu au prérendu.
 *
 * Le HTML statique est produit sans écran : il faut bien trancher. Le
 * composant corrige dès sa première image côté navigateur, et la mise en page
 * ne dépendant que du nombre de colonnes, la correction ne coûte rien.
 */
const PRERENDER_COLUMNS = 3;

/**
 * Course sur laquelle se joue l'entrée, en proportion de la hauteur d'écran.
 *
 * Une hauteur d'écran : le mur est posé au moment où l'on arrive à sa hauteur,
 * et tout ce qui suit est la galerie elle-même.
 */
const ENTRY_SPAN_RATIO = 1;

/**
 * Mur de photos en parallaxe.
 *
 * Il n'existe qu'une seule mise en page — les colonnes du mur, où chaque photo
 * garde ses proportions. L'animation ne fait que la déformer au départ : le mur
 * arrive incliné, remonté, effacé, ses colonnes décalées les unes par rapport
 * aux autres, puis tout se résorbe et il retrouve sa place. L'état final est
 * donc le mur nu, sans aucune transformation.
 *
 * Toute la mécanique — progression, interpolations, ressorts, répartition —
 * vit dans parallax-motion.ts, testé à part. Ce composant ne fait que mesurer
 * et appliquer.
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

  private readonly columnCount = signal(PRERENDER_COLUMNS);

  protected readonly columns = computed(() =>
    distributeColumns(this.photos(), this.columnCount()),
  );

  private readonly elementRef: ElementRef<HTMLElement> = inject(ElementRef);

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const root = this.elementRef.nativeElement.querySelector<HTMLElement>('.apc-wall');
      const grid = root?.querySelector<HTMLElement>('.apc-wall__grid');

      if (!root || !grid) return;

      this.columnCount.set(columnsFor(window.innerWidth));

      const onResize = (): void => this.columnCount.set(columnsFor(window.innerWidth));
      window.addEventListener('resize', onResize, { passive: true });

      // Sans mouvement, le mur reste tel que le CSS le pose : à plat, à sa
      // place. C'est aussi ce que voient ceux dont le JavaScript n'a pas
      // abouti — la galerie reste alors une galerie.
      const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

      // La progression ne redescend jamais : remonter pour regarder une photo
      // ne doit pas renvoyer le mur à sa position de départ.
      let progress = 0;
      const measure = (): number => {
        progress = latchProgress(
          progress,
          scrollProgress(root.getBoundingClientRect().top, window.innerHeight * ENTRY_SPAN_RATIO),
        );
        return progress;
      };

      /**
       * Amplitudes du moment.
       *
       * La largeur du mur est relevée sur la mise en page — `offsetWidth`, non
       * faussé par l'agrandissement en cours, contrairement à
       * `getBoundingClientRect`. C'est elle qui détermine de combien il faut
       * agrandir pour déborder de l'écran : le mur étant plafonné à 1280 px,
       * un écran de 2560 en réclame bien plus qu'un écran de 1280.
       */
      const currentAmplitudes = () => amplitudesFor(window.innerWidth, window.innerHeight);

      /**
       * Trajet de chaque photo, de la grille de départ vers sa case du mur.
       *
       * Le document ne contient jamais que le mur définitif : la grille de
       * départ n'est pas construite, elle est calculée. Chaque photo reçoit le
       * déplacement qui l'amène de sa case dans le mur à sa case dans la
       * grille large — et c'est ce déplacement qui se résorbe au défilement.
       *
       * L'arrivée est donc exacte par construction : quand le déplacement
       * s'annule, chaque photo est là où la mise en page l'a posée, sans que
       * rien n'ait à le garantir.
       *
       * Les positions sont relevées une fois par mise en page, jamais à chaque
       * image : les lire soixante fois par seconde forcerait autant de
       * recalculs de mise en page, juste après l'avoir modifiée.
       */
      let travels: { el: HTMLElement; dx: number; dy: number }[] = [];
      let layoutKey = '';

      const refreshTravels = (): void => {
        const key = `${grid.offsetWidth}:${grid.children.length}:${window.innerHeight}`;
        if (key === layoutKey) return;
        layoutKey = key;

        for (const { el } of travels) {
          el.style.removeProperty('--apc-photo-x');
          el.style.removeProperty('--apc-photo-y');
        }

        const column = grid.querySelector<HTMLElement>('.apc-wall__column');
        const cards = Array.from(grid.querySelectorAll<HTMLElement>('.apc-wall__card'));
        if (!column || cards.length === 0) {
          travels = [];
          return;
        }

        // Tout se lit sur la mise en page — `offset*` — et jamais sur le
        // rendu : `getBoundingClientRect` renverrait la boîte de la forme
        // inclinée et agrandie, qui n'a rien à voir avec les cases.
        const columnWidth = column.offsetWidth;
        const gap = parseFloat(getComputedStyle(grid).columnGap) || 0;
        const wide = masonryLayout(
          cards.map((el) => ({ width: el.offsetWidth, height: el.offsetHeight })),
          wideColumnCount(grid.children.length),
          columnWidth,
          gap,
        );

        const amplitudes = currentAmplitudes();

        // Centrée horizontalement sur le mur ; verticalement, il faut remonter
        // la transformation, car la remontée et l'agrandissement s'opèrent
        // autour du centre du mur et non de celui de cette grille.
        const originX = grid.offsetLeft + grid.offsetWidth / 2 - wide.width / 2;
        const originY =
          startGridCentre(
            grid.offsetTop + grid.offsetHeight / 2,
            window.innerHeight,
            amplitudes.liftFrom,
            amplitudes.scaleFrom,
          ) -
          wide.height / 2;

        travels = cards.map((el, index) => ({
          el,
          dx: originX + wide.cells[index].x - el.offsetLeft,
          dy: originY + wide.cells[index].y - el.offsetTop,
        }));
      };

      let springs: ParallaxSprings = initialSprings(measure(), currentAmplitudes());
      let previous = performance.now();
      let running = !still;

      const update = (now: number): void => {
        const elapsed = (now - previous) / 1000;
        previous = now;

        refreshTravels();
        springs = advanceParallax(springs, measure(), elapsed, currentAmplitudes());

        // L'ordre reproduit celui qu'appliquait la référence : la translation
        // d'abord, les rotations ensuite. L'inverser inclinerait le
        // déplacement au lieu de déplacer l'inclinaison.
        // L'agrandissement vient en dernier, donc s'applique en premier aux
        // coordonnées du mur : la remontée reste ainsi exprimée en pixels
        // d'écran, et non en pixels agrandis.
        grid.style.transform =
          `translateY(${springs.translateY.value.toFixed(2)}px) ` +
          `rotateX(${springs.rotateX.value.toFixed(3)}deg) ` +
          `rotateZ(${springs.rotateZ.value.toFixed(3)}deg) ` +
          `scale(${springs.scale.value.toFixed(4)})`;
        grid.style.opacity = springs.opacity.value.toFixed(3);

        // Les colonnes sont relues à chaque image plutôt que capturées une
        // fois : leur nombre change avec la largeur de l'écran, et une liste
        // figée désignerait des éléments que le gabarit a remplacés.
        const offset = springs.columnOffset.value;
        grid.querySelectorAll<HTMLElement>('.apc-wall__column').forEach((column, index) => {
          // Une seule écriture par colonne, et non par photo : toutes les
          // photos d'une colonne partagent le même décalage, qu'elles héritent
          // par cette variable.
          column.style.setProperty(
            '--apc-column-shift',
            `${columnShift(offset, index).toFixed(2)}px`,
          );
        });

        const spread = springs.spread.value;
        for (const { el, dx, dy } of travels) {
          el.style.setProperty('--apc-photo-x', `${(spread * dx).toFixed(2)}px`);
          el.style.setProperty('--apc-photo-y', `${(spread * dy).toFixed(2)}px`);
        }

        if (running) requestAnimationFrame(update);
      };

      // Boucle continue plutôt qu'écoute de l'événement `scroll` : le ressort
      // doit continuer de se poser après l'arrêt du doigt, et un défilement
      // inertiel regroupe ou saute des événements.
      if (running) requestAnimationFrame(update);

      destroyRef.onDestroy(() => {
        running = false;
        window.removeEventListener('resize', onResize);
      });
    });
  }
}
