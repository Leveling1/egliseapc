import { DOCUMENT, Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

import {
  DEFAULT_SHARE_IMAGE,
  SITE_NAME,
  absoluteUrl,
} from './site.config';

export interface SeoPage {
  /** Titre complet, tel qu'il s'affiche dans l'onglet et les résultats. */
  readonly title: string;
  readonly description: string;
  /** Chemin de la page, par exemple `/a-propos`. */
  readonly path: string;
  /** Image de partage ; à défaut, l'image par défaut du site. */
  readonly image?: string | null;
  readonly type?: 'website' | 'article';
  readonly publishedTime?: string | null;
  readonly author?: string | null;
}

/**
 * Balises de référencement et de partage, posées page par page.
 *
 * Tout passe par `Meta`, `Title` et `DOCUMENT`, qui fonctionnent aussi
 * pendant le prérendu : les balises se retrouvent donc dans le HTML statique
 * livré aux moteurs et aux aperçus de WhatsApp ou Facebook, sans dépendre de
 * l'exécution du JavaScript.
 *
 * Ce service ne touche jamais au contenu visible d'une page.
 */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);

  apply(page: SeoPage): void {
    const url = absoluteUrl(page.path);
    const image = absoluteUrl(page.image || DEFAULT_SHARE_IMAGE);
    const type = page.type ?? 'website';

    this.title.setTitle(page.title);

    this.setName('description', page.description);

    // Open Graph : c'est ce que lisent WhatsApp et Facebook, le canal de
    // partage principal de la communauté. Sans ces balises, un lien partagé
    // n'affiche qu'une URL nue.
    this.setProperty('og:title', page.title);
    this.setProperty('og:description', page.description);
    this.setProperty('og:image', image);
    this.setProperty('og:url', url);
    this.setProperty('og:type', type);
    this.setProperty('og:site_name', SITE_NAME);
    this.setProperty('og:locale', 'fr_FR');

    this.setName('twitter:card', 'summary_large_image');
    this.setName('twitter:title', page.title);
    this.setName('twitter:description', page.description);
    this.setName('twitter:image', image);

    if (type === 'article' && page.publishedTime) {
      this.setProperty('article:published_time', page.publishedTime);
    } else {
      this.removeProperty('article:published_time');
    }

    if (type === 'article' && page.author) {
      this.setProperty('article:author', page.author);
    } else {
      this.removeProperty('article:author');
    }

    this.setCanonical(url);
  }

  /**
   * Données structurées, identifiées par une clé pour être remplacées plutôt
   * qu'empilées à chaque navigation.
   */
  setJsonLd(key: string, data: unknown): void {
    const id = `seo-jsonld-${key}`;
    let script = this.document.getElementById(id) as HTMLScriptElement | null;

    if (!script) {
      script = this.document.createElement('script');
      script.id = id;
      script.type = 'application/ld+json';
      this.document.head.appendChild(script);
    }

    script.textContent = JSON.stringify(data);
  }

  removeJsonLd(key: string): void {
    this.document.getElementById(`seo-jsonld-${key}`)?.remove();
  }

  /**
   * URL canonique : sans elle, Google peut hésiter entre plusieurs variantes
   * d'une même adresse (barre finale, paramètres de suivi) et répartir
   * l'autorité de la page entre elles au lieu de la concentrer.
   */
  private setCanonical(url: string): void {
    let link = this.document.querySelector<HTMLLinkElement>('link[rel="canonical"]');

    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }

    link.setAttribute('href', url);
  }

  private setName(name: string, content: string): void {
    this.meta.updateTag({ name, content });
  }

  private setProperty(property: string, content: string): void {
    this.meta.updateTag({ property, content }, `property='${property}'`);
  }

  private removeProperty(property: string): void {
    this.meta.removeTag(`property='${property}'`);
  }
}
