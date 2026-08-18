import { Injectable, inject } from '@angular/core';

import { SupabaseService } from '../supabase/supabase.service';

export type SubscribeOutcome =
  | { readonly ok: true }
  | { readonly ok: false; readonly message: string };

/**
 * Inscription à la newsletter.
 *
 * Passe par la fonction `subscribe_newsletter` et jamais par une écriture
 * directe : le rôle anonyme n'a aucun privilège sur la table des abonnés.
 * C'est ce qui garantit qu'on ne puisse ni lire la liste, ni deviner par un
 * message d'erreur si une adresse y figure déjà.
 */
@Injectable({ providedIn: 'root' })
export class NewsletterService {
  private readonly supabase = inject(SupabaseService).client;

  async subscribe(email: string, source: string | null = null): Promise<SubscribeOutcome> {
    const { error } = await this.supabase.rpc('subscribe_newsletter', {
      p_email: email.trim(),
      p_source: source,
    });

    if (!error) return { ok: true };

    return { ok: false, message: this.humanize(error.message) };
  }

  /**
   * Les codes renvoyés par la base sont volontairement neutres : ils ne
   * disent jamais si une adresse est déjà connue.
   */
  private humanize(message: string): string {
    if (message.includes('ADRESSE_INVALIDE')) {
      return "Cette adresse e-mail ne semble pas valide.";
    }
    if (message.includes('TROP_DE_TENTATIVES')) {
      return 'Trop de tentatives depuis cet appareil. Réessayez dans une heure.';
    }
    return "L'inscription n'a pas pu aboutir. Réessayez dans un instant.";
  }
}
