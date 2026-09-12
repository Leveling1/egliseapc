import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';

import { PublicContentService } from '../../../core/content/public-content.service';
import { FooterComponent } from '../../../core/layout/footer/footer.component';
import { HeaderComponent } from '../../../core/layout/header/header.component';
import { SeoService } from '../../../core/seo/seo.service';
import type { ExtensionPublic } from '../../../core/supabase/database.types';
import { SpecialEventsComponent } from '../../../shared/components/special-events/special-events.component';

/**
 * Coordonnées des extensions, telles que le cpannel les renseigne.
 *
 * La page ne porte aucune donnée en propre : tout vient du module Extensions,
 * et une coordonnée ajoutée ou corrigée là-bas apparaît ici sans
 * redéploiement. Le siège de Kinshasa est une extension comme les autres.
 */
@Component({
  selector: 'app-contact-page',
  standalone: true,
  imports: [HeaderComponent, FooterComponent, SpecialEventsComponent],
  templateUrl: './contact-page.component.html',
  styleUrl: './contact-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactPageComponent implements OnInit {
  private readonly seo = inject(SeoService);
  private readonly content = inject(PublicContentService);

  protected readonly extensions = signal<readonly ExtensionPublic[]>([]);
  protected readonly loading = signal(true);
  protected readonly skeletons = [0, 1, 2];

  protected readonly hasAny = computed(() => this.extensions().length > 0);

  ngOnInit(): void {
    this.seo.apply({
      title: 'Contact | Ambassadeurs Pour Christ (A.P.C)',
      description:
        "Adresses, téléphones et horaires de l'Église Les Ambassadeurs Pour Christ (A.P.C) : le siège de Kinshasa et chacune de ses extensions.",
      path: '/contact',
    });

    void this.load();
  }

  /** Lien d'appel : les espaces gênent certains composeurs, on les retire. */
  protected tel(phone: string): string {
    return `tel:${phone.replace(/\s+/g, '')}`;
  }

  /**
   * Lien WhatsApp : le service attend l'indicatif sans « + » ni espaces.
   * Un numéro saisi « +243 892 211 899 » devient « 243892211899 ».
   */
  protected whatsapp(number: string): string {
    return `https://wa.me/${number.replace(/[^\d]/g, '')}`;
  }

  /** Itinéraire vers les coordonnées relevées par le géocodage du cpannel. */
  protected map(extension: ExtensionPublic): string | null {
    if (extension.latitude === null || extension.longitude === null) return null;
    return `https://www.google.com/maps/dir/?api=1&destination=${extension.latitude},${extension.longitude}`;
  }

  private async load(): Promise<void> {
    this.extensions.set(await this.content.extensions());
    this.loading.set(false);
  }
}
