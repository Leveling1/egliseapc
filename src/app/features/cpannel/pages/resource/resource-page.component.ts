import { LowerCasePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

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
import { DEFAULT_PAGE_SIZE, CpannelDataService, type ContentRow } from '../../services/cpannel-data.service';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import {
  CpannelMediaFieldComponent,
  type MediaUpload,
} from '../../ui/media-field/media-field.component';
import {
  CpannelMediaBulkComponent,
  type BulkResult,
} from '../../ui/media-bulk/media-bulk.component';
import {
  WEEKDAYS,
  findModuleByPath,
  type FieldConfig,
  type ModuleConfig,
} from '../../data/cpannel-modules';

type Draft = Record<string, unknown>;
type ScheduleEntry = { day: string; start: string; end: string; legacy?: string };

@Component({
  selector: 'app-cpannel-resource-page',
  standalone: true,
  imports: [
    LowerCasePipe,
    FormsModule,
    PaginationComponent,
    CpannelMediaFieldComponent,
    CpannelMediaBulkComponent,
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
  private readonly route = inject(ActivatedRoute);
  private readonly supabase = inject(SupabaseService).client;
  private readonly geocoding = inject(GeocodingService);

  /**
   * Segment d'URL du module, injecté par le routeur grâce à
   * `withComponentInputBinding()` : `/cpannel/articles` donne 'articles'.
   * Un seul composant sert ainsi les cinq modules de contenu.
   */
  readonly modulePath = input.required<string>();

  private readonly baseConfig = computed(() => findModuleByPath(this.modulePath()) ?? null);

  /** Onglets de la page, quand elle en réunit plusieurs. */
  protected readonly tabs = computed(() => this.baseConfig()?.tabs ?? null);
  protected readonly activeTab = signal(0);

  /**
   * Configuration réellement affichée.
   *
   * Tout le reste du composant lit ceci et ignore l'existence des onglets :
   * changer d'onglet revient exactement à changer de module, et l'effet de
   * chargement s'en charge sans savoir lequel des deux s'est produit.
   */
  protected readonly config = computed(() => {
    const base = this.baseConfig();
    if (!base?.tabs) return base;
    return base.tabs[this.activeTab()] ?? base.tabs[0];
  });

  private readonly configSignal = this.config;

  protected selectTab(index: number): void {
    this.activeTab.set(index);
  }

  protected readonly weekdays = WEEKDAYS;

  protected readonly rows = signal<readonly ContentRow[]>([]);
  protected readonly galleryMaxPosition = signal(0);
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

  /**
   * Les lignes affichées sont celles que la base a rendues.
   *
   * Le filtrage se faisait ici, sur la liste complète ; il est maintenant
   * envoyé avec la requête. Filtrer après découpage ne fouillerait que la page
   * courante, et chercher un titre reviendrait à deviner d'abord sa page.
   */
  protected readonly filteredRows = this.rows;

  /** Historique affiché (lignes archivées) plutôt que la liste courante. */
  protected readonly archived = signal(false);

  /**
   * Lignes réparties en blocs, quand le module le demande.
   *
   * Chaque bloc ne reprend que les lignes de sa valeur ; un bloc vide est
   * omis, la page se lit alors comme s'il n'existait pas. Sans groupes, un
   * seul bloc sans titre porte toute la liste.
   */
  protected readonly groupedRows = computed(() => {
    const config = this.config();
    const rows = this.filteredRows();
    if (config?.bulkMedia) {
      const groups = new Map<string, { label: string; rows: ContentRow[] }>();
      for (const row of rows) {
        const label = typeof row['caption'] === 'string' ? row['caption'].trim() : '';
        const key = label || '__sans_groupe__';
        const group = groups.get(key) ?? { label: label || 'Sans groupe', rows: [] };
        group.rows.push(row);
        groups.set(key, group);
      }
      return [...groups.entries()].map(([key, group]) => ({ key, ...group }));
    }
    if (!config?.groups) return [{ key: '', label: null as string | null, rows }];

    const { column, values } = config.groups;
    return values
      .map((group) => ({
        key: String(group.value),
        label: group.label as string | null,
        rows: rows.filter((row) => row[column] === group.value),
      }))
      .filter((group) => group.rows.length > 0);
  });

  /** Lot actuellement ouvert dans la vue détaillée de la galerie. */
  protected readonly activeGalleryGroup = signal<string | null>(null);
  protected readonly selectedGalleryGroup = computed(() => {
    const key = this.activeGalleryGroup();
    return key === null ? null : this.groupedRows().find((group) => group.key === key) ?? null;
  });

  protected openGalleryGroup(key: string): void {
    this.activeGalleryGroup.set(key);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { lot: key },
      queryParamsHandling: 'merge',
    });
  }

  protected closeGalleryGroup(): void {
    this.activeGalleryGroup.set(null);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { lot: null },
      queryParamsHandling: 'merge',
    });
  }

  protected galleryVisibleCount(rows: readonly ContentRow[]): number {
    return rows.filter((row) => row.is_visible === true).length;
  }

  protected addToActiveGalleryGroup(): void {
    const group = this.selectedGalleryGroup();
    if (group) this.toggleBulk(group.label === 'Sans groupe' ? null : group.label);
  }

  protected toggleArchive(): void {
    this.archived.update((value) => !value);
    this.page.set(1);
    void this.load();
  }

  protected readonly totalRows = signal(0);
  protected readonly page = signal(1);
  protected readonly pageSize = DEFAULT_PAGE_SIZE;

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.totalRows() / this.pageSize)),
  );

  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Relance la requête après une pause de frappe.
   *
   * La recherche s'exécute désormais dans la base : l'envoyer à chaque touche
   * ferait une requête par caractère. Un tiers de seconde d'immobilité suffit
   * à distinguer une frappe en cours d'une recherche terminée.
   */
  protected onSearch(term: string): void {
    this.search.set(term);
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.page.set(1);
      void this.load();
    }, 300);
  }

  /**
   * Reporte l'adresse ET les dimensions rendues par le service média.
   *
   * Les enregistrer maintenant évite d'avoir à mesurer l'image plus tard :
   * c'est de ces deux nombres que le mur public déduit la place à réserver.
   * Les champs sont renseignés silencieusement, sans figurer au formulaire -
   * ce ne sont pas des choix, mais des faits sur le fichier.
   */
  protected onMediaUploaded(key: string, media: MediaUpload): void {
    this.setFieldValue(key, media.url);
    if (media.width > 0) this.setFieldValue('width', String(media.width));
    if (media.height > 0) this.setFieldValue('height', String(media.height));
    if (media.mediaId) this.setFieldValue('media_id', media.mediaId);
  }

  protected readonly bulkOpen = signal(false);
  protected readonly bulkCaption = signal<string | null>(null);

  protected toggleBulk(caption: string | null = null): void {
    this.bulkCaption.set(caption);
    this.bulkOpen.update((open) => !open);
  }

  /**
   * Enregistre une photo dès qu'elle est en ligne, sans attendre la fin du lot.
   *
   * Chaque photo donne une ligne : c'est le sens de la demande, et cela rend
   * l'opération reprenable. Une coupure au vingtième fichier laisse les dix-neuf
   * précédents enregistrés au lieu de tout perdre.
   *
   * Le rang est calculé à partir du total connu : les nouvelles photos se
   * rangent à la suite plutôt qu'en tête, l'ordre existant n'ayant pas à être
   * bousculé par un ajout.
   */
  protected async onBulkPhoto(photo: BulkResult): Promise<void> {
    const config = this.configSignal();
    if (!config) return;

    try {
      await this.data.create(config, {
        url: photo.url,
        width: photo.width,
        height: photo.height,
        media_id: photo.mediaId || null,
        caption: photo.caption,
        alt: photo.alt,
        position: this.galleryMaxPosition() + 1,
      });
      this.galleryMaxPosition.update((position) => position + 1);
      this.totalRows.update((total) => total + 1);
    } catch (cause) {
      this.error.set(cause instanceof Error ? cause.message : String(cause));
    }
  }

  protected async onBulkFinished(): Promise<void> {
    await this.load();
  }

  protected goToPage(page: number): void {
    this.page.set(page);
    void this.load();
  }

  constructor() {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed())
      .subscribe((params) => this.activeGalleryGroup.set(params.get('lot')));

    // Recharge la liste à chaque changement de module, y compris lors d'une
    // navigation d'un module à l'autre : Angular réutilise le composant, donc
    // un chargement fait une seule fois au démarrage laisserait l'ancienne
    // liste à l'écran.
    effect(() => {
      const config = this.config();
      if (!config) return;

      // Tout ce qui suit est hors suivi : `load()` lit la page et la
      // recherche courantes avant son premier `await`, et sans `untracked`
      // l'effet s'y abonnait. Chaque changement de page le relançait, qui
      // remettait aussitôt la page à 1 - l'indicateur restait donc collé sur
      // la première page alors que la liste, elle, avait bien changé.
      untracked(() => {
        this.titleService.setTitle(`${config.label} - cpannel A.P.C`);
        if (config.fields.some((field) => field.type === 'links')) void this.loadLinkTypes();
        void this.loadDynamicOptions(config);
        this.closeEditor();
        this.activeGalleryGroup.set(null);
        this.search.set('');
        this.page.set(1);
        this.archived.set(false);
        void this.load();
      });
    });
  }

  /**
   * Export CSV de la liste complète.
   *
   * C'est la raison d'être d'une liste d'abonnés : pouvoir l'utiliser dans
   * un outil d'envoi. Sans export, les adresses resteraient prisonnières du
   * cpannel. Le fichier est fabriqué dans le navigateur, les données ne
   * transitent donc par aucun tiers.
   */
  protected exportCsv(): void {
    const config = this.configSignal();
    if (!config) return;

    const columns = config.columns.map((column) => column.key);
    const header = config.columns.map((column) => column.label);

    const escape = (value: unknown): string => {
      const text = value === null || value === undefined ? '' : String(value);
      // Guillemets doublés et champ encadré : une valeur contenant une
      // virgule ou un retour à la ligne ne doit pas casser la colonne.
      return `"${text.replace(/"/g, '""')}"`;
    };

    const rows = this.rows().map((row) => columns.map((key) => escape(row[key])).join(','));
    // Le BOM fait qu'Excel ouvre le fichier en UTF-8 : sans lui, les accents
    // arrivent illisibles.
    const csv = '﻿' + [header.map(escape).join(','), ...rows].join('\r\n');

    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${config.path}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  protected async load(): Promise<void> {
    const config = this.configSignal();
    if (!config) return;

    this.loading.set(true);
    this.error.set(null);

    try {
      let rows: ContentRow[];
      let total: number;
      if (config.bulkMedia) {
        const allRows = await this.data.listAll(config);
        this.galleryMaxPosition.set(
          allRows.reduce((max, row) => Math.max(max, Number(row['position']) || 0), 0),
        );
        const term = this.search().trim().toLocaleLowerCase();
        rows = term
          ? allRows.filter((row) =>
              config.columns.some((column) =>
                String(row[column.key] ?? '').toLocaleLowerCase().includes(term),
              ),
            )
          : allRows;
        total = rows.length;
      } else {
        const result = await this.data.list(config, {
            page: this.page(),
            pageSize: this.pageSize,
            search: this.search(),
            archived: this.archived(),
          });
        rows = result.rows;
        total = result.total;
      }
      this.rows.set(rows);
      this.totalRows.set(total);
      // Une recherche qui réduit la liste peut laisser la page courante
      // au-delà du dernier résultat : on revient alors en tête plutôt que
      // d'afficher un tableau vide sans explication.
      if (rows.length === 0 && this.page() > 1) {
        this.page.set(1);
        await this.load();
      }
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
        case 'schedule':
          draft['opening_hours_entries'] = [];
          break;
        case 'map-link':
          draft[field.key] = '';
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
      } else if (field.type === 'schedule') {
        draft['opening_hours_entries'] = this.parseSchedule(value);
      } else if (field.type === 'map-link') {
        const latitude = Number(row['latitude']);
        const longitude = Number(row['longitude']);
        draft[field.key] = Number.isFinite(latitude) && Number.isFinite(longitude)
          ? `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
          : '';
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

  protected scheduleRows(): readonly ScheduleEntry[] {
    const rows = this.draft()?.['opening_hours_entries'];
    return Array.isArray(rows) ? (rows as ScheduleEntry[]) : [];
  }

  protected addScheduleRow(): void {
    this.draft.update((draft) => draft
      ? { ...draft, opening_hours_entries: [...this.scheduleRows(), { day: '', start: '', end: '' }] }
      : draft);
  }

  protected updateScheduleRow(index: number, key: 'day' | 'start' | 'end', value: string): void {
    this.draft.update((draft) => {
      if (!draft) return draft;
      const rows = [...this.scheduleRows()];
      if (!rows[index]) return draft;
      rows[index] = { ...rows[index], [key]: value, legacy: undefined };
      return { ...draft, opening_hours_entries: rows };
    });
  }

  protected removeScheduleRow(index: number): void {
    this.draft.update((draft) => draft
      ? { ...draft, opening_hours_entries: this.scheduleRows().filter((_, i) => i !== index) }
      : draft);
  }

  protected hasGoogleMapsLink(): boolean {
    const value = this.fieldValue('maps_url').trim();
    return Boolean(value) && this.isGoogleMapsUrl(value);
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

    if (config.module === 'extensions') {
      const incomplete = this.scheduleRows().some((entry) => {
        if (entry.legacy && !entry.day && !entry.start && !entry.end) return false;
        const hasAnyValue = Boolean(entry.day.trim() || entry.start || entry.end);
        return hasAnyValue && !(entry.day.trim() && entry.start && entry.end);
      });
      if (incomplete) {
        this.error.set('Complétez le jour, l’heure de début et l’heure de fin de chaque programme.');
        return;
      }
    }

    this.saving.set(true);
    this.error.set(null);

    try {
      const payload = this.toPayload(config, draft);
      if (config.module === 'extensions') {
        const mapUrl = String(draft['maps_url'] ?? '').trim();
        if (mapUrl) {
          if (!this.isGoogleMapsUrl(mapUrl)) {
            throw new Error('Collez un lien Google Maps valide commençant par https://.');
          }

          let coordinates = this.googleMapsCoordinates(mapUrl);
          if (!coordinates) {
            const search = this.googleMapsSearch(mapUrl) || String(draft['address'] ?? '').trim();
            if (search) {
              const found = await this.geocoding.lookup(search);
              if (found) coordinates = { latitude: found.latitude, longitude: found.longitude };
            }
          }
          if (!coordinates) {
            throw new Error(
              'Je ne trouve pas les coordonnées dans ce lien. Ajoutez l’adresse complète de l’extension ou utilisez le lien Google Maps du lieu avec sa position.',
            );
          }
          payload['latitude'] = coordinates.latitude;
          payload['longitude'] = coordinates.longitude;
        } else {
          const latitude = String(draft['latitude'] ?? '').trim();
          const longitude = String(draft['longitude'] ?? '').trim();
          payload['latitude'] = latitude ? Number(latitude) : null;
          payload['longitude'] = longitude ? Number(longitude) : null;
        }
      }
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

    if (value === null || value === undefined || value === '') return '-';

    // Relation résolue par PostgREST (ex. { name: 'Article' }) : on affiche
    // le libellé plutôt que « [object Object] ».
    if (typeof value === 'object' && !Array.isArray(value)) {
      const named = value as { name?: unknown };
      return typeof named.name === 'string' ? named.name : '-';
    }

    if (value === 'recurrent') return 'Récurrent';
    if (value === 'special') return 'Spécial';
    if (Array.isArray(value)) return value.length ? `${value.length} élément(s)` : '-';

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
          "Adresse introuvable - saisissez la latitude et la longitude à la main.",
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

  private parseSchedule(value: unknown): ScheduleEntry[] {
    const text = typeof value === 'string' ? value.trim() : '';
    if (!text) return [];

    const entries = text.split(/\s*[·\n]\s*/).filter(Boolean);
    return entries.map((entry) => {
      const match = entry.match(
        /^(?:(.*?)\s*:\s*)?(.*?)\s+(\d{1,2}(?::\d{2}|h\d{0,2})?)\s*[–-]\s*(\d{1,2}(?::\d{2}|h\d{0,2})?)$/i,
      );
      if (!match) return { day: '', start: '', end: '', legacy: entry };
      return {
        day: (match[1] || match[2]).trim(),
        start: this.normalizeScheduleTime(match[3]),
        end: this.normalizeScheduleTime(match[4]),
      };
    });
  }

  private normalizeScheduleTime(value: string): string {
    const match = value.match(/^(\d{1,2})(?::(\d{2})|h(\d{0,2}))?$/i);
    if (!match) return '';
    return `${match[1].padStart(2, '0')}:${(match[2] ?? match[3] ?? '00').padEnd(2, '0')}`;
  }

  private isGoogleMapsUrl(value: string): boolean {
    if (!value.trim()) return true;
    try {
      const url = new URL(value);
      return url.protocol === 'https:' &&
        (url.hostname === 'maps.app.goo.gl' || url.hostname === 'goo.gl' ||
          /^(?:[a-z0-9-]+\.)*google\.(?:com|[a-z]{2,3}(?:\.[a-z]{2})?)$/i.test(url.hostname));
    } catch {
      return false;
    }
  }

  private googleMapsCoordinates(value: string): { latitude: number; longitude: number } | null {
    let decoded = value;
    try { decoded = decodeURIComponent(value); } catch { /* URL could already be decoded. */ }
    const patterns = [
      /@(-?\d{1,2}(?:\.\d+)?),\s*(-?\d{1,3}(?:\.\d+)?)/,
      /!3d(-?\d{1,2}(?:\.\d+)?)!4d(-?\d{1,3}(?:\.\d+)?)/,
      /(?:q|query|destination)=(-?\d{1,2}(?:\.\d+)?)[,%20]+(-?\d{1,3}(?:\.\d+)?)/i,
    ];
    for (const pattern of patterns) {
      const match = decoded.match(pattern);
      if (!match) continue;
      const latitude = Number(match[1]);
      const longitude = Number(match[2]);
      if (Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180) return { latitude, longitude };
    }
    return null;
  }

  private googleMapsSearch(value: string): string {
    try {
      const url = new URL(value);
      for (const key of ['query', 'q', 'destination']) {
        const query = url.searchParams.get(key)?.trim();
        if (query && !this.googleMapsCoordinates(`${key}=${query}`)) return query;
      }
      const place = url.pathname.match(/\/maps\/place\/([^/]+)/i)?.[1];
      return place ? decodeURIComponent(place.replace(/\+/g, ' ')) : '';
    } catch {
      return '';
    }
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
      if (field.type === 'links' || field.type === 'map-link') continue;

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
        case 'schedule': {
          const entries = Array.isArray(draft['opening_hours_entries'])
            ? draft['opening_hours_entries'] as ScheduleEntry[]
            : [];
          const complete = entries
            .filter((entry) => entry.day.trim() && entry.start && entry.end)
            .map((entry) => `${entry.day.trim()} : ${entry.start}–${entry.end}`);
          const legacy = entries
            .filter((entry) => entry.legacy && !entry.day && !entry.start && !entry.end)
            .map((entry) => entry.legacy!.trim());
          payload[field.key] = [...legacy, ...complete].join(' · ') || null;
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
