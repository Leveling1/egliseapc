import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';

import { PublicContentService } from '../../../../core/content/public-content.service';
import type { OraclePublic } from '../../../../core/supabase/database.types';

@Component({
  selector: 'app-theme-of-year',
  standalone: true,
  templateUrl: './theme-of-year.component.html',
  styleUrl: './theme-of-year.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemeOfYearComponent {
  private readonly content = inject(PublicContentService);

  /**
   * L'oracle de l'année en cours, et lui seul.
   *
   * Tant qu'il n'existe pas, la section entière disparaît : mieux vaut une
   * section absente qu'un thème périmé présenté comme celui de l'année.
   */
  protected readonly oracle = signal<OraclePublic | null>(null);

  constructor() {
    void this.load();
  }

  private async load(): Promise<void> {
    this.oracle.set(await this.content.currentOracle());
  }
}
