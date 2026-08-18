/**
 * Dérivation d'une image de couverture à partir des liens d'un contenu.
 *
 * Objectif : un article ne doit jamais se retrouver sans visuel simplement
 * parce que le rédacteur n'avait pas d'image sous la main. Quand une vidéo
 * YouTube est jointe, sa miniature fait une couverture parfaitement valable.
 *
 * Ce calcul est fait à l'affichage et non stocké en base : si le lien de la
 * vidéo change, la couverture suit, alors qu'une URL enregistrée resterait
 * figée sur l'ancienne vidéo.
 */

/** Identifiant d'une vidéo YouTube, quelle que soit la forme de l'URL. */
export function youtubeVideoId(url: string): string | null {
  if (!url) return null;

  const patterns = [
    /(?:youtube\.com\/watch\?(?:.*&)?v=)([A-Za-z0-9_-]{11})/,
    /(?:youtu\.be\/)([A-Za-z0-9_-]{11})/,
    /(?:youtube\.com\/(?:embed|shorts|live)\/)([A-Za-z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(url);
    if (match) return match[1];
  }

  return null;
}

export function youtubeThumbnail(url: string): string | null {
  const id = youtubeVideoId(url);
  // `hqdefault` plutôt que `maxresdefault` : la haute résolution n'existe pas
  // pour toutes les vidéos et renvoie alors une image grise, tandis que
  // `hqdefault` est toujours généré.
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
}

export interface CoverSourceLink {
  readonly url: string;
  /** Code du type de lien (`youtube`, `facebook`…), s'il est connu. */
  readonly link_type?: string | null;
}

/**
 * Couverture effective : l'image envoyée si elle existe, sinon la miniature
 * de la première vidéo YouTube jointe, sinon rien.
 */
export function resolveCoverUrl(
  uploadedUrl: string | null,
  links: readonly CoverSourceLink[] = [],
): string | null {
  if (uploadedUrl) return uploadedUrl;

  for (const link of links) {
    // On ne se fie pas au seul type déclaré : un lien rangé sous « Site web »
    // peut tout de même pointer vers YouTube.
    const thumbnail = youtubeThumbnail(link.url);
    if (thumbnail) return thumbnail;
  }

  return null;
}
