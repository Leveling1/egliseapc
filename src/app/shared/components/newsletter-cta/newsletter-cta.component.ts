import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-newsletter-cta',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './newsletter-cta.component.html',
  styleUrl: './newsletter-cta.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewsletterCtaComponent {
  readonly overline = input.required<string>();
  readonly title = input.required<string>();
  readonly description = input.required<string>();
  readonly buttonLabel = input("S'inscrire");
  readonly emailPlaceholder = input('votre@email.com');
  readonly titleFontSize = input('40px');
  readonly descriptionFontSize = input('16px');

  protected readonly submitted = signal(false);

  protected readonly email = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.email],
  });

  protected onSubmit(): void {
    if (this.email.invalid) {
      this.email.markAsTouched();
      return;
    }
    this.submitted.set(true);
    this.email.reset();
  }
}
