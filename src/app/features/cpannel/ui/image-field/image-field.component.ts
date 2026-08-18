import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

import { CpannelDataService } from '../../services/cpannel-data.service';

/**
 * Champ d'image : zone de dépôt, prévisualisation, et rappel des dimensions
 * qui rendent bien dans le design du site.
 *
 * Le rappel de dimensions n'est pas décoratif : sans indication, les images
 * arrivent dans des formats très variés et cassent les grilles du site
 * public. Le dire au moment de l'envoi évite de devoir les reprendre.
 */
@Component({
  selector: 'app-cp-image-field',
  standalone: true,
  templateUrl: './image-field.component.html',
  styleUrl: './image-field.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CpannelImageFieldComponent {
  private readonly data = inject(CpannelDataService);

  /** Chemin stocké dans le bucket, ou chaîne vide. */
  readonly value = input<string>('');
  /** Dimensions conseillées, par exemple « 1200 × 630 px ». */
  readonly recommended = input<string>('');
  readonly hint = input<string>('');
  readonly valueChange = output<string>();

  protected readonly uploading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly dragging = signal(false);

  protected readonly previewUrl = computed(() =>
    this.data.publicImageUrl(this.value() || null),
  );

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(true);
  }

  protected onDragLeave(): void {
    this.dragging.set(false);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) void this.upload(file);
  }

  protected onPick(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) void this.upload(file);
    input.value = '';
  }

  protected clear(): void {
    this.error.set(null);
    this.valueChange.emit('');
  }

  private async upload(file: File): Promise<void> {
    if (!file.type.startsWith('image/')) {
      this.error.set('Ce fichier n\'est pas une image.');
      return;
    }

    this.uploading.set(true);
    this.error.set(null);

    try {
      this.valueChange.emit(await this.data.uploadImage(file));
    } catch (cause) {
      this.error.set(cause instanceof Error ? cause.message : String(cause));
    } finally {
      this.uploading.set(false);
    }
  }
}
