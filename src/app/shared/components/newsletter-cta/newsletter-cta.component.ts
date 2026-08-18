import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

import { NewsletterService } from '../../../core/content/newsletter.service';

@Component({
  selector: 'app-newsletter-cta',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './newsletter-cta.component.html',
  styleUrl: './newsletter-cta.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewsletterCtaComponent {
  private readonly newsletter = inject(NewsletterService);

  readonly overline = input.required<string>();
  readonly title = input.required<string>();
  readonly description = input.required<string>();
  readonly buttonLabel = input("S'inscrire");
  readonly emailPlaceholder = input('votre@email.com');
  readonly titleFontSize = input('40px');
  readonly descriptionFontSize = input('16px');

  /**
   * Section d'origine de l'inscription, enregistrée avec l'adresse : savoir
   * d'où viennent les abonnés indique quelles pages convertissent.
   */
  readonly source = input<string | null>(null);

  protected readonly submitted = signal(false);
  protected readonly pending = signal(false);
  protected readonly failure = signal<string | null>(null);

  protected readonly email = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.email],
  });

  /**
   * Écoute l'événement natif « submit » et non ngSubmit.
   *
   * Ce composant n'importe que ReactiveFormsModule : aucune directive de
   * formulaire ne s'applique donc au <form>, et ngSubmit — qui est une
   * sortie de NgForm — ne se déclenchait jamais. Le navigateur envoyait le
   * formulaire nativement et rechargeait la page, si bien que le message de
   * confirmation ne pouvait pas apparaître.
   */
  protected async onSubmit(event: Event): Promise<void> {
    event.preventDefault();

    if (this.email.invalid) {
      this.email.markAsTouched();
      return;
    }

    this.pending.set(true);
    this.failure.set(null);
    this.email.disable();

    const outcome = await this.newsletter.subscribe(this.email.value, this.source());

    this.pending.set(false);
    this.email.enable();

    if (!outcome.ok) {
      // L'adresse saisie est conservée : la refaire taper après un échec
      // qui ne vient pas de l'utilisateur serait pénible.
      this.failure.set(outcome.message);
      return;
    }

    this.submitted.set(true);
    this.email.reset();
  }
}
