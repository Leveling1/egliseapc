import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { Router } from '@angular/router';

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

/** Légère rotation alternée des couvertures, comme dans la maquette. */
const COVER_ROTATIONS = ['-2deg', '1deg', '-1deg'];

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
  ],
  templateUrl: './resources-page.component.html',
  styleUrl: './resources-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourcesPageComponent implements OnInit {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly content = inject(PublicContentService);
  private readonly storage = inject(SupabaseService).client.storage;
  private readonly router = inject(Router);

  protected readonly books = signal<readonly BookPublic[]>([]);
  protected readonly apps = signal<readonly MobileAppPublic[]>([]);
  protected readonly loaded = signal(false);

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
    this.title.setTitle('Nos Ressources | Ambassadeurs Pour Christ (A.P.C)');
    this.meta.updateTag({
      name: 'description',
      content:
        'Application mobile, livres et outils pour grandir dans la foi au quotidien avec Ambassadeurs Pour Christ (A.P.C).',
    });
  }

  protected coverUrl(book: BookPublic): string | null {
    if (!book.cover_path) return null;
    return this.storage.from(MEDIA_BUCKET).getPublicUrl(book.cover_path).data.publicUrl;
  }

  protected rotation(index: number): string {
    return COVER_ROTATIONS[index % COVER_ROTATIONS.length];
  }

  /** Le premier statut est mis en valeur, les suivants restent discrets. */
  protected badgeVariant(index: number): 'yellow' | 'light' {
    return index % 2 === 0 ? 'yellow' : 'light';
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
