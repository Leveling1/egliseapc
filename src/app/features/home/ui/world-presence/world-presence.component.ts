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

import { PublicContentService } from '../../../../core/content/public-content.service';
import type { ExtensionPublic } from '../../../../core/supabase/database.types';

interface MapCity {
  readonly name: string;
  readonly lat: number;
  readonly lng: number;
  readonly extension: ExtensionPublic;
}


@Component({
  selector: 'app-world-presence',
  standalone: true,
  templateUrl: './world-presence.component.html',
  styleUrl: './world-presence.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Leaflet builds its DOM (tiles, markers) imperatively, outside Angular's
  // template compiler, so Emulated encapsulation's scoping attribute never
  // reaches it. `::ng-deep` is banned project-wide, so this component's
  // styles are left unscoped instead - still colocated and lazy-loaded
  // with the component, just not attribute-scoped.
  encapsulation: ViewEncapsulation.None,
})
export class WorldPresenceComponent {
  private readonly content = inject(PublicContentService);
  private readonly mapContainer = viewChild.required<ElementRef<HTMLElement>>('mapContainer');
  private map: LeafletMap | null = null;

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      this.whenNear(destroyRef, () => void this.initMap(destroyRef));
    });
  }

  /**
   * N'appelle `ready` qu'à l'approche de la section.
   *
   * La carte est loin sous le pli - le hero seul occupe trois écrans. Charger
   * Leaflet et ses tuiles dès l'arrivée faisait partir près d'un mégaoctet
   * en concurrence avec les photos du hero, sur des connexions où chaque
   * kilooctet compte. On attend donc que le lecteur soit à un écran de là.
   */
  private whenNear(destroyRef: DestroyRef, ready: () => void): void {
    const host = this.mapContainer().nativeElement;

    if (typeof IntersectionObserver === 'undefined') {
      ready();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        ready();
      },
      { rootMargin: '100% 0px' },
    );
    observer.observe(host);
    destroyRef.onDestroy(() => observer.disconnect());
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
      // undefined without this fallback - the actual reported bug.
      L = (imported as unknown as { default?: typeof import('leaflet') }).default ?? imported;
    } catch (error) {
      console.error('Impossible de charger Leaflet pour la carte des extensions.', error);
      return;
    }

    // Les extensions sont lues avant d'initialiser la carte : sans point à
    // afficher, le cadrage automatique n'aurait rien à calculer.
    const cities: MapCity[] = (await this.content.extensions())
      .filter((extension) => extension.latitude !== null && extension.longitude !== null)
      .map((extension) => ({
        name: extension.city ?? extension.name,
        lat: extension.latitude as number,
        lng: extension.longitude as number,
        extension,
      }));

    if (cities.length === 0) {
      // Aucune extension géolocalisée : on laisse le bloc vide plutôt que
      // d'afficher une carte du monde sans repère.
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

    const markers = cities.map((city) => {
      const icon = L.divIcon({
        className: 'apc-world-marker',
        html: `<span class="apc-world-marker__dot"></span><span class="apc-world-marker__label">${this.escapeHtml(city.name)}</span>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      });
      const marker = L.marker([city.lat, city.lng], {
        icon,
        keyboard: true,
        title: `Afficher les informations de ${city.extension.name}`,
        alt: city.extension.name,
      }).addTo(map);
      marker.bindPopup(this.popupContent(city.extension, city.lat, city.lng), {
        maxWidth: 320,
        minWidth: 240,
        autoPanPadding: [20, 20],
      });
      return marker;
    });

    const bounds = L.latLngBounds(cities.map((city): [number, number] => [city.lat, city.lng]));

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

  /** Construit le contenu comme des nœuds texte : les données éditées restent inertes. */
  private popupContent(extension: ExtensionPublic, latitude: number, longitude: number): HTMLElement {
    const card = document.createElement('div');
    card.className = 'apc-map-popup';

    const title = document.createElement('h3');
    title.className = 'apc-map-popup__title';
    title.textContent = extension.name;
    card.append(title);

    const location = [extension.city, extension.country].filter(Boolean).join(', ');
    this.appendPopupDetail(card, 'Localisation', location);
    this.appendPopupDetail(card, 'Adresse', extension.address);
    this.appendPopupDetail(card, 'Responsable', extension.leader_name);
    this.appendPopupLink(card, 'Téléphone', extension.phone, `tel:${(extension.phone ?? '').replace(/\s+/g, '')}`);
    this.appendPopupLink(
      card,
      'WhatsApp',
      extension.whatsapp,
      `https://wa.me/${(extension.whatsapp ?? '').replace(/[^\d]/g, '')}`,
    );
    this.appendPopupLink(card, 'E-mail', extension.email, `mailto:${extension.email ?? ''}`);
    this.appendPopupDetail(card, 'Programmes', extension.opening_hours);

    const itinerary = document.createElement('a');
    itinerary.className = 'apc-map-popup__route';
    itinerary.href = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    itinerary.target = '_blank';
    itinerary.rel = 'noopener noreferrer';
    itinerary.textContent = 'Itinéraire';
    card.append(itinerary);

    return card;
  }

  private appendPopupDetail(parent: HTMLElement, label: string, value: string | null): void {
    if (!value) return;
    const row = document.createElement('p');
    row.className = 'apc-map-popup__detail';
    const term = document.createElement('strong');
    term.textContent = `${label} : `;
    row.append(term, document.createTextNode(value));
    parent.append(row);
  }

  private appendPopupLink(parent: HTMLElement, label: string, value: string | null, href: string): void {
    if (!value) return;
    const row = document.createElement('p');
    row.className = 'apc-map-popup__detail';
    const term = document.createElement('strong');
    term.textContent = `${label} : `;
    const link = document.createElement('a');
    link.href = href;
    link.textContent = value;
    if (href.startsWith('https:')) {
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    }
    row.append(term, link);
    parent.append(row);
  }

  private escapeHtml(value: string): string {
    return value.replace(/[&<>"']/g, (character) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    })[character]!);
  }
}
