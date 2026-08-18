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
import { Router } from '@angular/router';

import { SupabaseService } from '../../../../core/supabase/supabase.service';
import { GeocodingService } from '../../../../core/geo/geocoding.service';
import type { ContentLink, LinkType } from '../../../../core/supabase/database.types';
import { CpannelAuthService } from '../../services/cpannel-auth.service';
import { CpannelImageFieldComponent } from '../../ui/image-field/image-field.component';
import {
  CpannelLinkListComponent,
  type LinkDraft,
} from '../../ui/link-list/link-list.component';
import { CpannelImageListComponent } from '../../ui/image-list/image-list.component';
import { CpannelDataService, type ContentRow } from '../../services/cpannel-data.service';
import {
  WEEKDAYS,
  findModuleByPath,
  type FieldConfig,
  type ModuleConfig,
} from '../../data/cpannel-modules';

type Draft = Record<string, unknown>;

@Component({
  selector: 'app-cpannel-resource-page',
  standalone: true,
  imports: [
    FormsModule,
    CpannelImageFieldComponent,
    CpannelImageListComponent,
    CpannelLinkListComponent,
  ],
  templateUrl: './resource-page.component.html',
  styleUrl: './resource-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CpannelResourcePageComponent {
  private readonly auth = inject(CpannelAuthService);
  private readonly data = inject(CpannelDataService);
  private readonly titleService = inject(Title);
  private readonly router = inject(Router);
  private readonly supabase = inject(SupabaseService).client;
  private readonly geocoding = inject(GeocodingService);

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

  /** Types de liens disponibles, chargés une fois pour les champs 'links'. */
  protected readonly linkTypes = signal<readonly LinkType[]>([]);
  protected readonly links = signal<LinkDraft[]>([]);
  private readonly existingLinkIds = signal<readonly string[]>([]);

  /** Options des listes déroulantes alimentées par une table de paramètres. */
  protected readonly dynamicOptions = signal<Record<string, readonly { id: string; name: string }[]>>({});

  protected readonly geocodeStatus = signal<string | null>(null);
  protected readonly geocoding_ = signal(false);

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
      if (config.fields.some((field) => field.type === 'links')) void this.loadLinkTypes();
      void this.loadDynamicOptions(config);
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

    // Certains modules ont leur propre écran de rédaction : on y navigue au
    // lieu d'ouvrir le formulaire générique en modale.
    if (config.usesEditor) {
      void this.router.navigate(['/cpannel', config.path, 'nouveau']);
      return;
    }

    const draft: Draft = {};
    for (const field of config.fields) {
      switch (field.type) {
        case 'weekdays':
        case 'images':
          draft[field.key] = [];
          break;
        case 'boolean':
          draft[field.key] = false;
          break;
        default:
          draft[field.key] = '';
      }
    }

    this.editingId.set(null);
    this.error.set(null);
    this.geocodeStatus.set(null);
    this.links.set([]);
    this.existingLinkIds.set([]);
    this.draft.set(draft);
  }

  protected openEdit(row: ContentRow): void {
    const config = this.configSignal();
    if (!config) return;

    if (config.usesEditor) {
      void this.router.navigate(['/cpannel', config.path, row.id]);
      return;
    }

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
    this.geocodeStatus.set(null);
    this.links.set([]);
    this.existingLinkIds.set([]);
    this.draft.set(draft);
    void this.loadLinksFor(config, row.id);
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

  protected async save(): Promise<void> {
    const config = this.configSignal();
    const draft = this.draft();
    if (!config || !draft) return;

    const missing = config.fields.find(
      (field) =>
        field.required &&
        field.type !== 'links' &&
        String(draft[field.key] ?? '').trim() === '',
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

      const saved = id
        ? await this.data.update(config, id, payload)
        : await this.data.create(config, payload);

      await this.syncLinks(config, saved.id);

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

    // Relation résolue par PostgREST (ex. { name: 'Article' }) : on affiche
    // le libellé plutôt que « [object Object] ».
    if (typeof value === 'object' && !Array.isArray(value)) {
      const named = value as { name?: unknown };
      return typeof named.name === 'string' ? named.name : '—';
    }

    if (value === 'recurrent') return 'Récurrent';
    if (value === 'special') return 'Spécial';
    if (Array.isArray(value)) return value.length ? `${value.length} élément(s)` : '—';

    return String(value);
  }

  private async loadLinkTypes(): Promise<void> {
    if (this.linkTypes().length) return;

    const { data } = await this.supabase
      .from('link_types')
      .select('*')
      .eq('is_visible', true)
      .order('position')
      .returns<LinkType[]>();

    this.linkTypes.set(data ?? []);
  }

  private async loadDynamicOptions(config: ModuleConfig): Promise<void> {
    const sources = [
      ...new Set(
        config.fields
          .map((field) => field.optionsFrom)
          .filter((source): source is NonNullable<typeof source> => Boolean(source)),
      ),
    ];

    for (const source of sources) {
      const { data } = await this.supabase
        .from(source)
        .select('id, name')
        .eq('is_visible', true)
        .order('position')
        .returns<{ id: string; name: string }[]>();

      this.dynamicOptions.update((current) => ({ ...current, [source]: data ?? [] }));
    }
  }

  protected optionsFor(field: FieldConfig): readonly { id: string; name: string }[] {
    return field.optionsFrom ? (this.dynamicOptions()[field.optionsFrom] ?? []) : [];
  }

  protected isChecked(key: string): boolean {
    return this.draft()?.[key] === true;
  }

  protected toggleBoolean(key: string): void {
    this.draft.update((draft) => (draft ? { ...draft, [key]: !draft[key] } : draft));
  }

  protected imagePaths(key: string): readonly string[] {
    const value = this.draft()?.[key];
    return Array.isArray(value) ? (value as string[]) : [];
  }

  protected setImagePaths(key: string, paths: string[]): void {
    this.draft.update((draft) => (draft ? { ...draft, [key]: paths } : draft));
  }

  protected onLinks(links: LinkDraft[]): void {
    this.links.set(links);
  }

  /**
   * Recherche les coordonnées à la sortie du champ d'adresse.
   *
   * Un échec n'est pas bloquant : l'administrateur peut toujours saisir la
   * latitude et la longitude à la main. Mieux vaut le dire que de placer un
   * point approximatif sur la carte.
   */
  protected async geocodeAddress(field: FieldConfig): Promise<void> {
    const target = field.geocodeTo;
    const address = this.fieldValue(field.key).trim();
    if (!target || !address) return;

    this.geocoding_.set(true);
    this.geocodeStatus.set(null);

    try {
      const result = await this.geocoding.lookup(address);

      if (!result) {
        this.geocodeStatus.set(
          "Adresse introuvable — saisissez la latitude et la longitude à la main.",
        );
        return;
      }

      this.draft.update((draft) =>
        draft
          ? {
              ...draft,
              [target.lat]: String(result.latitude),
              [target.lng]: String(result.longitude),
            }
          : draft,
      );
      this.geocodeStatus.set(`Lieu trouvé : ${result.displayName}`);
    } catch (cause) {
      this.geocodeStatus.set(cause instanceof Error ? cause.message : String(cause));
    } finally {
      this.geocoding_.set(false);
    }
  }

  /**
   * Aligne les liens enregistrés sur ceux du formulaire.
   *
   * Les liens retirés sont réellement supprimés : ce sont des attributs d'un
   * contenu, pas des contenus. La règle du soft delete continue de protéger
   * les enregistrements eux-mêmes.
   */
  private async syncLinks(config: ModuleConfig, recordId: string): Promise<void> {
    const field = config.fields.find((entry) => entry.type === 'links');
    if (!field?.linkOwner) return;

    const ownerColumn = field.linkOwner === 'article' ? 'article_id' : 'extension_id';
    const current = this.links().filter((link) => link.url.trim());
    const keptIds = current.map((link) => link.id).filter(Boolean) as string[];
    const removed = this.existingLinkIds().filter((id) => !keptIds.includes(id));

    if (removed.length) {
      await this.supabase.from('content_links').delete().in('id', removed);
    }

    for (const [index, link] of current.entries()) {
      const row = {
        [ownerColumn]: recordId,
        link_type_id: link.link_type_id,
        url: link.url.trim(),
        label: link.label.trim() || null,
        position: index,
      };

      if (link.id) {
        await this.supabase.from('content_links').update(row).eq('id', link.id);
      } else {
        await this.supabase.from('content_links').insert(row);
      }
    }
  }

  private async loadLinksFor(config: ModuleConfig, recordId: string): Promise<void> {
    const field = config.fields.find((entry) => entry.type === 'links');
    if (!field?.linkOwner) return;

    const ownerColumn = field.linkOwner === 'article' ? 'article_id' : 'extension_id';

    const { data } = await this.supabase
      .from('content_links')
      .select('*')
      .eq(ownerColumn, recordId)
      .order('position')
      .returns<ContentLink[]>();

    const rows = data ?? [];
    this.links.set(
      rows.map((row) => ({
        id: row.id,
        link_type_id: row.link_type_id,
        url: row.url,
        label: row.label ?? '',
      })),
    );
    this.existingLinkIds.set(rows.map((row) => row.id));
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
      // Les liens vivent dans leur propre table, pas dans une colonne de ce
      // contenu : ils sont enregistrés séparément par syncLinks().
      if (field.type === 'links') continue;

      const raw = draft[field.key];

      switch (field.type) {
        case 'paragraphs': {
          const text = String(raw ?? '').trim();
          payload[field.key] = text
            ? text.split(/\n\s*\n/).map((paragraph) => paragraph.trim()).filter(Boolean)
            : [];
          break;
        }
        case 'lines': {
          const text = String(raw ?? '').trim();
          payload[field.key] = text
            ? text.split(/\n+/).map((line) => line.trim()).filter(Boolean)
            : [];
          break;
        }
        case 'images': {
          payload[field.key] = Array.isArray(raw) ? (raw as string[]).filter(Boolean) : [];
          break;
        }
        case 'boolean': {
          payload[field.key] = raw === true;
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
