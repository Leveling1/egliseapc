import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { ParallaxHeroImagesComponent } from '../../../../shared/components/parallax-hero-images/parallax-hero-images.component';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [ParallaxHeroImagesComponent, RouterLink],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroComponent {
  protected readonly parallaxImages: readonly string[] = [
    '/images/home/hero_1.jpg',
    '/images/home/hero_2.jpg',
    '/images/home/prophete-garry-bg.webp',
    '/images/home/hero_4.jpg',
    '/images/home/hero_5.jpg',
    '/images/home/hero_6.jpg',
  ];

  // Grows into a fullscreen fixed overlay as the page scrolls, then holds
  // there while this same pinned viewport crossfades from "Qui sommes-nous"
  // to "Le Visionnaire" on top of it — one continuous pin, no hand-off to a
  // second pinned section, so there's no dead scroll between the two.
  protected readonly growImage = '/images/home/prophete-garry-bg.webp';

  private readonly elementRef: ElementRef<HTMLElement> = inject(ElementRef);

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const texts = this.elementRef.nativeElement.querySelectorAll<HTMLElement>('.apc-hero-history__text');
      if (texts.length < 2) {
        return;
      }

      let ticking = false;
      const update = (): void => {
        ticking = false;
        const pinEl = this.elementRef.nativeElement.querySelector<HTMLElement>('.apc-hero-pin');
        if (!pinEl) {
          return;
        }

        const rect = pinEl.getBoundingClientRect();
        const scrolledIntoPin = -rect.top;
        // Matches the grow image's own motion budget (parallax-hero-images):
        // the text layer only starts once that first viewport-height of
        // scroll — the move-then-grow animation — has fully played out.
        const growthBudget = window.innerHeight;
        const textBudget = window.innerHeight;

        // Also hide both once scrolled fully past the pin — otherwise the
        // clamped progress below would stay pinned at 1 forever, leaving
        // "Le Visionnaire" visible (it's `position: fixed`) all the way
        // down the page, past every later section and into the footer.
        if (scrolledIntoPin < growthBudget || scrolledIntoPin >= pinEl.offsetHeight) {
          texts[0].style.opacity = '0';
          texts[1].style.opacity = '0';
          return;
        }

        const rawProgress = (scrolledIntoPin - growthBudget) / textBudget;
        const progress = Math.max(0, Math.min(1, rawProgress));

        let t = progress <= 0.3 ? 0 : progress >= 0.7 ? 1 : (progress - 0.3) / 0.4;
        t = t * t * (3 - 2 * t);

        texts[0].style.opacity = String(1 - t);
        texts[0].style.filter = `blur(${t * 12}px)`;
        texts[1].style.opacity = String(t);
        texts[1].style.filter = `blur(${(1 - t) * 12}px)`;
      };

      const onScroll = (): void => {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(update);
        }
      };

      window.addEventListener('scroll', onScroll, { passive: true });
      update();

      destroyRef.onDestroy(() => {
        window.removeEventListener('scroll', onScroll);
      });
    });
  }
}
