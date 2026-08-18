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
  | 'images'
  | 'links'
  | 'boolean'
  | 'lines'
  | 'paragraphs';

export interface FieldConfig {
  readonly key: string;
  readonly label: string;
  readonly type: FieldType;
  readonly required?: boolean;
  readonly help?: string;
  readonly options?: readonly { readonly value: string; readonly label: string }[];
  /** Table de paramètres alimentant la liste déroulante (id → name). */
  readonly optionsFrom?: 'book_statuses' | 'article_categories';
  /** Placeholder du champ ; sert d'exemple de saisie valide. */
  readonly placeholder?: string;
  /**
   * Dimensions conseillées pour une image, affichées dans la zone de dépôt.
   * Sans indication, les images arrivent dans des formats très variés et
   * cassent les grilles du site public.
   */
  readonly recommended?: string;
  /**
   * Champ d'adresse dont la saisie renseigne automatiquement les colonnes de
   * coordonnées indiquées.
   */
  readonly geocodeTo?: { readonly lat: string; readonly lng: string };
  /** Propriétaire des liens, pour un champ de type 'links'. */
  readonly linkOwner?: 'article' | 'extension' | 'rda';
}

export interface ModuleConfig {
  readonly module: PannelModule;
  /** Segment d'URL sous /cpannel. */
  readonly path: string;
  readonly label: string;
  /** Libellé au singulier, pour les boutons et titres de formulaire. */
  readonly singular: string;
  /** Genre du libellé singulier : « un nouveau programme », « une nouvelle édition ». */
  readonly gender: 'm' | 'f';
  readonly table: string;
  readonly icon: string;
  /** Colonne de tri par défaut, la plus récente en tête. */
  readonly orderBy: { readonly column: string; readonly ascending: boolean };
  /** Colonnes affichées dans le tableau de la liste. */
  readonly columns: readonly { readonly key: string; readonly label: string }[];
  readonly fields: readonly FieldConfig[];
  /**
   * Clause SELECT sur mesure, quand la liste doit résoudre une relation —
   * par exemple afficher le nom de la catégorie plutôt que son identifiant.
   */
  readonly listSelect?: string;
  /**
   * Module disposant de son propre écran de rédaction : le formulaire en
   * modale est alors court-circuité au profit d'une page dédiée.
   */
  readonly usesEditor?: boolean;
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
  gender: 'f',
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
    {
      key: 'poster_path',
      label: 'Affiche',
      type: 'image',
      recommended: '1080 × 1350 px (portrait)',
    },
    { key: 'video_url', label: 'Lien vidéo', type: 'text', placeholder: 'https://youtube.com/watch?v=…' },
    {
      key: 'is_featured',
      label: 'Dernier événement',
      type: 'boolean',
      help:
        'Met cette édition en avant dans la section « Dernier événement » de la ' +
        'page RDA. Sans choix explicite, la plus récente est utilisée.',
    },
    {
      key: 'links',
      label: 'Liens',
      type: 'links',
      linkOwner: 'rda',
      help: 'Replay vidéo, galerie photos… affichés dans la section « Dernier événement ».',
    },
  ],
};

const ARTICLES: ModuleConfig = {
  module: 'articles',
  path: 'articles',
  label: 'Articles',
  singular: 'article',
  gender: 'm',
  table: 'articles',
  icon: 'article',
  orderBy: { column: 'published_at', ascending: false },
  usesEditor: true,
  listSelect: '*, category:article_categories(name)',
  columns: [
    { key: 'title', label: 'Titre' },
    { key: 'category', label: 'Catégorie' },
    { key: 'author_name', label: 'Auteur' },
    { key: 'published_at', label: 'Publié le' },
  ],
  // Champs conservés pour la recherche et l'affichage de la liste ;
  // la saisie se fait dans l'éditeur d'article, pas ici.
  fields: [],
};

const ORACLES: ModuleConfig = {
  module: 'oracles',
  path: 'oracles',
  label: 'Oracles',
  singular: 'oracle',
  gender: 'm',
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
    {
      key: 'image_path',
      label: 'Image',
      type: 'image',
      recommended: '1200 × 630 px (paysage)',
    },
  ],
};

const PROGRAMMES: ModuleConfig = {
  module: 'programmes',
  path: 'programmes',
  label: 'Programmes',
  singular: 'programme',
  gender: 'm',
  table: 'programmes',
  icon: 'clock',
  orderBy: { column: 'start_time', ascending: true },
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
    {
      key: 'image_path',
      label: 'Image',
      type: 'image',
      recommended: '1200 × 630 px (paysage)',
    },
  ],
};

const EXTENSIONS: ModuleConfig = {
  module: 'extensions',
  path: 'extensions',
  label: 'Extensions',
  singular: 'extension',
  gender: 'f',
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
    {
      key: 'address',
      label: 'Adresse',
      type: 'text',
      placeholder: 'Av. Luzandi 5, Ngaliema, Kinshasa',
      help:
        'Les coordonnées de la carte sont recherchées automatiquement à partir ' +
        'de cette adresse.',
      geocodeTo: { lat: 'latitude', lng: 'longitude' },
    },
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
    {
      key: 'image_path',
      label: 'Photo',
      type: 'image',
      recommended: '1200 × 800 px (paysage)',
    },
    {
      key: 'links',
      label: 'Liens',
      type: 'links',
      linkOwner: 'extension',
      help: 'Page Facebook, groupe WhatsApp, chaîne YouTube de cette extension…',
    },
  ],
};

const BOOKS: ModuleConfig = {
  module: 'resources',
  path: 'livres',
  label: 'Livres',
  singular: 'livre',
  gender: 'm',
  table: 'books',
  icon: 'book',
  orderBy: { column: 'position', ascending: true },
  listSelect: '*, status:book_statuses(name)',
  columns: [
    { key: 'title', label: 'Titre' },
    { key: 'status', label: 'Statut' },
    { key: 'position', label: 'Ordre' },
  ],
  fields: [
    { key: 'title', label: 'Titre', type: 'text', required: true },
    { key: 'description', label: 'Description', type: 'textarea' },
    {
      key: 'status_id',
      label: 'Statut',
      type: 'select',
      optionsFrom: 'book_statuses',
      help: 'Les statuts se gèrent depuis la page Paramètres.',
    },
    {
      key: 'cover_path',
      label: 'Couverture',
      type: 'image',
      recommended: '600 × 900 px (portrait)',
      help: 'Sans couverture, un dégradé de la charte est utilisé.',
    },
    { key: 'link_url', label: 'Lien', type: 'text', help: 'Achat ou téléchargement.' },
    { key: 'position', label: 'Ordre d\'affichage', type: 'number' },
  ],
};

const MOBILE_APPS: ModuleConfig = {
  module: 'resources',
  path: 'applications',
  label: 'Applications',
  singular: 'application',
  gender: 'f',
  table: 'mobile_apps',
  icon: 'phone',
  orderBy: { column: 'position', ascending: true },
  columns: [
    { key: 'name', label: 'Nom' },
    { key: 'status_label', label: 'Statut' },
    { key: 'position', label: 'Ordre' },
  ],
  fields: [
    { key: 'name', label: 'Nom', type: 'text', required: true, placeholder: 'Campus APC' },
    { key: 'tagline', label: 'Accroche', type: 'text' },
    { key: 'description', label: 'Description', type: 'textarea' },
    {
      key: 'status_label',
      label: 'Statut',
      type: 'text',
      placeholder: 'En cours de publication',
    },
    {
      key: 'features',
      label: 'Fonctionnalités',
      type: 'lines',
      help: 'Une fonctionnalité par ligne.',
    },
    {
      key: 'ios_url',
      label: 'Lien App Store',
      type: 'text',
      help:
        "À laisser vide tant que l'application n'est pas publiée : aucun bouton " +
        "de téléchargement ne s'affiche sans lien réel.",
    },
    { key: 'android_url', label: 'Lien Google Play', type: 'text' },
    { key: 'website_url', label: 'Site vitrine', type: 'text', placeholder: 'https://…' },
    {
      key: 'screenshot_paths',
      label: "Captures d'écran",
      type: 'images',
      recommended: '1080 × 1920 px (portrait)',
    },
    { key: 'position', label: 'Ordre d\'affichage', type: 'number' },
  ],
};

export const CPANNEL_MODULES: readonly ModuleConfig[] = [
  RDA,
  ARTICLES,
  ORACLES,
  PROGRAMMES,
  EXTENSIONS,
  BOOKS,
  MOBILE_APPS,
];

export function findModuleByPath(path: string): ModuleConfig | undefined {
  return CPANNEL_MODULES.find((config) => config.path === path);
}
