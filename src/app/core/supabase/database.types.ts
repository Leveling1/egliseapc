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
  | 'users';

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
  title: string;
  theme: string | null;
  location: string | null;
  start_date: string | null;
  end_date: string | null;
  description: string | null;
  speakers: string | null;
  poster_path: string | null;
  video_url: string | null;
}
export type RdaEdition = RdaEditionPublic & ContentMeta;

export interface ArticlePublic {
  id: string;
  slug: string;
  category: string;
  title: string;
  excerpt: string | null;
  content: string[];
  author_name: string | null;
  author_initials: string | null;
  reading_time: string | null;
  cover_path: string | null;
  gradient: string | null;
  published_at: string | null;
}
export type Article = ArticlePublic & ContentMeta;

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
