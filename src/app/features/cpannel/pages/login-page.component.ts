import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';

import { CpannelAuthService } from '../services/cpannel-auth.service';

@Component({
  selector: 'app-cpannel-login-page',
  standalone: true,
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CpannelLoginPageComponent {
  private readonly auth = inject(CpannelAuthService);

  protected readonly pending = signal(false);
  protected readonly error = signal<string | null>(null);

  /**
   * Se connecter avec Google ne suffit pas à entrer : si le compte n'est pas
   * habilité, on le dit franchement plutôt que de renvoyer en boucle sur
   * cette page, ce qui laisserait croire à un bug.
   */
  protected readonly rejected = this.auth.isAuthenticatedButRejected;

  protected async signIn(): Promise<void> {
    this.pending.set(true);
    this.error.set(null);

    const { error } = await this.auth.signInWithGoogle();

    if (error) {
      this.error.set(error);
      this.pending.set(false);
    }
    // Succès : le navigateur partant vers Google, on laisse `pending` actif.
  }

  protected signOut(): Promise<void> {
    return this.auth.signOut();
  }

  constructor() {
    inject(Title).setTitle('Connexion — cpannel A.P.C');
  }
}
