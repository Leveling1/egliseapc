import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';

import { SupabaseService } from '../../../../core/supabase/supabase.service';

/** Ce que le service média renvoie après un envoi réussi. */
export interface MediaUpload {
  readonly url: string;
  readonly width: number;
  readonly height: number;
  readonly mediaId: string;
}

/** Formats acceptés par le service média. */
const ACCEPTED = ['image/jpeg', 'image/png'];

/**
 * Envoi d'une photo au service média externe.
 *
 * Le fichier ne transite pas par le bucket Supabase : il part vers une
 * fonction Edge qui vérifie le droit de l'administrateur, puis relaie l'image
 * au service média avec une clé technique que le navigateur ne voit jamais.
 * Seule l'adresse publique revient, et c'est elle qui est enregistrée.
 *
 * Le composant renvoie aussi les dimensions rendues par le service. Elles ne
 * sont pas un ornement : le mur de la galerie conserve les proportions de
 * chaque photo, et sans elles la mise en page se réorganiserait à chaque
 * chargement d'image.
 */
@Component({
  selector: 'app-cpannel-media-field',
  standalone: true,
  templateUrl: './media-field.component.html',
  styleUrl: './media-field.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CpannelMediaFieldComponent {
  /** Adresse actuelle, ou chaîne vide. */
  readonly value = input<string>('');
  readonly label = input<string>('Photo');
  readonly recommended = input<string | null>(null);
  /** Module concerné : la fonction Edge vérifie le droit d'écriture dessus. */
  readonly module = input.required<string>();

  readonly uploaded = output<MediaUpload>();
  readonly cleared = output<void>();

  private readonly supabase = inject(SupabaseService).client;
  private readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('file');

  protected readonly uploading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly hasImage = computed(() => this.value().trim() !== '');

  protected pick(): void {
    this.fileInput()?.nativeElement.click();
  }

  protected onSelect(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) void this.send(file);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (file) void this.send(file);
  }

  protected allowDrop(event: DragEvent): void {
    event.preventDefault();
  }

  protected clear(): void {
    this.error.set(null);
    this.cleared.emit();
  }

  private async send(file: File): Promise<void> {
    // Contrôle local avant d'occuper la ligne : le service refuse de toute
    // façon, mais autant ne pas faire monter dix mégaoctets pour rien.
    if (!ACCEPTED.includes(file.type)) {
      this.error.set('Seuls les fichiers JPEG et PNG sont acceptés.');
      return;
    }

    this.uploading.set(true);
    this.error.set(null);

    try {
      const form = new FormData();
      form.set('photo', file);
      form.set('module', this.module());
      form.set('name', file.name.replace(/\.[^.]+$/, ''));

      // `functions.invoke` joint le jeton de l'administrateur : c'est lui que
      // la fonction relit pour décider du droit.
      const { data, error } = await this.supabase.functions.invoke('post-media-pannel', {
        body: form,
      });

      if (error) throw new Error(await readFunctionError(error));
      if (!data?.url) throw new Error("Le service média n'a pas renvoyé d'adresse.");

      this.uploaded.emit({
        url: data.url,
        width: data.width ?? 0,
        height: data.height ?? 0,
        mediaId: data.id ?? '',
      });
    } catch (cause) {
      this.error.set(cause instanceof Error ? cause.message : String(cause));
    } finally {
      this.uploading.set(false);
      const input = this.fileInput()?.nativeElement;
      // Sans cela, renvoyer deux fois le même fichier ne déclenche rien : la
      // valeur du champ n'a pas changé, donc aucun événement.
      if (input) input.value = '';
    }
  }
}

/**
 * Message d'erreur lisible.
 *
 * Les erreurs de fonction Edge portent le détail dans le corps de la réponse,
 * pas dans le message : sans cette lecture, l'administrateur ne verrait qu'un
 * « Edge Function returned a non-2xx status code » qui ne l'avance en rien.
 */
async function readFunctionError(error: unknown): Promise<string> {
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
