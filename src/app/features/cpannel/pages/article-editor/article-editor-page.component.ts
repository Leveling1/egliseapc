import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Title } from '@angular/platform-browser';

import { SupabaseService } from '../../../../core/supabase/supabase.service';
import { resolveCoverUrl } from '../../../../core/media/link-media';
import type {
  Article,
  ArticleCategory,
  ContentLink,
  LinkType,
} from '../../../../core/supabase/database.types';
import { CpannelAuthService } from '../../services/cpannel-auth.service';
import { CpannelDataService } from '../../services/cpannel-data.service';
import { ArticleEditorComponent } from '../../ui/article-editor/article-editor.component';
import { CpannelImageFieldComponent } from '../../ui/image-field/image-field.component';
import { CpannelLinkListComponent, type LinkDraft } from '../../ui/link-list/link-list.component';

@Component({
  selector: 'app-cpannel-article-editor-page',
  standalone: true,
  imports: [
    FormsModule,
    ArticleEditorComponent,
    CpannelImageFieldComponent,
    CpannelLinkListComponent,
  ],
  templateUrl: './article-editor-page.component.html',
  styleUrl: './article-editor-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CpannelArticleEditorPageComponent {
  private readonly supabase = inject(SupabaseService).client;
  private readonly auth = inject(CpannelAuthService);
  private readonly data = inject(CpannelDataService);
  private readonly router = inject(Router);
  private readonly titleService = inject(Title);

  /** Identifiant de l'article à modifier ; absent pour une création. */
  readonly id = input<string>('');

  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly savedAt = signal<string | null>(null);
  protected readonly panelOpen = signal(false);

  protected readonly categories = signal<readonly ArticleCategory[]>([]);
  protected readonly linkTypes = signal<readonly LinkType[]>([]);

  protected readonly title = signal('');
  protected readonly slug = signal('');
  protected readonly categoryId = signal('');
  protected readonly excerpt = signal('');
  protected readonly authorName = signal('');
  protected readonly authorInitials = signal('');
  protected readonly coverPath = signal('');
  protected readonly publishedAt = signal('');
  protected readonly contentHtml = signal('');
  protected readonly contentText = signal<string[]>([]);
  protected readonly links = signal<LinkDraft[]>([]);
  protected readonly isVisible = signal(false);
  protected readonly isFeatured = signal(false);

  protected readonly initialHtml = signal('');
  private readonly existingLinkIds = signal<readonly string[]>([]);

  /**
   * Le slug et le chapô sont déduits automatiquement, mais dès que le
   * rédacteur y touche on cesse de les écraser : une valeur saisie à la main
   * ne doit jamais être remplacée par une génération.
   */
  private slugTouched = false;
  private excerptTouched = false;

  protected readonly canPublish = computed(() => this.auth.can('articles', 'publish'));

  /**
   * Ce que verra le site : l'image envoyée, ou à défaut la miniature de la
   * première vidéo YouTube jointe.
   */
  protected readonly effectiveCover = computed(() =>
    resolveCoverUrl(
      this.data.publicImageUrl(this.coverPath() || null),
      this.links().map((link) => ({ url: link.url })),
    ),
  );

  protected readonly coverIsFromVideo = computed(
    () => !this.coverPath() && this.effectiveCover() !== null,
  );

  protected readonly imageUploader = (file: File): Promise<string> =>
    this.data.uploadImage(file).then((path) => this.data.publicImageUrl(path) ?? '');

  constructor() {
    effect(() => {
      const id = this.id();
      this.titleService.setTitle(id ? 'Modifier un article — cpannel' : 'Nouvel article — cpannel');
      void this.load(id);
    });
  }

  private async load(id: string): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    const [categories, linkTypes] = await Promise.all([
      this.supabase
        .from('article_categories')
        .select('*')
        .order('position')
        .order('name')
        .returns<ArticleCategory[]>(),
      this.supabase
        .from('link_types')
        .select('*')
        .order('position')
        .returns<LinkType[]>(),
    ]);

    this.categories.set(categories.data ?? []);
    this.linkTypes.set(linkTypes.data ?? []);

    if (!id) {
      this.authorName.set(this.auth.adminProfile()?.full_name ?? '');
      this.loading.set(false);
      return;
    }

    const { data: article, error } = await this.supabase
      .from('articles')
      .select('*')
      .eq('id', id)
      .maybeSingle<Article>();

    if (error || !article) {
      this.error.set(error?.message ?? 'Article introuvable.');
      this.loading.set(false);
      return;
    }

    this.title.set(article.title);
    this.slug.set(article.slug);
    this.categoryId.set(article.category_id ?? '');
    this.excerpt.set(article.excerpt ?? '');
    this.authorName.set(article.author_name ?? '');
    this.authorInitials.set(article.author_initials ?? '');
    this.coverPath.set(article.cover_path ?? '');
    this.publishedAt.set(article.published_at ?? '');
    this.contentHtml.set(article.content_html ?? '');
    this.initialHtml.set(article.content_html ?? this.paragraphsToHtml(article.content));
    this.isVisible.set(article.is_visible);
    this.isFeatured.set(article.is_featured);

    // Un article déjà enregistré a ses valeurs propres : on ne les régénère pas.
    this.slugTouched = true;
    this.excerptTouched = Boolean(article.excerpt);

    const { data: existing } = await this.supabase
      .from('content_links')
      .select('*')
      .eq('article_id', id)
      .order('position')
      .returns<ContentLink[]>();

    const rows = existing ?? [];
    this.links.set(
      rows.map((row) => ({
        id: row.id,
        link_type_id: row.link_type_id,
        url: row.url,
        label: row.label ?? '',
      })),
    );
    this.existingLinkIds.set(rows.map((row) => row.id));

    this.loading.set(false);
  }

  // ---------- Saisie ----------

  protected onTitle(value: string): void {
    this.title.set(value);
    if (!this.slugTouched) this.slug.set(slugify(value));
  }

  protected onSlug(value: string): void {
    this.slugTouched = true;
    this.slug.set(slugify(value));
  }

  protected onExcerpt(value: string): void {
    this.excerptTouched = true;
    this.excerpt.set(value);
  }

  protected onContentHtml(html: string): void {
    this.contentHtml.set(html);
  }

  protected onContentText(paragraphs: string[]): void {
    this.contentText.set(paragraphs);
    if (!this.excerptTouched) this.excerpt.set(buildExcerpt(paragraphs));
  }

  protected onLinks(links: LinkDraft[]): void {
    this.links.set(links);
  }

  protected regenerateExcerpt(): void {
    this.excerptTouched = false;
    this.excerpt.set(buildExcerpt(this.contentText()));
  }

  protected toggleFeatured(): void {
    this.isFeatured.update((featured) => !featured);
  }

  protected togglePanel(): void {
    this.panelOpen.update((open) => !open);
  }

  protected close(): void {
    void this.router.navigate(['/cpannel', 'articles']);
  }

  // ---------- Enregistrement ----------

  protected async save(publish: boolean | null = null): Promise<void> {
    if (!this.title().trim()) {
      this.error.set('Donnez un titre à votre article avant d\'enregistrer.');
      this.panelOpen.set(true);
      return;
    }
    if (!this.slug().trim()) {
      this.error.set('L\'adresse (slug) ne peut pas être vide.');
      this.panelOpen.set(true);
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    const payload: Record<string, unknown> = {
      title: this.title().trim(),
      slug: this.slug().trim(),
      category_id: this.categoryId() || null,
      excerpt: this.excerpt().trim() || null,
      content_html: this.contentHtml() || null,
      content: this.contentText(),
      author_name: this.authorName().trim() || null,
      author_initials: this.authorInitials().trim() || null,
      cover_path: this.coverPath() || null,
      published_at: this.publishedAt() || null,
      is_featured: this.isFeatured(),
      updated_by: this.auth.adminProfile()?.id ?? null,
    };

    // La date de publication est posée en base au moment de la mise en ligne :
    // on ne l'envoie pas nous-mêmes pour éviter deux sources de vérité.
    if (publish !== null) payload['is_visible'] = publish;

    try {
      const id = this.id();
      const { data, error } = id
        ? await this.supabase.from('articles').update(payload).eq('id', id).select().single()
        : await this.supabase.from('articles').insert(payload).select().single();

      if (error) throw new Error(this.humanize(error.message));

      const saved = data as Article;
      await this.syncLinks(saved.id);

      this.isVisible.set(saved.is_visible);
      this.isFeatured.set(saved.is_featured);
      this.publishedAt.set(saved.published_at ?? '');
      this.savedAt.set(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));

      if (!id) {
        // Passe en mode modification pour que les enregistrements suivants
        // mettent à jour l'article au lieu d'en créer un second.
        void this.router.navigate(['/cpannel', 'articles', saved.id], { replaceUrl: true });
      }
    } catch (cause) {
      this.error.set(cause instanceof Error ? cause.message : String(cause));
    } finally {
      this.saving.set(false);
    }
  }

  /**
   * Aligne les liens enregistrés sur ceux du formulaire.
   *
   * Les liens retirés sont réellement supprimés : ce ne sont pas des contenus
   * mais des attributs d'un contenu, et un lien retiré d'un formulaire doit
   * disparaître. La règle du soft delete continue de protéger les articles
   * eux-mêmes.
   */
  private async syncLinks(articleId: string): Promise<void> {
    const current = this.links().filter((link) => link.url.trim());
    const keptIds = current.map((link) => link.id).filter(Boolean) as string[];
    const removed = this.existingLinkIds().filter((id) => !keptIds.includes(id));

    if (removed.length) {
      await this.supabase.from('content_links').delete().in('id', removed);
    }

    for (const [index, link] of current.entries()) {
      const row = {
        article_id: articleId,
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

    const { data } = await this.supabase
      .from('content_links')
      .select('id, link_type_id, url, label, position')
      .eq('article_id', articleId)
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

  private paragraphsToHtml(paragraphs: readonly string[] | null): string {
    if (!paragraphs?.length) return '';
    return paragraphs.map((text) => `<p>${escapeHtml(text)}</p>`).join('');
  }

  private humanize(message: string): string {
    if (message.includes('duplicate key') && message.includes('slug')) {
      return 'Cette adresse (slug) est déjà utilisée par un autre article.';
    }
    if (message.includes('Droit de publication requis')) {
      return 'Vous pouvez enregistrer cet article, mais pas le publier.';
    }
    if (message.includes('articles_slug_format')) {
      return 'L\'adresse ne peut contenir que des minuscules, des chiffres et des tirets.';
    }
    if (message.includes('row-level security') || message.includes('permission denied')) {
      return 'Vous n\'avez pas les droits nécessaires pour cette action.';
    }
    return message;
  }
}

/** Titre → adresse lisible : sans accents, en minuscules, mots séparés par des tirets. */
function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/**
 * Chapô déduit du contenu : le premier paragraphe, coupé sur un mot entier
 * pour ne pas trancher au milieu.
 */
function buildExcerpt(paragraphs: readonly string[], limit = 200): string {
  const first = paragraphs[0] ?? '';
  if (first.length <= limit) return first;

  const cut = first.slice(0, limit);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > 60 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
