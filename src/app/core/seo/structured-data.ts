import type { ExtensionPublic, ProgrammePublic } from '../supabase/database.types';
import {
  CONTACT,
  ORGANIZATION_ALTERNATE_NAMES,
  ORGANIZATION_NAME,
  SITE_URL,
  SOCIAL_PROFILES,
  absoluteUrl,
} from './site.config';

/**
 * Données structurées schema.org.
 *
 * Elles ne changent rien à l'affichage : elles décrivent la page dans un
 * format que Google comprend, ce qui lui permet de savoir qu'il s'agit d'une
 * église, avec une adresse et des horaires, plutôt que d'une page quelconque.
 */

/** 0 = dimanche … 6 = samedi, comme en base. */
const SCHEMA_DAYS = [
  'https://schema.org/Sunday',
  'https://schema.org/Monday',
  'https://schema.org/Tuesday',
  'https://schema.org/Wednesday',
  'https://schema.org/Thursday',
  'https://schema.org/Friday',
  'https://schema.org/Saturday',
];

/**
 * Horaires d'ouverture déduits des programmes récurrents réellement publiés.
 *
 * Construits depuis la même source que la grille affichée : impossible qu'un
 * horaire annoncé à Google diverge de celui montré aux visiteurs, ce qui
 * serait le risque avec une liste écrite à la main.
 */
function openingHours(programmes: readonly ProgrammePublic[]): unknown[] {
  return programmes
    .filter(
      (programme) =>
        programme.kind === 'recurrent' &&
        programme.days_of_week?.length &&
        programme.start_time,
    )
    .map((programme) => ({
      '@type': 'OpeningHoursSpecification',
      name: programme.name,
      dayOfWeek: (programme.days_of_week ?? []).map((day) => SCHEMA_DAYS[day]),
      opens: (programme.start_time ?? '').slice(0, 5),
      ...(programme.end_time ? { closes: programme.end_time.slice(0, 5) } : {}),
    }));
}

/**
 * Extensions déclarées comme entités rattachées.
 *
 * Sans elles, Google ne verrait qu'une église de Kinshasa. Or Kinshasa est le
 * siège : la communauté est aussi implantée ailleurs, et une recherche faite
 * depuis Paris ou Lisbonne doit pouvoir la trouver.
 *
 * Construites depuis la table des extensions, elles suivent automatiquement
 * chaque ouverture ou fermeture.
 */
function subOrganizations(extensions: readonly ExtensionPublic[]): unknown[] {
  return extensions.map((extension) => ({
    '@type': 'Church',
    name: extension.name,
    ...(extension.city || extension.country
      ? {
          address: {
            '@type': 'PostalAddress',
            ...(extension.address ? { streetAddress: extension.address } : {}),
            ...(extension.city ? { addressLocality: extension.city } : {}),
            ...(extension.country ? { addressCountry: extension.country } : {}),
          },
        }
      : {}),
    ...(extension.latitude !== null && extension.longitude !== null
      ? {
          geo: {
            '@type': 'GeoCoordinates',
            latitude: extension.latitude,
            longitude: extension.longitude,
          },
        }
      : {}),
    ...(extension.phone ? { telephone: extension.phone } : {}),
  }));
}

export function churchSchema(
  programmes: readonly ProgrammePublic[] = [],
  extensions: readonly ExtensionPublic[] = [],
): unknown {
  const hours = openingHours(programmes);
  const branches = subOrganizations(extensions);
  const countries = [
    ...new Set(extensions.map((extension) => extension.country).filter(Boolean)),
  ];

  return {
    '@context': 'https://schema.org',
    '@type': 'Church',
    '@id': `${SITE_URL}/#church`,
    name: ORGANIZATION_NAME,
    alternateName: ORGANIZATION_ALTERNATE_NAMES,
    url: `${SITE_URL}/`,
    logo: absoluteUrl('/images/home/logo-apc.png'),
    image: absoluteUrl('/images/home/hero-main.webp'),
    description:
      'Église chrétienne Les Ambassadeurs Pour Christ (A.P.C) : cultes, ' +
      'enseignements et Rassemblement des Aigles (RDA). Siège à Kinshasa, ' +
      'avec des extensions dans plusieurs pays.',
    // Adresse du siège ; les autres implantations figurent dans
    // `subOrganization`.
    address: {
      '@type': 'PostalAddress',
      streetAddress: CONTACT.streetAddress,
      addressLocality: CONTACT.addressLocality,
      addressRegion: CONTACT.addressRegion,
      addressCountry: CONTACT.addressCountry,
    },
    telephone: CONTACT.phones,
    sameAs: SOCIAL_PROFILES,
    // Une liste vide serait un signal trompeur : on n'ajoute la clé que si
    // des horaires existent réellement.
    ...(hours.length ? { openingHoursSpecification: hours } : {}),
    ...(branches.length ? { subOrganization: branches } : {}),
    ...(countries.length ? { areaServed: countries } : {}),
  };
}

/** Décrit le site lui-même, distinct de l'organisation qu'il représente. */
export function webSiteSchema(): unknown {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    url: `${SITE_URL}/`,
    name: ORGANIZATION_NAME,
    alternateName: ORGANIZATION_ALTERNATE_NAMES,
    inLanguage: 'fr',
    publisher: { '@id': `${SITE_URL}/#church` },
  };
}

export interface ArticleSchemaInput {
  readonly title: string;
  readonly description: string;
  readonly path: string;
  readonly image: string | null;
  readonly datePublished: string | null;
  readonly author: string | null;
  readonly section: string | null;
}

export function articleSchema(article: ArticleSchemaInput): unknown {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    mainEntityOfPage: { '@type': 'WebPage', '@id': absoluteUrl(article.path) },
    ...(article.image ? { image: [absoluteUrl(article.image)] } : {}),
    ...(article.datePublished ? { datePublished: article.datePublished } : {}),
    ...(article.section ? { articleSection: article.section } : {}),
    ...(article.author ? { author: { '@type': 'Person', name: article.author } } : {}),
    publisher: {
      '@type': 'Organization',
      name: ORGANIZATION_NAME,
      logo: {
        '@type': 'ImageObject',
        url: absoluteUrl('/images/home/logo-apc.png'),
      },
    },
  };
}

/** Fil d'Ariane : aide Google à afficher le chemin de la page sous le titre. */
export function breadcrumbSchema(
  trail: readonly { readonly name: string; readonly path: string }[],
): unknown {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((step, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: step.name,
      item: absoluteUrl(step.path),
    })),
  };
}
