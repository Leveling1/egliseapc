import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ACCEPTED_TYPES, CpannelMediaService } from '../../services/cpannel-media.service';

/** Où en est un fichier du lot. */
export type ItemState = 'selected' | 'sending' | 'done' | 'failed';

export interface BulkItem {
  readonly file: File;
  /** Aperçu local, révoqué à la fermeture. */
  readonly preview: string;
  readonly state: ItemState;
  readonly error?: string;
}

/** Une photo en ligne, prête à être enregistrée avec les informations du lot. */
export interface BulkResult {
  readonly url: string;
  readonly width: number;
  readonly height: number;
  readonly mediaId: string;
  readonly caption: string | null;
  readonly alt: string | null;
}

/**
 * Pause entre deux envois, en millisecondes.
 *
 * Le service média limite le débit et répond 429 quand on le presse. Envoyer
 * les fichiers l'un après l'autre, avec un temps mort, coûte quelques secondes
 * sur un lot important mais évite qu'une moitié du lot soit refusée.
 */
const PACE_MS = 250;

/**
 * Ajout de photos par lot, en trois temps.
 *
 *   1. On choisit les fichiers - autant qu'on veut - et on les voit en aperçu.
 *   2. On renseigne les informations DU LOT : une légende et une description
 *      valables pour toutes les photos sélectionnées.
 *   3. On enregistre. Rien ne part avant ce clic.
 *
 * Une première version envoyait chaque fichier dès sa sélection, sans aperçu
 * ni possibilité de renseigner quoi que ce soit. C'était prendre l'utilisateur
 * de vitesse : on ne devrait jamais rien expédier qu'il n'ait explicitement
 * validé.
 *
 * L'échec d'un fichier n'interrompt pas les suivants, et chaque photo passée
 * est enregistrée aussitôt : une coupure au vingtième fichier laisse les
 * dix-neuf précédents en base.
 */
@Component({
  selector: 'app-cpannel-media-bulk',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './media-bulk.component.html',
  styleUrl: './media-bulk.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CpannelMediaBulkComponent {
  /** Module concerné : la fonction Edge vérifie le droit d'écriture dessus. */
  readonly module = input.required<string>();

  /** Émis pour chaque photo réussie, avec les informations du lot. */
  readonly photoReady = output<BulkResult>();
  /** Émis une fois le lot terminé, réussites et échecs confondus. */
  readonly finished = output<{ sent: number; failed: number }>();
  readonly closed = output<void>();

  private readonly media = inject(CpannelMediaService);
  private readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('files');

  protected readonly items = signal<readonly BulkItem[]>([]);
  protected readonly running = signal(false);
  /** Vrai pendant qu'un glisser survole la zone : elle s'éclaire en réponse. */
  protected readonly dragging = signal(false);

  /** Informations communes à tout le lot. */
  protected readonly caption = signal('');
  protected readonly alt = signal('');

  protected readonly total = computed(() => this.items().length);
  protected readonly done = computed(() => this.items().filter((i) => i.state === 'done').length);
  protected readonly failed = computed(() => this.items().filter((i) => i.state === 'failed').length);
  protected readonly pending = computed(() => this.items().filter((i) => i.state === 'selected').length);
  protected readonly canSave = computed(() => this.pending() > 0 && !this.running());
  protected readonly isComplete = computed(() => this.total() > 0 && this.pending() === 0 && !this.running());

  constructor() {
    // Les aperçus sont des URL d'objet : le navigateur garde le fichier en
    // mémoire tant qu'elles existent. On les libère en quittant.
    inject(DestroyRef).onDestroy(() => this.revokeAll());
  }

  protected pick(): void {
    this.fileInput()?.nativeElement.click();
  }

  protected onSelect(event: Event): void {
    const files = (event.target as HTMLInputElement).files;
    if (files?.length) this.add(Array.from(files));
    // Sans cela, resélectionner les mêmes fichiers ne déclenche rien : la
    // valeur du champ n'a pas changé, donc aucun événement.
    (event.target as HTMLInputElement).value = '';
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    const files = event.dataTransfer?.files;
    if (files?.length) this.add(Array.from(files));
  }

  protected allowDrop(event: DragEvent): void {
    event.preventDefault();
    if (!this.running()) this.dragging.set(true);
  }

  protected onDragLeave(): void {
    this.dragging.set(false);
  }

  protected remove(index: number): void {
    if (this.running()) return;
    const item = this.items()[index];
    if (item) URL.revokeObjectURL(item.preview);
    this.items.update((items) => items.filter((_, i) => i !== index));
  }

  protected close(): void {
    if (this.running()) return;
    this.revokeAll();
    this.items.set([]);
    this.caption.set('');
    this.alt.set('');
    this.closed.emit();
  }

  /** Ajoute à la sélection sans rien envoyer : l'envoi attend le clic Enregistrer. */
  private add(files: readonly File[]): void {
    if (this.running()) return;

    const accepted = files.map((file) => {
      const ok = ACCEPTED_TYPES.includes(file.type);
      return {
        file,
        preview: ok ? URL.createObjectURL(file) : '',
        state: ok ? ('selected' as const) : ('failed' as const),
        error: ok ? undefined : 'Format refusé : seuls JPEG et PNG.',
      };
    });

    this.items.update((items) => [...items, ...accepted]);
  }

  private setState(index: number, state: ItemState, error?: string): void {
    this.items.update((items) =>
      items.map((item, i) => (i === index ? { ...item, state, error } : item)),
    );
  }

  private revokeAll(): void {
    for (const item of this.items()) if (item.preview) URL.revokeObjectURL(item.preview);
  }

  /** Envoie le lot, dans l'ordre de sélection, avec les informations communes. */
  protected async save(): Promise<void> {
    if (!this.canSave()) return;
    this.running.set(true);

    const caption = this.caption().trim() || null;
    const alt = this.alt().trim() || null;
    let sent = 0;
    let failed = 0;

    for (const [index, item] of this.items().entries()) {
      if (item.state !== 'selected') continue;

      this.setState(index, 'sending');

      try {
        const upload = await this.media.upload(item.file, this.module());
        // Annoncée dès qu'elle est en ligne, sans attendre la fin du lot : la
        // page peut l'enregistrer aussitôt.
        this.photoReady.emit({ ...upload, caption, alt });
        this.setState(index, 'done');
        sent++;
      } catch (cause) {
        this.setState(index, 'failed', cause instanceof Error ? cause.message : String(cause));
        failed++;
      }

      await new Promise((resolve) => setTimeout(resolve, PACE_MS));
    }

    this.running.set(false);
    this.finished.emit({ sent, failed });
  }
}
