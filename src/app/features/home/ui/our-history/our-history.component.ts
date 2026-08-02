import { afterNextRender, ChangeDetectionStrategy, Component, DestroyRef, ElementRef, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-our-history',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './our-history.component.html',
  styleUrl: './our-history.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OurHistoryComponent {
  private readonly el = inject(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    afterNextRender(() => {
      const section = this.el.nativeElement.firstElementChild as HTMLElement;
      const texts = section.querySelectorAll('.apc-about-leader__text') as NodeListOf<HTMLElement>;
      if (texts.length < 2) return;

      let ticking = false;

      const update = (): void => {
        const rect = section.getBoundingClientRect();
        const scrollDistance = section.offsetHeight - window.innerHeight;
        if (scrollDistance <= 0) return;

        const progress = Math.max(0, Math.min(1, -rect.top / scrollDistance));

        let t = progress <= 0.3 ? 0 : progress >= 0.7 ? 1 : (progress - 0.3) / 0.4;
        t = t * t * (3 - 2 * t);

        texts[0].style.opacity = String(1 - t);
        texts[0].style.filter = `blur(${t * 12}px)`;
        texts[1].style.opacity = String(t);
        texts[1].style.filter = `blur(${(1 - t) * 12}px)`;

        ticking = false;
      };

      const onScroll = (): void => {
        if (!ticking) {
          requestAnimationFrame(update);
          ticking = true;
        }
      };

      window.addEventListener('scroll', onScroll, { passive: true });
      update();

      this.destroyRef.onDestroy(() => {
        window.removeEventListener('scroll', onScroll);
      });
    });
  }
}
