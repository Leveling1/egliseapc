import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { CpannelAuthService } from '../../services/cpannel-auth.service';
import { CPANNEL_MODULES } from '../../data/cpannel-modules';

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
  private readonly router = inject(Router);

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
  protected readonly canManageSettings = computed(() => this.auth.can('settings', 'view'));

  protected toggleRail(): void {
    this.railOpen.update((open) => !open);
  }

  protected closeRail(): void {
    this.railOpen.set(false);
  }

  protected async signOut(): Promise<void> {
    await this.auth.signOut();

    // Retour au site public plutôt qu'à la page de connexion : se déconnecter
    // veut dire quitter le back-office, pas s'apprêter à y revenir.
    await this.router.navigateByUrl('/');
  }
}
