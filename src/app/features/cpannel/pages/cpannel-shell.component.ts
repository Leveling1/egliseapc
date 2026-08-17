import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { CpannelAuthService } from '../services/cpannel-auth.service';
import { CPANNEL_MODULES } from '../data/cpannel-modules';

@Component({
  selector: 'app-cpannel-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './cpannel-shell.component.html',
  styleUrl: './cpannel-shell.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CpannelShellComponent {
  private readonly auth = inject(CpannelAuthService);

  protected readonly firstName = this.auth.displayName;
  protected readonly profile = this.auth.adminProfile;
  protected readonly railOpen = signal(false);

  /**
   * Le rail ne montre que les modules réellement accessibles : un éditeur
   * limité aux articles ne voit pas apparaître des entrées qui le
   * renverraient systématiquement au tableau de bord.
   */
  protected readonly modules = computed(() =>
    CPANNEL_MODULES.filter((config) => this.auth.can(config.module, 'view')),
  );

  protected readonly canManageUsers = computed(() => this.auth.can('users', 'view'));

  protected toggleRail(): void {
    this.railOpen.update((open) => !open);
  }

  protected closeRail(): void {
    this.railOpen.set(false);
  }

  protected signOut(): Promise<void> {
    return this.auth.signOut();
  }
}
