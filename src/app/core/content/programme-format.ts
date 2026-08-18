import type { ProgrammePublic } from '../supabase/database.types';

/** 0 = dimanche … 6 = samedi, comme en base. */
const DAY_NAMES = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const DAY_SHORT = ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.'];

/** Ordre de lecture français : la semaine commence le lundi. */
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

/**
 * Libellé des jours d'un programme.
 *
 * Une suite continue devient un intervalle (« Lun. – Ven. ») plutôt qu'une
 * énumération : c'est ainsi que l'église l'écrit, et c'est plus lisible dans
 * une grille étroite.
 */
export function formatDays(days: readonly number[] | null): string {
  if (!days?.length) return '';

  const ordered = WEEK_ORDER.filter((day) => days.includes(day));
  if (ordered.length === 1) return DAY_NAMES[ordered[0]];

  const positions = ordered.map((day) => WEEK_ORDER.indexOf(day));
  const isContiguous = positions.every(
    (position, index) => index === 0 || position === positions[index - 1] + 1,
  );

  if (isContiguous && ordered.length > 2) {
    return `${DAY_SHORT[ordered[0]]} – ${DAY_SHORT[ordered[ordered.length - 1]]}`;
  }

  return ordered.map((day) => DAY_SHORT[day]).join(', ');
}

/** « 17:00:00 » → « 17h00 ». */
export function formatTime(time: string | null): string {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  return `${hours}h${minutes ?? '00'}`;
}

/** Plage horaire complète, ou heure de début seule si la fin est inconnue. */
export function formatTimeRange(start: string | null, end: string | null): string {
  const from = formatTime(start);
  const to = formatTime(end);

  if (from && to) return `${from} – ${to}`;
  return from || to;
}

export interface ProgrammeRow {
  readonly id: string;
  readonly days: string;
  readonly name: string;
  readonly time: string;
  readonly featured: boolean;
  /** Vrai pour un intervalle de jours, qui demande une taille de texte réduite. */
  readonly compactDays: boolean;
  /** Rang du premier jour dans la semaine française, pour le tri. */
  readonly weekPosition: number;
  readonly spansSeveralDays: boolean;
}

export function toProgrammeRow(programme: ProgrammePublic): ProgrammeRow {
  const days = formatDays(programme.days_of_week);

  const dayNumbers = programme.days_of_week ?? [];
  const firstDay = WEEK_ORDER.find((day) => dayNumbers.includes(day));

  return {
    id: programme.id,
    days,
    weekPosition: firstDay === undefined ? WEEK_ORDER.length : WEEK_ORDER.indexOf(firstDay),
    spansSeveralDays: dayNumbers.length > 1,
    name: programme.name,
    time: formatTimeRange(programme.start_time, programme.end_time),
    featured: programme.is_featured,
    compactDays: days.includes('–') || days.includes(','),
  };
}

/**
 * Ordre d'affichage voulu par l'église : les rendez-vous d'un jour précis
 * d'abord, dans l'ordre de la semaine (lundi → dimanche), puis les
 * programmes couvrant plusieurs jours.
 *
 * Trier simplement par heure de début mettait la prière matinale en tête et
 * le culte dominical au milieu, ce qui ne correspond pas à la façon dont
 * l'assemblée lit son planning.
 */
export function sortProgrammes(rows: readonly ProgrammeRow[]): ProgrammeRow[] {
  return [...rows].sort((a, b) => {
    if (a.spansSeveralDays !== b.spansSeveralDays) {
      return a.spansSeveralDays ? 1 : -1;
    }
    if (a.weekPosition !== b.weekPosition) return a.weekPosition - b.weekPosition;
    return a.time.localeCompare(b.time);
  });
}
