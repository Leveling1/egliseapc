import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Title } from '@angular/platform-browser';

import { SupabaseService } from '../../../../core/supabase/supabase.service';
import type {
  ArticleCategory,
  BookStatus,
  LinkType,
} from '../../../../core/supabase/database.types';
import { CpannelAuthService } from '../../services/cpannel-auth.service';

interface ListRow {
  id: string;
  /** Libellé affiché, modifiable. */
  name: string;
  /** Identifiant technique, propre aux types de liens. */
  code?: string;
  position: number;
  is_visible: boolean;
}

type ListKey = 'categories' | 'linkTypes' | 'bookStatuses';

@Component({
  selector: 'app-cpannel-settings-page',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './settings-page.component.html',
  styleUrl: './settings-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CpannelSettingsPageComponent {
  private readonly supabase = inject(SupabaseService).client;
  private readonly auth = inject(CpannelAuthService);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly categories = signal<readonly ListRow[]>([]);
  protected readonly linkTypes = signal<readonly ListRow[]>([]);
  protected readonly bookStatuses = signal<readonly ListRow[]>([]);

  protected readonly newCategory = signal('');
  protected readonly newLinkTypeName = signal('');
  protected readonly newBookStatus = signal('');

  protected readonly canEdit = computed(() => this.auth.can('settings', 'edit'));
  protected readonly canPublish = computed(() => this.auth.can('settings', 'publish'));

  constructor() {
    inject(Title).setTitle('Paramètres — cpannel A.P.C');
    void this.load();
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    const [categories, linkTypes, bookStatuses] = await Promise.all([
      this.supabase
        .from('article_categories')
        .select('*')
        .order('position')
        .order('name')
        .returns<ArticleCategory[]>(),
      this.supabase.from('link_types').select('*').order('position').returns<LinkType[]>(),
      this.supabase
        .from('book_statuses')
        .select('*')
        .order('position')
        .order('name')
        .returns<BookStatus[]>(),
    ]);

    const failure = categories.error ?? linkTypes.error ?? bookStatuses.error;
    if (failure) this.error.set(failure.message);

    this.categories.set(categories.data ?? []);
    this.linkTypes.set(
      (linkTypes.data ?? []).map((type) => ({
        id: type.id,
        name: type.name,
        code: type.code,
        position: type.position,
        is_visible: type.is_visible,
      })),
    );
    this.bookStatuses.set(bookStatuses.data ?? []);
    this.loading.set(false);
  }

  private table(list: ListKey): string {
    switch (list) {
      case 'categories':
        return 'article_categories';
      case 'linkTypes':
        return 'link_types';
      case 'bookStatuses':
        return 'book_statuses';
    }
  }

  // ---------- Création ----------

  protected async addCategory(): Promise<void> {
    const name = this.newCategory().trim();
    if (!name) return;

    const { error } = await this.supabase
      .from('article_categories')
      .insert({ name, position: this.categories().length });

    if (error) {
      this.error.set(this.humanize(error.message));
      return;
    }

    this.newCategory.set('');
    await this.load();
  }

  protected async addBookStatus(): Promise<void> {
    const name = this.newBookStatus().trim();
    if (!name) return;

    const { error } = await this.supabase
      .from('book_statuses')
      .insert({ name, position: this.bookStatuses().length });

    if (error) {
      this.error.set(this.humanize(error.message));
      return;
    }

    this.newBookStatus.set('');
    await this.load();
  }

  protected async addLinkType(): Promise<void> {
    const name = this.newLinkTypeName().trim();
    if (!name) return;

    // Le code est dérivé du nom : c'est un identifiant technique, il n'y a
    // aucune raison de demander à l'administrateur de l'inventer.
    const code = name
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');

    if (!code) {
      this.error.set('Ce nom ne permet pas de générer un identifiant valide.');
      return;
    }

    const { error } = await this.supabase
      .from('link_types')
      .insert({ code, name, position: this.linkTypes().length });

    if (error) {
      this.error.set(this.humanize(error.message));
      return;
    }

    this.newLinkTypeName.set('');
    await this.load();
  }

  // ---------- Modification ----------

  protected async rename(list: ListKey, row: ListRow, name: string): Promise<void> {
    const trimmed = name.trim();
    if (!trimmed || trimmed === row.name) return;

    const { error } = await this.supabase
      .from(this.table(list))
      .update({ name: trimmed })
      .eq('id', row.id);

    if (error) {
      this.error.set(this.humanize(error.message));
      return;
    }

    await this.load();
  }

  protected onRename(list: ListKey, row: ListRow, event: Event): void {
    void this.rename(list, row, (event.target as HTMLInputElement).value);
  }

  /**
   * Masquer plutôt que supprimer, comme partout dans le cpannel : une
   * catégorie retirée reste rattachée aux articles qui l'utilisent, elle
   * cesse simplement d'être proposée à la saisie.
   */
  protected async setVisible(list: ListKey, row: ListRow, isVisible: boolean): Promise<void> {
    this.error.set(null);

    const { error } = await this.supabase
      .from(this.table(list))
      .update({ is_visible: isVisible })
      .eq('id', row.id);

    if (error) {
      this.error.set(this.humanize(error.message));
      return;
    }

    await this.load();
  }

  private humanize(message: string): string {
    if (message.includes('duplicate key') && message.includes('name')) {
      return 'Ce nom existe déjà dans la liste.';
    }
    if (message.includes('duplicate key') && message.includes('code')) {
      return 'Un type de lien portant un nom équivalent existe déjà.';
    }
    if (message.includes('Droit de publication requis')) {
      return 'Vous pouvez modifier ces listes, mais pas changer leur visibilité.';
    }
    if (message.includes('row-level security') || message.includes('permission denied')) {
      return 'Vous n\'avez pas les droits nécessaires pour cette action.';
    }
    return message;
  }
}
