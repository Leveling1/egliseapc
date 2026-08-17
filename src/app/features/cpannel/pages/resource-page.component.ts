import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Title } from '@angular/platform-browser';

import { CpannelAuthService } from '../services/cpannel-auth.service';
import { CpannelDataService, type ContentRow } from '../services/cpannel-data.service';
import {
  WEEKDAYS,
  findModuleByPath,
  type FieldConfig,
  type ModuleConfig,
} from '../data/cpannel-modules';

type Draft = Record<string, unknown>;

@Component({
  selector: 'app-cpannel-resource-page',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './resource-page.component.html',
  styleUrl: './resource-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CpannelResourcePageComponent {
  private readonly auth = inject(CpannelAuthService);
  private readonly data = inject(CpannelDataService);
  private readonly titleService = inject(Title);

  /**
   * Segment d'URL du module, injecté par le routeur grâce à
   * `withComponentInputBinding()` : `/cpannel/articles` donne 'articles'.
   * Un seul composant sert ainsi les cinq modules de contenu.
   */
  readonly modulePath = input.required<string>();

  protected readonly config = computed(() => findModuleByPath(this.modulePath()) ?? null);

  private readonly configSignal = this.config;

  protected readonly weekdays = WEEKDAYS;

  protected readonly rows = signal<readonly ContentRow[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly search = signal('');

  /** Enregistrement en cours d'édition ; null quand aucun panneau n'est ouvert. */
  protected readonly draft = signal<Draft | null>(null);
  protected readonly editingId = signal<string | null>(null);
  protected readonly saving = signal(false);
  protected readonly uploading = signal<string | null>(null);

  /** Ligne dont on s'apprête à changer la visibilité, en attente de confirmation. */
  protected readonly pendingHide = signal<ContentRow | null>(null);

  protected readonly canEdit = computed(() => {
    const config = this.configSignal();
    return config ? this.auth.can(config.module, 'edit') : false;
  });

  protected readonly canPublish = computed(() => {
    const config = this.configSignal();
    return config ? this.auth.can(config.module, 'publish') : false;
  });

  protected readonly filteredRows = computed(() => {
    const term = this.search().trim().toLowerCase();
    if (!term) return this.rows();

    const config = this.configSignal();
    if (!config) return this.rows();

    return this.rows().filter((row) =>
      config.columns.some((column) =>
        String(row[column.key] ?? '').toLowerCase().includes(term),
      ),
    );
  });

  constructor() {
    // Recharge la liste à chaque changement de module, y compris lors d'une
    // navigation d'un module à l'autre : Angular réutilise le composant, donc
    // un chargement fait une seule fois au démarrage laisserait l'ancienne
    // liste à l'écran.
    effect(() => {
      const config = this.config();
      if (!config) return;

      this.titleService.setTitle(`${config.label} — cpannel A.P.C`);
      this.closeEditor();
      this.search.set('');
      void this.load();
    });
  }

  protected async load(): Promise<void> {
    const config = this.configSignal();
    if (!config) return;

    this.loading.set(true);
    this.error.set(null);

    try {
      this.rows.set(await this.data.list(config));
    } catch (cause) {
      this.error.set(cause instanceof Error ? cause.message : String(cause));
    } finally {
      this.loading.set(false);
    }
  }

  // ---------- Édition ----------

  protected openCreate(): void {
    const config = this.configSignal();
    if (!config) return;

    const draft: Draft = {};
    for (const field of config.fields) {
      draft[field.key] = field.type === 'weekdays' ? [] : '';
    }

    this.editingId.set(null);
    this.error.set(null);
    this.draft.set(draft);
  }

  protected openEdit(row: ContentRow): void {
    const config = this.configSignal();
    if (!config) return;

    const draft: Draft = {};
    for (const field of config.fields) {
      const value = row[field.key];

      if (field.type === 'paragraphs') {
        draft[field.key] = Array.isArray(value) ? (value as string[]).join('\n\n') : '';
      } else if (field.type === 'weekdays') {
        draft[field.key] = Array.isArray(value) ? [...(value as number[])] : [];
      } else {
        draft[field.key] = value ?? '';
      }
    }

    this.editingId.set(row.id);
    this.error.set(null);
    this.draft.set(draft);
  }

  protected closeEditor(): void {
    this.draft.set(null);
    this.editingId.set(null);
  }

  protected fieldValue(key: string): string {
    return String(this.draft()?.[key] ?? '');
  }

  protected setFieldValue(key: string, value: string): void {
    this.draft.update((draft) => (draft ? { ...draft, [key]: value } : draft));
  }

  protected isDayChecked(key: string, day: number): boolean {
    const value = this.draft()?.[key];
    return Array.isArray(value) && (value as number[]).includes(day);
  }

  protected toggleDay(key: string, day: number): void {
    this.draft.update((draft) => {
      if (!draft) return draft;
      const current = Array.isArray(draft[key]) ? [...(draft[key] as number[])] : [];
      const index = current.indexOf(day);

      if (index === -1) {
        current.push(day);
      } else {
        current.splice(index, 1);
      }

      return { ...draft, [key]: current };
    });
  }

  protected imageUrl(key: string): string | null {
    return this.data.publicImageUrl(this.fieldValue(key) || null);
  }

  protected async onImageSelected(field: FieldConfig, event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.uploading.set(field.key);
    this.error.set(null);

    try {
      const path = await this.data.uploadImage(file);
      this.setFieldValue(field.key, path);
    } catch (cause) {
      this.error.set(cause instanceof Error ? cause.message : String(cause));
    } finally {
      this.uploading.set(null);
      input.value = '';
    }
  }

  protected async save(): Promise<void> {
    const config = this.configSignal();
    const draft = this.draft();
    if (!config || !draft) return;

    const missing = config.fields.find(
      (field) => field.required && String(draft[field.key] ?? '').trim() === '',
    );

    if (missing) {
      this.error.set(`Le champ « ${missing.label} » est obligatoire.`);
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    try {
      const payload = this.toPayload(config, draft);
      const id = this.editingId();

      if (id) {
        await this.data.update(config, id, payload);
      } else {
        await this.data.create(config, payload);
      }

      this.closeEditor();
      await this.load();
    } catch (cause) {
      this.error.set(cause instanceof Error ? cause.message : String(cause));
    } finally {
      this.saving.set(false);
    }
  }

  // ---------- Visibilité (remplace la suppression) ----------

  protected askHide(row: ContentRow): void {
    this.pendingHide.set(row);
  }

  protected cancelHide(): void {
    this.pendingHide.set(null);
  }

  protected async confirmVisibility(row: ContentRow, isVisible: boolean): Promise<void> {
    const config = this.configSignal();
    if (!config) return;

    this.error.set(null);
    this.pendingHide.set(null);

    try {
      await this.data.setVisibility(config, row.id, isVisible);
      await this.load();
    } catch (cause) {
      this.error.set(cause instanceof Error ? cause.message : String(cause));
    }
  }

  // ---------- Affichage ----------

  protected displayCell(row: ContentRow, key: string): string {
    const value = row[key];

    if (value === null || value === undefined || value === '') return '—';
    if (value === 'recurrent') return 'Récurrent';
    if (value === 'special') return 'Spécial';
    if (Array.isArray(value)) return value.length ? `${value.length} élément(s)` : '—';

    return String(value);
  }

  /**
   * Convertit le brouillon en charge utile pour Postgres.
   *
   * Les chaînes vides deviennent NULL : envoyer '' dans une colonne date ou
   * numérique la ferait échouer, et une chaîne vide n'a de toute façon pas le
   * même sens qu'une absence de valeur.
   */
  private toPayload(config: ModuleConfig, draft: Draft): Record<string, unknown> {
    const payload: Record<string, unknown> = {};

    for (const field of config.fields) {
      const raw = draft[field.key];

      switch (field.type) {
        case 'paragraphs': {
          const text = String(raw ?? '').trim();
          payload[field.key] = text
            ? text.split(/\n\s*\n/).map((paragraph) => paragraph.trim()).filter(Boolean)
            : [];
          break;
        }
        case 'weekdays': {
          const days = Array.isArray(raw) ? (raw as number[]) : [];
          payload[field.key] = days.length ? [...days].sort((a, b) => a - b) : null;
          break;
        }
        case 'number': {
          const text = String(raw ?? '').trim();
          payload[field.key] = text === '' ? null : Number(text);
          break;
        }
        default: {
          const text = String(raw ?? '').trim();
          payload[field.key] = text === '' ? null : text;
        }
      }
    }

    return payload;
  }
}
