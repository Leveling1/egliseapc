import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import type { LinkType } from '../../../../core/supabase/database.types';

/**
 * Un lien en cours d'édition. `id` n'existe que pour les liens déjà
 * enregistrés : son absence signale une création.
 */
export interface LinkDraft {
  id?: string;
  link_type_id: string;
  url: string;
  label: string;
}

/**
 * Liste de liens rattachés à un contenu (vidéo du culte, page Facebook…).
 *
 * Les types proviennent de la table `link_types`, gérée depuis la page
 * Paramètres : ajouter un réseau social ne demande donc aucune modification
 * de code.
 *
 * Ce composant ne fait qu'éditer un tableau ; l'enregistrement revient au
 * formulaire parent, qui sait à quel contenu ces liens appartiennent.
 */
@Component({
  selector: 'app-cp-link-list',
  standalone: true,
  templateUrl: './link-list.component.html',
  styleUrl: './link-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CpannelLinkListComponent {
  readonly links = input.required<readonly LinkDraft[]>();
  readonly linkTypes = input.required<readonly LinkType[]>();
  readonly linksChange = output<LinkDraft[]>();

  protected add(): void {
    const firstType = this.linkTypes()[0];
    if (!firstType) return;

    this.linksChange.emit([
      ...this.links(),
      { link_type_id: firstType.id, url: '', label: '' },
    ]);
  }

  protected update(index: number, patch: Partial<LinkDraft>): void {
    this.linksChange.emit(
      this.links().map((link, i) => (i === index ? { ...link, ...patch } : link)),
    );
  }

  protected remove(index: number): void {
    this.linksChange.emit(this.links().filter((_, i) => i !== index));
  }

  protected onType(index: number, event: Event): void {
    this.update(index, { link_type_id: (event.target as HTMLSelectElement).value });
  }

  protected onUrl(index: number, event: Event): void {
    this.update(index, { url: (event.target as HTMLInputElement).value });
  }

  protected onLabel(index: number, event: Event): void {
    this.update(index, { label: (event.target as HTMLInputElement).value });
  }
}
