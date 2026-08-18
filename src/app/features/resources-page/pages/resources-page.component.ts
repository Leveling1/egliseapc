import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';

import { SeoService } from '../../../core/seo/seo.service';
import { HeaderComponent } from '../../../core/layout/header/header.component';
import { FooterComponent } from '../../../core/layout/footer/footer.component';
import { NewsletterCtaComponent } from '../../../shared/components/newsletter-cta/newsletter-cta.component';
import { PublicContentService } from '../../../core/content/public-content.service';
import { SupabaseService } from '../../../core/supabase/supabase.service';
import { MEDIA_BUCKET } from '../../../core/supabase/database.types';
import type { BookPublic, MobileAppPublic } from '../../../core/supabase/database.types';
import { ResourcesHeroComponent } from '../ui/resources-hero/resources-hero.component';
import { AppShowcaseComponent } from '../ui/app-showcase/app-showcase.component';
import { BookCardComponent } from '../ui/book-card/book-card.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

/** Légère rotation alternée des couvertures, comme dans la maquette. */
const COVER_ROTATIONS = ['-2deg', '1deg', '-1deg'];

/** Deux rangées de trois sur grand écran : au-delà, la page devient longue. */
const BOOKS_PER_PAGE = 6;

@Component({
  selector: 'app-resources-page',
  standalone: true,
  imports: [
    HeaderComponent,
    FooterComponent,
    NewsletterCtaComponent,
    ResourcesHeroComponent,
    AppShowcaseComponent,
    BookCardComponent,
    PaginationComponent,
  ],
  templateUrl: './resources-page.component.html',
  styleUrl: './resources-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourcesPageComponent implements OnInit {
  private readonly seo = inject(SeoService);
  private readonly content = inject(PublicContentService);
  private readonly storage = inject(SupabaseService).client.storage;
  private readonly router = inject(Router);

  protected readonly books = signal<readonly BookPublic[]>([]);
  protected readonly apps = signal<readonly MobileAppPublic[]>([]);
  protected readonly loaded = signal(false);
  protected readonly currentPage = signal(1);

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.books().length / BOOKS_PER_PAGE)),
  );

  /** La pagination ne s'affiche que s'il y a réellement plusieurs pages. */
  protected readonly showPagination = computed(() => this.totalPages() > 1);

  protected readonly pagedBooks = computed(() => {
    const start = (this.currentPage() - 1) * BOOKS_PER_PAGE;
    return this.books().slice(start, start + BOOKS_PER_PAGE);
  });

  /**
   * Cette page n'existe que si elle a quelque chose à montrer : c'est le
   * contenu qui décide, pas un interrupteur. Sans livre ni application
   * visible, le visiteur est renvoyé à l'accueil plutôt que de tomber sur
   * une page vide, et le lien disparaît du menu et du pied de page.
   */
  protected readonly hasContent = computed(
    () => this.books().length > 0 || this.apps().length > 0,
  );

  constructor() {
    void this.load();
  }

  ngOnInit(): void {
    this.seo.apply({
      title: "Ressources et publications | Ambassadeurs Pour Christ (A.P.C)",
      description:
        "Livres, application mobile et outils des Ambassadeurs Pour Christ (A.P.C) pour grandir dans la foi au quotidien.",
      path: '/ressources',
    });
  }

  protected onPageChange(page: number): void {
    this.currentPage.set(page);
  }

  protected coverUrl(book: BookPublic): string | null {
    if (!book.cover_path) return null;
    return this.storage.from(MEDIA_BUCKET).getPublicUrl(book.cover_path).data.publicUrl;
  }

  /**
   * L'alternance suit la position du livre dans la liste complète : sinon
   * elle repartirait à zéro à chaque page et le rythme visuel se casserait.
   */
  protected rotation(indexInPage: number): string {
    const absolute = (this.currentPage() - 1) * BOOKS_PER_PAGE + indexInPage;
    return COVER_ROTATIONS[absolute % COVER_ROTATIONS.length];
  }

  /** Le premier statut est mis en valeur, les suivants restent discrets. */
  protected badgeVariant(indexInPage: number): 'yellow' | 'light' {
    const absolute = (this.currentPage() - 1) * BOOKS_PER_PAGE + indexInPage;
    return absolute % 2 === 0 ? 'yellow' : 'light';
  }

  private async load(): Promise<void> {
    const [books, apps] = await Promise.all([this.content.books(), this.content.mobileApps()]);

    this.books.set(books);
    this.apps.set(apps);
    this.loaded.set(true);

    if (books.length === 0 && apps.length === 0) {
      void this.router.navigate(['/'], { replaceUrl: true });
    }
  }
}
