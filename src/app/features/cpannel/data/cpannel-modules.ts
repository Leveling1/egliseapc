import type { PannelModule } from '../../../core/supabase/database.types';

/**
 * Description déclarative des modules de contenu du cpannel.
 *
 * Les six modules partagent exactement le même cycle de vie : lister,
 * créer, modifier, basculer la visibilité. Les décrire par des données
 * plutôt que d'écrire six fois le même composant évite que les écrans
 * divergent au fil des retouches — et garantit que la règle du soft delete
 * s'applique partout de la même manière.
 */

export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'date'
  | 'time'
  | 'select'
  | 'weekdays'
  | 'image'
  | 'paragraphs';

export interface FieldConfig {
  readonly key: string;
  readonly label: string;
  readonly type: FieldType;
  readonly required?: boolean;
  readonly help?: string;
  readonly options?: readonly { readonly value: string; readonly label: string }[];
  /** Placeholder du champ ; sert d'exemple de saisie valide. */
  readonly placeholder?: string;
}

export interface ModuleConfig {
  readonly module: PannelModule;
  /** Segment d'URL sous /cpannel. */
  readonly path: string;
  readonly label: string;
  /** Libellé au singulier, pour les boutons et titres de formulaire. */
  readonly singular: string;
  readonly table: string;
  readonly icon: string;
  /** Colonne de tri par défaut, la plus récente en tête. */
  readonly orderBy: { readonly column: string; readonly ascending: boolean };
  /** Colonnes affichées dans le tableau de la liste. */
  readonly columns: readonly { readonly key: string; readonly label: string }[];
  readonly fields: readonly FieldConfig[];
}

export const WEEKDAYS: readonly { readonly value: number; readonly label: string }[] = [
  { value: 1, label: 'Lundi' },
  { value: 2, label: 'Mardi' },
  { value: 3, label: 'Mercredi' },
  { value: 4, label: 'Jeudi' },
  { value: 5, label: 'Vendredi' },
  { value: 6, label: 'Samedi' },
  { value: 0, label: 'Dimanche' },
];

const RDA: ModuleConfig = {
  module: 'rda',
  path: 'rda',
  label: 'Éditions RDA',
  singular: 'édition',
  table: 'rda_editions',
  icon: 'calendar',
  orderBy: { column: 'edition_number', ascending: false },
  columns: [
    { key: 'edition_number', label: 'N°' },
    { key: 'title', label: 'Titre' },
    { key: 'location', label: 'Lieu' },
    { key: 'start_date', label: 'Début' },
  ],
  fields: [
    { key: 'edition_number', label: 'Numéro d\'édition', type: 'number', required: true },
    { key: 'title', label: 'Titre', type: 'text', required: true },
    { key: 'theme', label: 'Thème', type: 'text' },
    { key: 'location', label: 'Lieu', type: 'text', placeholder: 'Kinshasa, Salle Fatima' },
    { key: 'start_date', label: 'Date de début', type: 'date' },
    { key: 'end_date', label: 'Date de fin', type: 'date' },
    { key: 'speakers', label: 'Intervenants', type: 'textarea', help: 'Un par ligne.' },
    { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'poster_path', label: 'Affiche', type: 'image' },
    { key: 'video_url', label: 'Lien vidéo', type: 'text', placeholder: 'https://youtube.com/watch?v=…' },
  ],
};

const ARTICLES: ModuleConfig = {
  module: 'articles',
  path: 'articles',
  label: 'Articles',
  singular: 'article',
  table: 'articles',
  icon: 'article',
  orderBy: { column: 'published_at', ascending: false },
  columns: [
    { key: 'title', label: 'Titre' },
    { key: 'category', label: 'Catégorie' },
    { key: 'author_name', label: 'Auteur' },
    { key: 'published_at', label: 'Publié le' },
  ],
  fields: [
    { key: 'title', label: 'Titre', type: 'text', required: true },
    {
      key: 'slug',
      label: 'Adresse (slug)',
      type: 'text',
      required: true,
      help: 'Minuscules et tirets uniquement. Apparaît dans l\'URL de l\'article.',
      placeholder: 'vivre-sa-foi-en-milieu-professionnel',
    },
    { key: 'category', label: 'Catégorie', type: 'text', required: true, placeholder: 'Article' },
    { key: 'excerpt', label: 'Chapô', type: 'textarea', help: 'Résumé affiché sur les cartes.' },
    {
      key: 'content',
      label: 'Contenu',
      type: 'paragraphs',
      help: 'Un paragraphe par bloc. Laissez une ligne vide pour séparer.',
    },
    { key: 'author_name', label: 'Auteur', type: 'text' },
    { key: 'author_initials', label: 'Initiales', type: 'text', placeholder: 'GK' },
    { key: 'reading_time', label: 'Temps de lecture', type: 'text', placeholder: '5 min de lecture' },
    { key: 'published_at', label: 'Date de publication', type: 'date' },
    { key: 'cover_path', label: 'Image de couverture', type: 'image' },
  ],
};

const ORACLES: ModuleConfig = {
  module: 'oracles',
  path: 'oracles',
  label: 'Oracles',
  singular: 'oracle',
  table: 'oracles',
  icon: 'oracle',
  orderBy: { column: 'year', ascending: false },
  columns: [
    { key: 'year', label: 'Année' },
    { key: 'title', label: 'Titre' },
    { key: 'verse_reference', label: 'Référence' },
  ],
  fields: [
    { key: 'year', label: 'Année', type: 'number', required: true, placeholder: '2026' },
    { key: 'title', label: 'Titre', type: 'text', required: true },
    { key: 'oracle_text', label: 'Texte de l\'oracle', type: 'textarea' },
    { key: 'verse_reference', label: 'Référence biblique', type: 'text', placeholder: '2 Corinthiens 5:20' },
    { key: 'verse_text', label: 'Texte du verset', type: 'textarea' },
  ],
};

const PROGRAMMES: ModuleConfig = {
  module: 'programmes',
  path: 'programmes',
  label: 'Programmes',
  singular: 'programme',
  table: 'programmes',
  icon: 'clock',
  orderBy: { column: 'created_at', ascending: false },
  columns: [
    { key: 'name', label: 'Nom' },
    { key: 'kind', label: 'Type' },
    { key: 'location', label: 'Lieu' },
    { key: 'start_time', label: 'Début' },
  ],
  fields: [
    { key: 'name', label: 'Nom', type: 'text', required: true, placeholder: 'Culte dominical' },
    {
      key: 'kind',
      label: 'Type',
      type: 'select',
      required: true,
      options: [
        { value: 'recurrent', label: 'Récurrent (chaque semaine)' },
        { value: 'special', label: 'Spécial (date ou période)' },
      ],
    },
    {
      key: 'days_of_week',
      label: 'Jours concernés',
      type: 'weekdays',
      help:
        'Pour exclure un jour d\'une période, il suffit de ne pas le cocher — ' +
        'par exemple « du lundi au dimanche sauf le samedi ».',
    },
    { key: 'start_date', label: 'Date de début', type: 'date', help: 'Obligatoire pour un programme spécial.' },
    { key: 'end_date', label: 'Date de fin', type: 'date', help: 'À laisser vide pour une date unique.' },
    { key: 'start_time', label: 'Heure de début', type: 'time' },
    { key: 'end_time', label: 'Heure de fin', type: 'time' },
    { key: 'location', label: 'Lieu', type: 'text' },
    { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'image_path', label: 'Image', type: 'image' },
  ],
};

const EXTENSIONS: ModuleConfig = {
  module: 'extensions',
  path: 'extensions',
  label: 'Extensions',
  singular: 'extension',
  table: 'extensions',
  icon: 'map',
  orderBy: { column: 'created_at', ascending: false },
  columns: [
    { key: 'name', label: 'Nom' },
    { key: 'city', label: 'Ville' },
    { key: 'country', label: 'Pays' },
    { key: 'leader_name', label: 'Responsable' },
  ],
  fields: [
    { key: 'name', label: 'Nom', type: 'text', required: true },
    { key: 'city', label: 'Ville', type: 'text' },
    { key: 'country', label: 'Pays', type: 'text', placeholder: 'République Démocratique du Congo' },
    { key: 'address', label: 'Adresse', type: 'textarea' },
    {
      key: 'latitude',
      label: 'Latitude',
      type: 'number',
      help: 'Sert à placer le point sur la carte « Notre présence ».',
      placeholder: '-4.325',
    },
    { key: 'longitude', label: 'Longitude', type: 'number', placeholder: '15.322' },
    { key: 'leader_name', label: 'Responsable', type: 'text' },
    { key: 'phone', label: 'Téléphone', type: 'text', placeholder: '+243 892 211 899' },
    { key: 'image_path', label: 'Photo', type: 'image' },
  ],
};

export const CPANNEL_MODULES: readonly ModuleConfig[] = [
  RDA,
  ARTICLES,
  ORACLES,
  PROGRAMMES,
  EXTENSIONS,
];

export function findModuleByPath(path: string): ModuleConfig | undefined {
  return CPANNEL_MODULES.find((config) => config.path === path);
}
