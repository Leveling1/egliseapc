import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';

import { SupabaseService } from '../../../../core/supabase/supabase.service';
import { MEDIA_BUCKET, type MobileAppPublic } from '../../../../core/supabase/database.types';

@Component({
  selector: 'app-app-showcase',
  standalone: true,
  templateUrl: './app-showcase.component.html',
  styleUrl: './app-showcase.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShowcaseComponent {
  private readonly storage = inject(SupabaseService).client.storage;

  readonly app = input.required<MobileAppPublic>();

  protected readonly screenshots = computed(() =>
    this.app().screenshot_paths.map(
      (path) => this.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl,
    ),
  );

  /**
   * Un bouton de téléchargement n'apparaît que si son lien existe vraiment.
   *
   * La page annonçait auparavant une application « Disponible maintenant »
   * avec deux boutons inertes, pour une application qui n'existait pas.
   * Promettre un téléchargement impossible dessert l'église, donc l'absence
   * de lien vaut absence de bouton.
   */
  protected readonly hasStoreLinks = computed(
    () => Boolean(this.app().ios_url) || Boolean(this.app().android_url),
  );
}
