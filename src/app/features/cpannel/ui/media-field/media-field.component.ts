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

import {
  ACCEPTED_TYPES,
  CpannelMediaService,
  type MediaUpload,
} from '../../services/cpannel-media.service';

export type { MediaUpload };

/**
 * Envoi d'une photo au service média externe.
 *
 * Le fichier ne transite pas par le bucket Supabase : il part vers une
 * fonction Edge qui vérifie le droit de l'administrateur, puis relaie l'image
 * au service média avec une clé technique que le navigateur ne voit jamais.
 * Seule l'adresse publique revient, et c'est elle qui est enregistrée.
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

  private readonly media = inject(CpannelMediaService);
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
    // façon, mais autant ne pas faire monter huit mégaoctets pour rien.
    if (!ACCEPTED_TYPES.includes(file.type)) {
      this.error.set('Seuls les fichiers JPEG et PNG sont acceptés.');
      return;
    }

    this.uploading.set(true);
    this.error.set(null);

    try {
      this.uploaded.emit(await this.media.upload(file, this.module()));
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
