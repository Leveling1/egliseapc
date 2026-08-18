import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';

import { HeaderComponent } from '../../../core/layout/header/header.component';
import { FooterComponent } from '../../../core/layout/footer/footer.component';
import { NewsletterCtaComponent } from '../../../shared/components/newsletter-cta/newsletter-cta.component';
import { ArticleCardComponent } from '../ui/article-card/article-card.component';
import { PublicContentService } from '../../../core/content/public-content.service';
import { SupabaseService } from '../../../core/supabase/supabase.service';
import { MEDIA_BUCKET } from '../../../core/supabase/database.types';
import { toArticleView, type ArticleView } from '../data/article-view';
import { SeoService } from '../../../core/seo/seo.service';
import { articleSchema, breadcrumbSchema } from '../../../core/seo/structured-data';

@Component({
  selector: 'app-article-detail-page',
  standalone: true,
  imports: [RouterLink, HeaderComponent, FooterComponent, NewsletterCtaComponent, ArticleCardComponent],
  templateUrl: './article-detail-page.component.html',
  styleUrl: './article-detail-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArticleDetailPageComponent {
  // Populated automatically from the `:slug` route segment (withComponentInputBinding).
  readonly slug = input<string>('');

  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  private readonly seo = inject(SeoService);
  private readonly content = inject(PublicContentService);
  private readonly storage = inject(SupabaseService).client.storage;

  protected readonly article = signal<ArticleView | null>(null);
  protected readonly relatedArticles = signal<readonly ArticleView[]>([]);
  /** Distingue « chargement en cours » de « article inexistant ». */
  protected readonly loaded = signal(false);

  protected readonly readProgress = signal(0);
  protected readonly shareUrl = signal('');
  protected readonly linkCopied = signal(false);

  protected readonly facebookShareUrl = computed(
    () => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(this.shareUrl())}`,
  );

  constructor() {
    const destroyRef = inject(DestroyRef);

    // Runs on every slug change too (not just once), so meta tags stay
    // correct when navigating from one article straight into another via
    // the "related articles" links below — the component instance is
    // reused by the router, so ngOnInit alone wouldn't re-fire here.
    effect(() => {
      const slug = this.slug();
      if (slug) void this.load(slug);
    });

    effect(() => {
      const article = this.article();

      if (!article) {
        this.title.setTitle('Article introuvable | Ambassadeurs Pour Christ (A.P.C)');
        this.seo.removeJsonLd('article');
        this.seo.removeJsonLd('breadcrumb');
        return;
      }

      this.describe(article);
    });

    afterNextRender(() => {
      this.shareUrl.set(window.location.href);

      const articleEl = document.querySelector<HTMLElement>('.apc-article-detail__body');
      let ticking = false;

      const updateProgress = (): void => {
        ticking = false;
        if (!articleEl) {
          return;
        }
        const rect = articleEl.getBoundingClientRect();
        const total = rect.height - window.innerHeight;
        const scrolled = -rect.top;
        const progress = total > 0 ? Math.max(0, Math.min(1, scrolled / total)) : 0;
        this.readProgress.set(progress);
      };

      const onScroll = (): void => {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(updateProgress);
        }
      };

      window.addEventListener('scroll', onScroll, { passive: true });
      updateProgress();

      destroyRef.onDestroy(() => {
        window.removeEventListener('scroll', onScroll);
      });
    });
  }

  protected async copyLink(): Promise<void> {
    await navigator.clipboard.writeText(this.shareUrl());
    this.linkCopied.set(true);
    setTimeout(() => this.linkCopied.set(false), 2000);
  }
  private async load(slug: string): Promise<void> {
    this.loaded.set(false);

    const article = await this.content.articleBySlug(slug);

    if (!article) {
      this.article.set(null);
      this.relatedArticles.set([]);
      this.loaded.set(true);
      return;
    }

    const links = await this.content.linksForArticle(article.id);
    this.article.set(toArticleView(article, links, (path) => this.publicUrl(path)));

    const others = await this.content.articles();
    this.relatedArticles.set(
      others
        .filter((candidate) => candidate.slug !== slug)
        .slice(0, 3)
        .map((candidate) => toArticleView(candidate, [], (path) => this.publicUrl(path))),
    );

    this.loaded.set(true);
  }

  private publicUrl(path: string | null): string | null {
    if (!path) return null;
    return this.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
  }
  /**
   * Balises de partage et données structurées propres à l'article.
   *
   * L'image de partage reprend la couverture réelle : un article relayé sur
   * WhatsApp affiche ainsi son propre visuel, et non celui du site entier.
   */
  private describe(article: ArticleView): void {
    const path = `/blog/${article.slug}`;
    const image = extractImageUrl(article.background);

    this.seo.apply({
      title: `${article.title} | Ambassadeurs Pour Christ (A.P.C)`,
      description: article.excerpt || article.title,
      path,
      image,
      type: 'article',
      publishedTime: article.isoDate,
      author: article.authorName || null,
    });

    this.seo.setJsonLd(
      'article',
      articleSchema({
        title: article.title,
        description: article.excerpt || article.title,
        path,
        image,
        datePublished: article.isoDate,
        author: article.authorName || null,
        section: article.category || null,
      }),
    );

    this.seo.setJsonLd(
      'breadcrumb',
      breadcrumbSchema([
        { name: 'Accueil', path: '/' },
        { name: 'Blog', path: '/blog' },
        { name: article.title, path },
      ]),
    );
  }
}

/**
 * Récupère l'URL d'une valeur CSS `background`.
 * Les couvertures peuvent être une image ou un simple dégradé : seul le
 * premier cas donne une image de partage exploitable.
 */
function extractImageUrl(background: string): string | null {
  const match = /url("?([^")]+)"?)/.exec(background);
  return match ? match[1] : null;
}
