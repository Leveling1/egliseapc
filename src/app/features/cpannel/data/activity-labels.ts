import type { PannelModule } from '../../../core/supabase/database.types';

/** Libellé de chaque module tel qu'il apparaît dans le journal d'activité. */
export const MODULE_LABELS: Record<PannelModule, string> = {
  rda: 'Éditions RDA',
  articles: 'Articles',
  oracles: 'Oracles',
  programmes: 'Programmes',
  extensions: 'Extensions',
  users: 'Utilisateurs',
  resources: 'Ressources',
  newsletter: 'Abonnés',
  gallery: 'Galerie',
  settings: 'Paramètres',
};

/**
 * « il y a 3 min », « hier »… - le temps écoulé tel qu'on le dit.
 *
 * Au-delà d'une semaine, la date exacte redevient plus parlante qu'un
 * « il y a 23 jours » : on la donne en toutes lettres.
 */
export function relativeTime(iso: string, now = Date.now()): string {
  const elapsedMinutes = Math.round((now - new Date(iso).getTime()) / 60000);

  if (elapsedMinutes < 1) return "à l'instant";
  if (elapsedMinutes < 60) return `il y a ${elapsedMinutes} min`;

  const hours = Math.round(elapsedMinutes / 60);
  if (hours < 24) return `il y a ${hours} h`;

  const days = Math.round(hours / 24);
  if (days === 1) return 'hier';
  if (days < 7) return `il y a ${days} jours`;

  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}
