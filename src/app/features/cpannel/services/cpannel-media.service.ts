import { Injectable, inject } from '@angular/core';

import { SupabaseService } from '../../../core/supabase/supabase.service';

/** Ce que le service média renvoie après un envoi réussi. */
export interface MediaUpload {
  readonly url: string;
  readonly width: number;
  readonly height: number;
  readonly mediaId: string;
}

/** Formats acceptés par le service média. */
export const ACCEPTED_TYPES = ['image/jpeg', 'image/png'];

/**
 * Envoi d'images au service média externe.
 *
 * Le fichier ne passe jamais par le bucket Supabase ni directement par le
 * service média : il transite par une fonction Edge, seule à détenir la clé
 * technique et seule à savoir si l'administrateur a le droit d'écrire dans le
 * module visé. Le navigateur n'a donc aucun secret à porter.
 */
@Injectable({ providedIn: 'root' })
export class CpannelMediaService {
  private readonly supabase = inject(SupabaseService).client;

  /**
   * Envoie une image et rend son adresse publique.
   *
   * Les dimensions accompagnent la réponse : le service média les mesure au
   * moment où il réencode le fichier, ce qui évite d'avoir à les relire dans
   * le navigateur. Elles comptent — c'est d'elles que le mur public déduit la
   * place à réserver avant l'arrivée de l'image.
   */
  async upload(file: File, module: string): Promise<MediaUpload> {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      throw new Error('Seuls les fichiers JPEG et PNG sont acceptés.');
    }

    const form = new FormData();
    form.set('photo', file);
    form.set('module', module);
    form.set('name', file.name.replace(/\.[^.]+$/, ''));

    // `functions.invoke` joint le jeton de l'administrateur : c'est lui que la
    // fonction relit pour décider du droit.
    const { data, error } = await this.supabase.functions.invoke('post-media-pannel', {
      body: form,
    });

    if (error) throw new Error(await readFunctionError(error));
    if (!data?.url) throw new Error("Le service média n'a pas renvoyé d'adresse.");

    return {
      url: data.url,
      width: data.width ?? 0,
      height: data.height ?? 0,
      mediaId: data.id ?? '',
    };
  }
}

/**
 * Message d'erreur lisible.
 *
 * Les erreurs de fonction Edge portent le détail dans le corps de la réponse,
 * pas dans le message : sans cette lecture, l'administrateur ne verrait qu'un
 * « Edge Function returned a non-2xx status code » qui ne l'avance en rien.
 */
export async function readFunctionError(error: unknown): Promise<string> {
  const context = (error as { context?: Response }).context;

  if (context && typeof context.json === 'function') {
    try {
      const body = await context.json();
      if (body?.error) return String(body.error);
      if (body?.detail) return String(body.detail);
    } catch {
      // Corps illisible : on retombe sur le message générique.
    }
  }

  return error instanceof Error ? error.message : String(error);
}
