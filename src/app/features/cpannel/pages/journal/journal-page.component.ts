import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Title } from '@angular/platform-browser';

import { MODULE_LABELS, relativeTime } from '../../data/activity-labels';
import {
  ACTIVITY_PAGE_SIZE,
  CpannelActivityService,
  type ActivityEntry,
} from '../../services/cpannel-activity.service';

interface JournalRow extends ActivityEntry {
  readonly moduleLabel: string;
  readonly when: string;
}

/**
 * Journal d'activité complet, en défilement infini.
 *
 * Vingt lignes par page, la suivante demandée dès que la fin de la liste
 * approche - par un observateur d'intersection sur une sentinelle placée
 * sous les lignes. Un bouton « Charger la suite » reste toujours là : c'est
 * lui que l'observateur déclenche, et c'est lui qu'on presse si l'observateur
 * ne se déclenche pas (mouvement réduit, navigateur ancien, lecteur d'écran).
 */
@Component({
  selector: 'app-cpannel-journal-page',
  standalone: true,
  templateUrl: './journal-page.component.html',
  styleUrl: './journal-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CpannelJournalPageComponent {
  private readonly activity = inject(CpannelActivityService);
  private readonly sentinel = viewChild<ElementRef<HTMLElement>>('sentinel');

  protected readonly rows = signal<readonly JournalRow[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  /** Curseur de la page suivante ; null quand tout est lu. */
  protected readonly cursor = signal<number | null>(null);
  protected readonly exhausted = signal(false);

  protected readonly pageSize = ACTIVITY_PAGE_SIZE;

  constructor() {
    inject(Title).setTitle("Journal d'activité - cpannel A.P.C");
    const destroyRef = inject(DestroyRef);

    void this.loadMore();

    afterNextRender(() => {
      const target = this.sentinel()?.nativeElement;
      if (!target || typeof IntersectionObserver === 'undefined') return;

      // Une page d'avance : la suite arrive avant que le lecteur ne bute sur
      // la fin de la liste.
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) void this.loadMore();
        },
        { rootMargin: '0px 0px 60% 0px' },
      );
      observer.observe(target);
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  protected async loadMore(): Promise<void> {
    if (this.loading() || this.exhausted()) return;

    this.loading.set(true);
    this.error.set(null);

    try {
      const page = await this.activity.page(this.cursor());
      const now = Date.now();

      this.rows.update((rows) => [
        ...rows,
        ...page.entries.map((entry) => ({
          ...entry,
          moduleLabel: MODULE_LABELS[entry.module] ?? entry.module,
          when: relativeTime(entry.occurred_at, now),
        })),
      ]);
      this.cursor.set(page.nextCursor);
      if (page.nextCursor === null) this.exhausted.set(true);
    } catch (cause) {
      this.error.set(cause instanceof Error ? cause.message : String(cause));
    } finally {
      this.loading.set(false);
    }
  }

  protected retry(): void {
    void this.loadMore();
  }
}
