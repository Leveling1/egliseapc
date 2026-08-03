import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  ViewEncapsulation,
  afterNextRender,
  inject,
  viewChild,
} from '@angular/core';
import type { Map as LeafletMap } from 'leaflet';

interface WorldPresenceCity {
  readonly name: string;
  readonly lat: number;
  readonly lng: number;
}

// Real-world coordinates of each extension's host city.
const CITIES: readonly WorldPresenceCity[] = [
  { name: 'Paris', lat: 48.8566, lng: 2.3522 },
  { name: 'Kinshasa', lat: -4.4419, lng: 15.2663 },
  { name: 'Nairobi', lat: -1.2921, lng: 36.8219 },
  { name: 'Bruxelles', lat: 50.8503, lng: 4.3517 },
  { name: 'Luanda', lat: -8.839, lng: 13.2894 },
  { name: 'Lisbonne', lat: 38.7223, lng: -9.1393 },
];

@Component({
  selector: 'app-world-presence',
  standalone: true,
  templateUrl: './world-presence.component.html',
  styleUrl: './world-presence.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Leaflet builds its DOM (tiles, markers) imperatively, outside Angular's
  // template compiler, so Emulated encapsulation's scoping attribute never
  // reaches it. `::ng-deep` is banned project-wide, so this component's
  // styles are left unscoped instead — still colocated and lazy-loaded
  // with the component, just not attribute-scoped.
  encapsulation: ViewEncapsulation.None,
})
export class WorldPresenceComponent {
  private readonly mapContainer = viewChild.required<ElementRef<HTMLElement>>('mapContainer');
  private map: LeafletMap | null = null;

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      void this.initMap(destroyRef);
    });
  }

  private async initMap(destroyRef: DestroyRef): Promise<void> {
    // Leaflet touches `window`/`document` on import, so it's loaded lazily
    // and only ever in the browser (afterNextRender never runs during SSR).
    let L: typeof import('leaflet');
    try {
      const imported = await import('leaflet');
      // Leaflet is a CommonJS/UMD package. The production build's dynamic
      // `import()` returns its whole exports object wrapped under `.default`
      // (unlike the dev server, which unwraps it), so `L.map` etc. would be
      // undefined without this fallback — the actual reported bug.
      L = (imported as unknown as { default?: typeof import('leaflet') }).default ?? imported;
    } catch (error) {
      console.error('Impossible de charger Leaflet pour la carte des extensions.', error);
      return;
    }

    const container = this.mapContainer().nativeElement;

    const map = L.map(container, {
      scrollWheelZoom: false,
    });
    this.map = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18,
    }).addTo(map);

    const markers = CITIES.map((city) => {
      const icon = L.divIcon({
        className: 'apc-world-marker',
        html: `<span class="apc-world-marker__dot"></span><span class="apc-world-marker__label">${city.name}</span>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      });
      return L.marker([city.lat, city.lng], { icon, keyboard: false, alt: city.name }).addTo(map);
    });

    const bounds = L.latLngBounds(CITIES.map((city): [number, number] => [city.lat, city.lng]));

    map.invalidateSize();
    map.fitBounds(bounds, { padding: [40, 40] });

    // The container's size can keep changing after this point on mobile
    // (address bar collapsing, web fonts loading, layout above it settling),
    // so a ResizeObserver re-measures Leaflet whenever that happens instead
    // of relying on a single invalidateSize() call plus a window resize
    // listener, which misses those in-page layout shifts.
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(container);

    destroyRef.onDestroy(() => {
      resizeObserver.disconnect();
      markers.forEach((marker) => marker.remove());
      map.remove();
    });
  }
}
