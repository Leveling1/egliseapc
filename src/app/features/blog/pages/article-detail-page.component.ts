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
import { allArticles, findArticleBySlug } from '../data/blog-articles';

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

  protected readonly article = computed(() => findArticleBySlug(this.slug()));

  protected readonly relatedArticles = computed(() => {
    const current = this.article();
    return allArticles()
      .filter((candidate) => candidate.slug !== current?.slug)
      .slice(0, 3);
  });

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
      const article = this.article();
      if (!article) {
        this.title.setTitle('Article introuvable | Ambassadeurs Pour Christ (A.P.C)');
        return;
      }
      this.title.setTitle(`${article.title} | Ambassadeurs Pour Christ (A.P.C)`);
      this.meta.updateTag({ name: 'description', content: article.excerpt });
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
}
