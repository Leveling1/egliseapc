import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';

import { PublicContentService } from '../../../../core/content/public-content.service';
import {
  sortProgrammes,
  toProgrammeRow,
  type ProgrammeRow,
} from '../../../../core/content/programme-format';
import type { OraclePublic } from '../../../../core/supabase/database.types';

@Component({
  selector: 'app-programs',
  standalone: true,
  templateUrl: './programs.component.html',
  styleUrl: './programs.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgramsComponent {
  private readonly content = inject(PublicContentService);

  protected readonly schedule = signal<readonly ProgrammeRow[]>([]);

  /**
   * Oracle de l'année en cours uniquement.
   *
   * Si l'année n'a pas encore le sien, le bloc disparaît : afficher celui
   * d'une année passée sous l'intitulé « Oracle 2026 » serait faux.
   */
  protected readonly oracle = signal<OraclePublic | null>(null);

  constructor() {
    void this.load();
  }

  /**
   * Fond de chaque ligne : le programme mis en avant prend la couleur de la
   * charte, les autres alternent deux voiles très légers. C'est une décision
   * d'affichage, elle n'a pas à être stockée en base.
   */
  protected background(row: ProgrammeRow, index: number): string {
    if (row.featured) return 'linear-gradient(135deg,#1C1C8C,#1C1C8C)';
    return index % 2 === 0 ? 'rgba(255,255,255,.08)' : 'rgba(255,255,255,.02)';
  }

  protected readonly oracleTitle = computed(() => {
    const oracle = this.oracle();
    return oracle ? `Oracle ${oracle.year} — ${oracle.title}` : '';
  });

  private async load(): Promise<void> {
    const [programmes, oracle] = await Promise.all([
      this.content.programmes(),
      this.content.currentOracle(),
    ]);

    this.schedule.set(sortProgrammes(programmes.map(toProgrammeRow)));
    this.oracle.set(oracle);
  }
}
