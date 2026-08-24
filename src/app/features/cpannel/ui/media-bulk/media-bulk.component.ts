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

import { ACCEPTED_TYPES, CpannelMediaService } from '../../services/cpannel-media.service';

/** Où en est un fichier de la sélection. */
export type ItemState = 'pending' | 'sending' | 'done' | 'failed';

export interface BulkItem {
  readonly name: string;
  readonly state: ItemState;
  readonly error?: string;
}

/** Une photo prête à être enregistrée. */
export interface BulkResult {
  readonly url: string;
  readonly width: number;
  readonly height: number;
  readonly mediaId: string;
}

/**
 * Pause entre deux envois, en millisecondes.
 *
 * Le service média limite le débit et répond 429 quand on le presse. Envoyer
 * les fichiers l'un après l'autre, avec un temps mort, coûte quelques secondes
 * sur un lot important mais évite qu'une moitié du lot soit refusée — ce qui
 * obligerait à recommencer en devinant lesquels sont passés.
 */
const PACE_MS = 250;

/**
 * Envoi de plusieurs photos en une fois.
 *
 * Chaque fichier part séparément et donne un enregistrement séparé : le
 * service média traite une image par requête, et la galerie tient une ligne
 * par photo. Ce composant ne fait qu'enchaîner, en rendant compte de chacune.
 *
 * L'échec d'un fichier — format refusé, boîte pleine, coupure — n'interrompt
 * pas les suivants. Rien n'est plus décourageant qu'un lot de trente photos
 * abandonné à la troisième.
 */
@Component({
  selector: 'app-cpannel-media-bulk',
  standalone: true,
  templateUrl: './media-bulk.component.html',
  styleUrl: './media-bulk.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CpannelMediaBulkComponent {
  /** Module concerné : la fonction Edge vérifie le droit d'écriture dessus. */
  readonly module = input.required<string>();

  /** Émis pour chaque photo réussie, dans l'ordre de la sélection. */
  readonly photoReady = output<BulkResult>();
  /** Émis une fois le lot terminé, réussites et échecs confondus. */
  readonly finished = output<{ sent: number; failed: number }>();
  readonly closed = output<void>();

  private readonly media = inject(CpannelMediaService);
  private readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('files');

  protected readonly items = signal<readonly BulkItem[]>([]);
  protected readonly running = signal(false);

  protected readonly done = computed(() => this.items().filter((i) => i.state === 'done').length);
  protected readonly failed = computed(() => this.items().filter((i) => i.state === 'failed').length);
  protected readonly total = computed(() => this.items().length);

  protected pick(): void {
    this.fileInput()?.nativeElement.click();
  }

  protected onSelect(event: Event): void {
    const files = (event.target as HTMLInputElement).files;
    if (files?.length) void this.send(Array.from(files));
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    const files = event.dataTransfer?.files;
    if (files?.length) void this.send(Array.from(files));
  }

  protected allowDrop(event: DragEvent): void {
    event.preventDefault();
  }

  protected close(): void {
    if (this.running()) return;
    this.items.set([]);
    this.closed.emit();
  }

  private setState(index: number, state: ItemState, error?: string): void {
    this.items.update((items) =>
      items.map((item, i) => (i === index ? { ...item, state, error } : item)),
    );
  }

  private async send(files: readonly File[]): Promise<void> {
    if (this.running()) return;

    this.items.set(files.map((file) => ({ name: file.name, state: 'pending' as const })));
    this.running.set(true);

    let sent = 0;
    let failed = 0;

    for (const [index, file] of files.entries()) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        this.setState(index, 'failed', 'Format refusé : seuls JPEG et PNG.');
        failed++;
        continue;
      }

      this.setState(index, 'sending');

      try {
        const upload = await this.media.upload(file, this.module());

        // La photo est annoncée dès qu'elle est en ligne, sans attendre la fin
        // du lot : la page peut l'enregistrer aussitôt, et une interruption
        // laisse en base tout ce qui est déjà passé.
        this.photoReady.emit(upload);
        this.setState(index, 'done');
        sent++;
      } catch (cause) {
        this.setState(index, 'failed', cause instanceof Error ? cause.message : String(cause));
        failed++;
      }

      await new Promise((resolve) => setTimeout(resolve, PACE_MS));
    }

    this.running.set(false);

    const input = this.fileInput()?.nativeElement;
    // Sans cela, resélectionner les mêmes fichiers ne déclenche rien : la
    // valeur du champ n'a pas changé, donc aucun événement.
    if (input) input.value = '';

    this.finished.emit({ sent, failed });
  }
}
