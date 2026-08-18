import { Injectable } from '@angular/core';

export interface GeocodeResult {
  readonly latitude: number;
  readonly longitude: number;
  /** Adresse normalisée renvoyée par le service, à montrer pour confirmation. */
  readonly displayName: string;
}

/**
 * Conversion d'une adresse en coordonnées, via Nominatim (OpenStreetMap).
 *
 * Choisi plutôt que Google Maps : aucune clé d'API à gérer ni à exposer dans
 * le bundle, et c'est déjà le fond de carte du site, qui utilise Leaflet.
 *
 * Nominatim demande un usage raisonnable (environ une requête par seconde) :
 * l'appel est donc déclenché à la sortie du champ, jamais à chaque frappe.
 */
@Injectable({ providedIn: 'root' })
export class GeocodingService {
  private readonly endpoint = 'https://nominatim.openstreetmap.org/search';

  /**
   * Renvoie null quand aucun lieu ne correspond : l'appelant doit alors
   * laisser l'administrateur saisir les coordonnées à la main plutôt que de
   * placer un point au hasard.
   */
  async lookup(address: string): Promise<GeocodeResult | null> {
    const query = address.trim();
    if (query.length < 4) return null;

    const url = `${this.endpoint}?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`;

    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`La recherche d'adresse a échoué (code ${response.status}).`);
    }

    const results = (await response.json()) as {
      lat?: string;
      lon?: string;
      display_name?: string;
    }[];

    const first = results[0];
    if (!first?.lat || !first?.lon) return null;

    return {
      latitude: Number(first.lat),
      longitude: Number(first.lon),
      displayName: first.display_name ?? query,
    };
  }
}
