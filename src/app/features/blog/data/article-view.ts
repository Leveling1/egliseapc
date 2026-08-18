import type { ArticlePublic, ContentLinkPublic } from '../../../core/supabase/database.types';
import { resolveCoverUrl } from '../../../core/media/link-media';

/**
 * L'article tel que l'affichent les composants du site.
 *
 * Sépare volontairement la forme stockée de la forme affichée : la base
 * renvoie une date ISO et un chemin de fichier, les gabarits veulent une date
 * en français et une valeur CSS directement utilisable.
 */
export interface ArticleView {
  readonly id: string;
  readonly slug: string;
  readonly category: string;
  readonly title: string;
  readonly excerpt: string;
  readonly date: string;
  readonly authorName: string;
  readonly authorInitials: string;
  readonly content: readonly string[];
  readonly contentHtml: string | null;
  /** Valeur prête pour `background` : image de couverture, ou dégradé de repli. */
  readonly background: string;
  readonly links: readonly ContentLinkPublic[];
}

const DEFAULT_GRADIENT = 'linear-gradient(135deg,#0b0b0b,#1c1c8c)';

const MONTHS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];

/** « 2026-07-28 » → « 28 juillet 2026 ». */
export function formatArticleDate(iso: string | null): string {
  if (!iso) return '';

  const [year, month, day] = iso.split('-').map(Number);
  if (!year || !month || !day) return '';

  return `${day} ${MONTHS[month - 1]} ${year}`;
}

/**
 * Construit la vue d'un article.
 *
 * `publicUrl` résout un chemin du stockage ; il est passé en paramètre plutôt
 * qu'injecté pour que cette fonction reste pure et testable.
 */
export function toArticleView(
  article: ArticlePublic,
  links: readonly ContentLinkPublic[],
  publicUrl: (path: string | null) => string | null,
): ArticleView {
  const cover = resolveCoverUrl(publicUrl(article.cover_path), links);

  return {
    id: article.id,
    slug: article.slug,
    category: article.category ?? 'Article',
    title: article.title,
    excerpt: article.excerpt ?? '',
    date: formatArticleDate(article.published_at),
    authorName: article.author_name ?? '',
    authorInitials: article.author_initials ?? '',
    content: article.content ?? [],
    contentHtml: article.content_html,
    // Une couverture manquante ne doit jamais laisser un bloc vide : on
    // retombe sur le dégradé enregistré, puis sur celui de la charte.
    background: cover
      ? `center / cover no-repeat url("${cover}")`
      : article.gradient || DEFAULT_GRADIENT,
    links,
  };
}
