/**
 * Types de la base Supabase.
 *
 * Reflète le schéma réel du projet (générés via `generate_typescript_types`
 * puis restreints à ce que le code utilise réellement). À régénérer après
 * toute migration qui change une table ou une vue.
 *
 * Distinction importante : les types `*Public` correspondent aux VUES
 * exposées au site grand public. Ils ne contiennent volontairement pas
 * `is_visible`, `created_at`, `updated_at` ni `updated_by` — ces colonnes
 * sont internes au cpannel et le rôle anonyme n'a même pas le privilège de
 * les lire.
 */

export type PannelModule =
  | 'rda'
  | 'articles'
  | 'oracles'
  | 'programmes'
  | 'extensions'
  | 'users'
  | 'settings'
  | 'resources';

export type ProgrammeKind = 'recurrent' | 'special';

/** Colonnes internes présentes sur chaque table de contenu. */
interface ContentMeta {
  is_visible: boolean;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
}

export interface AdminUser {
  id: string;
  user_id: string | null;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  is_super_admin: boolean;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminPermission {
  id: string;
  admin_user_id: string;
  module: PannelModule;
  can_view: boolean;
  can_edit: boolean;
  can_publish: boolean;
}

export interface RdaEditionPublic {
  id: string;
  edition_number: number;
  /** Année du rassemblement. Les dates précises ne sont pas toujours connues. */
  year: number | null;
  title: string;
  theme: string | null;
  location: string | null;
  start_date: string | null;
  end_date: string | null;
  description: string | null;
  speakers: string | null;
  poster_path: string | null;
  video_url: string | null;
  /** Désigne le « dernier événement » mis en avant sur la page RDA. */
  is_featured: boolean;
}
export type RdaEdition = RdaEditionPublic & ContentMeta;

export interface ArticlePublic {
  id: string;
  slug: string;
  /** Nom de la catégorie, résolu depuis article_categories par la vue. */
  category: string | null;
  title: string;
  excerpt: string | null;
  /** Texte brut, un paragraphe par entrée. Dérivé du HTML, sert de repli. */
  content: string[];
  /** Contenu riche produit par l'éditeur — source de vérité de l'article. */
  content_html: string | null;
  author_name: string | null;
  author_initials: string | null;
  cover_path: string | null;
  gradient: string | null;
  published_at: string | null;
  /** Mis à la une manuellement ; sinon le plus récent fait office. */
  is_featured: boolean;
}

/**
 * L'article tel qu'il existe en base : la table porte category_id, c'est la
 * vue publique qui le résout en nom de catégorie.
 */
export type Article = Omit<ArticlePublic, 'category'> &
  ContentMeta & { category_id: string | null };

export interface OraclePublic {
  id: string;
  year: number;
  title: string;
  oracle_text: string | null;
  verse_reference: string | null;
  verse_text: string | null;
}
export type Oracle = OraclePublic & ContentMeta;

export interface ProgrammePublic {
  id: string;
  name: string;
  kind: ProgrammeKind;
  /** 0 = dimanche … 6 = samedi. « Sauf le samedi » = 6 absent du tableau. */
  days_of_week: number[] | null;
  start_date: string | null;
  end_date: string | null;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  description: string | null;
  image_path: string | null;
  /** Mis en avant dans la grille des programmes. */
  is_featured: boolean;
}
export type Programme = ProgrammePublic & ContentMeta;

export interface ExtensionPublic {
  id: string;
  name: string;
  city: string | null;
  country: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  leader_name: string | null;
  phone: string | null;
  image_path: string | null;
}
export type Extension = ExtensionPublic & ContentMeta;

export interface ActivityLogEntry {
  id: number;
  admin_user_id: string | null;
  module: PannelModule;
  record_id: string | null;
  action: string;
  details: Record<string, unknown> | null;
  occurred_at: string;
}

/** Nom des tables de base (cpannel) et des vues publiques (site). */
export const CONTENT_TABLES = {
  rda: 'rda_editions',
  articles: 'articles',
  oracles: 'oracles',
  programmes: 'programmes',
  extensions: 'extensions',
} as const;

export const PUBLIC_VIEWS = {
  rda: 'rda_editions_public',
  articles: 'articles_public',
  oracles: 'oracles_public',
  programmes: 'programmes_public',
  extensions: 'extensions_public',
} as const;

export const MEDIA_BUCKET = 'cpannel-media';

/**
 * Listes prédéfinies, gérées depuis la page Paramètres du cpannel.
 */
export interface ArticleCategory {
  id: string;
  name: string;
  position: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
}

export interface LinkType {
  id: string;
  /** Identifiant stable (`youtube`, `facebook`…) : pilote l'icône et la
   *  reconnaissance d'une vidéo pour la couverture automatique. */
  code: string;
  name: string;
  position: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
}

/**
 * Lien rattaché à un article ou à une extension.
 * Exactement l'un des deux propriétaires est renseigné, garanti en base.
 */
export interface ContentLink {
  id: string;
  article_id: string | null;
  extension_id: string | null;
  rda_edition_id: string | null;
  link_type_id: string;
  url: string;
  label: string | null;
  position: number;
  created_at: string;
}

/** Lien tel que le voit le site public, avec le code de son type. */
export interface ContentLinkPublic {
  id: string;
  article_id: string | null;
  extension_id: string | null;
  rda_edition_id: string | null;
  link_type: string;
  link_type_name: string;
  url: string;
  label: string | null;
  position: number;
}

export const SETTINGS_TABLES = {
  categories: 'article_categories',
  linkTypes: 'link_types',
} as const;

/** Statut d'un livre : liste prédéfinie gérée dans Paramètres. */
export interface BookStatus {
  id: string;
  name: string;
  position: number;
  is_visible: boolean;
}

export interface BookPublic {
  id: string;
  title: string;
  description: string | null;
  /** Nom du statut, résolu par la vue. */
  status: string | null;
  cover_path: string | null;
  link_url: string | null;
  position: number;
}

export interface MobileAppPublic {
  id: string;
  name: string;
  tagline: string | null;
  description: string | null;
  status_label: string | null;
  /** Nulles tant que l'application n'est pas publiée : aucun bouton alors. */
  ios_url: string | null;
  android_url: string | null;
  website_url: string | null;
  features: string[];
  screenshot_paths: string[];
  position: number;
}
