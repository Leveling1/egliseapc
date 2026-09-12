import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';

import { CpannelAuthService } from '../../services/cpannel-auth.service';
import { CpannelDataService } from '../../services/cpannel-data.service';
import { CPANNEL_MODULES, type ModuleConfig } from '../../data/cpannel-modules';
import { MODULE_LABELS, relativeTime } from '../../data/activity-labels';
import type { PannelModule } from '../../../../core/supabase/database.types';

interface ModuleStat {
  readonly config: ModuleConfig;
  readonly total: number;
  readonly visible: number;
}

interface ActivityItem {
  readonly id: number;
  readonly action: string;
  readonly module: PannelModule;
  readonly author: string | null;
  readonly when: string;
}

@Component({
  selector: 'app-cpannel-dashboard-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CpannelDashboardPageComponent {
  private readonly auth = inject(CpannelAuthService);
  private readonly data = inject(CpannelDataService);

  protected readonly profile = this.auth.adminProfile;
  protected readonly firstName = this.auth.displayName;
  protected readonly isSuperAdmin = this.auth.isSuperAdmin;

  protected readonly loading = signal(true);
  protected readonly stats = signal<readonly ModuleStat[]>([]);
  protected readonly activity = signal<readonly ActivityItem[]>([]);

  /**
   * Part des contenus effectivement en ligne. La règle du soft delete rend
   * cette mesure utile : ce qui a été « supprimé » reste en base, donc
   * l'écart entre total et visible dit combien de contenus sont retirés.
   */
  protected readonly visibleRatio = computed(() => {
    const rows = this.stats();
    const total = rows.reduce((sum, stat) => sum + stat.total, 0);
    if (total === 0) return 0;
    const visible = rows.reduce((sum, stat) => sum + stat.visible, 0);
    return Math.round((visible / total) * 100);
  });

  protected readonly hiddenCount = computed(() =>
    this.stats().reduce((sum, stat) => sum + (stat.total - stat.visible), 0),
  );

  protected readonly moduleLabels = MODULE_LABELS;

  constructor() {
    inject(Title).setTitle('Tableau de bord - cpannel A.P.C');
    void this.load();
  }

  private async load(): Promise<void> {
    const visible = CPANNEL_MODULES.filter((config) =>
      this.auth.can(config.module, 'view'),
    );

    const [counts, activity] = await Promise.all([
      Promise.all(
        visible.map(async (config) => ({
          config,
          ...(await this.data.counts(config)),
        })),
      ),
      // Trois lignes seulement : le tableau de bord montre le dernier
      // mouvement, le journal (page dédiée) montre tout.
      this.data.recentActivity(3),
    ]);

    this.stats.set(counts);
    this.activity.set(
      activity.map((entry) => ({
        id: entry.id,
        action: entry.action,
        module: entry.module,
        author: entry.author,
        when: relativeTime(entry.occurred_at),
      })),
    );
    this.loading.set(false);
  }
}
