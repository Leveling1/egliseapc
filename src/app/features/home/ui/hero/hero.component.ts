import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import {
  CylinderCarouselComponent,
  type CarouselImage,
} from '../../../../shared/components/cylinder-carousel/cylinder-carousel.component';
import { heroFrame } from './hero-animation';
import { handwriting, introTiming } from './hero-intro';
import { WELCOME_STROKES, WELCOME_TRANSFORM, WELCOME_VIEWBOX } from './welcome-strokes';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CylinderCarouselComponent, RouterLink],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroComponent {
  protected readonly carouselImages: readonly CarouselImage[] = [
    { src: '/images/home/hero_1.jpg', alt: '' },
    { src: '/images/home/hero_2.jpg', alt: '' },
    { src: '/images/home/hero_3.jpg', alt: '' },
    { src: '/images/home/hero_4.jpg', alt: '' },
    { src: '/images/home/hero_5.jpg', alt: '' },
    { src: '/images/home/hero_6.jpg', alt: '' },
    { src: '/images/home/hero_7.jpg', alt: '' },
    { src: '/images/home/hero_8.jpg', alt: '' },
    { src: '/images/home/hero_9.jpg', alt: '' },
    { src: '/images/home/hero_10.jpg', alt: '' },
    { src: '/images/home/hero_11.jpg', alt: '' },
    { src: '/images/home/hero_12.jpg', alt: '' },
  ];

  /**
   * Lettrage « Bienvenue chez », écrit à la main au chargement.
   *
   * Il complète le titre au lieu de le doubler : les deux forment une seule
   * phrase, disposée comme sur l'affiche de référence. Le lettrage reste
   * masqué aux lecteurs d'écran — c'est une image de texte, et le titre qui
   * suit porte déjà le nom de l'Église.
   */
  protected readonly scriptViewBox = WELCOME_VIEWBOX;
  protected readonly scriptTransform = WELCOME_TRANSFORM;

  protected readonly scriptStrokes = computed(() => handwriting(WELCOME_STROKES));

  protected readonly timing = computed(() => introTiming(WELCOME_STROKES));

  private readonly elementRef: ElementRef<HTMLElement> = inject(ElementRef);

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const root = this.elementRef.nativeElement;
      const pin = root.querySelector<HTMLElement>('.apc-hero-pin');
      const stage = root.querySelector<HTMLElement>('.apc-hero__stage');
      const content = root.querySelector<HTMLElement>('.apc-hero__content');
      const portrait = root.querySelector<HTMLElement>('.apc-hero__portrait');
      const texts = root.querySelectorAll<HTMLElement>('.apc-hero-history__text');

      if (!pin || !stage || !content || !portrait || texts.length < 2) return;

      let running = true;

      const update = (): void => {
        // Tout le calcul vit dans `heroFrame`, testé séparément. Ici on ne
        // fait que mesurer le défilement et appliquer le résultat.
        const frame = heroFrame(
          -pin.getBoundingClientRect().top,
          window.innerHeight,
          pin.offsetHeight,
        );

        content.style.opacity = String(frame.contentOpacity);
        content.style.transform = `translateY(${frame.contentShift}px)`;

        stage.style.transform = `scale(${frame.stageScale})`;
        stage.style.opacity = String(frame.stageOpacity);

        portrait.style.opacity = String(frame.portraitOpacity);
        portrait.style.transform = `scale(${frame.portraitScale})`;

        texts[0].style.opacity = String(frame.historyOpacity[0]);
        texts[0].style.filter = `blur(${frame.historyBlur[0]}px)`;
        texts[1].style.opacity = String(frame.historyOpacity[1]);
        texts[1].style.filter = `blur(${frame.historyBlur[1]}px)`;

        if (running) requestAnimationFrame(update);
      };

      // Boucle continue plutôt qu'écoute de l'événement `scroll` : pendant un
      // défilement rapide ou inertiel, des événements sont regroupés ou
      // manqués, et l'animation se fige dans un état intermédiaire —
      // typiquement en remontant vers le haut de la page.
      requestAnimationFrame(update);

      destroyRef.onDestroy(() => {
        running = false;
      });
    });
  }
}
