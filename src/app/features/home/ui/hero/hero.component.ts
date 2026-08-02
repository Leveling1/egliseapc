import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ParallaxHeroImagesComponent } from '../../../../shared/components/parallax-hero-images/parallax-hero-images.component';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [ParallaxHeroImagesComponent],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroComponent {
  protected readonly parallaxImages: readonly string[] = [
    '/images/home/hero_1.jpg',
    '/images/home/hero_2.jpg',
    '/images/home/hero_3.jpg',
    '/images/home/hero_4.jpg',
    '/images/home/hero_5.jpg',
    '/images/home/hero_6.jpg',
  ];
}
