import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MembershipService } from '../core/membership.service';
import { I18nService } from '../core/i18n.service';
@Component({
  selector: 'luma-membership',
  imports: [FormsModule],
  templateUrl: './membership.html',
  styleUrl: './membership.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Membership {
  readonly membership = inject(MembershipService);
  readonly i18n = inject(I18nService);
  readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  readonly plan = signal<'night' | 'club'>('club');
  readonly preview = signal(false);
  readonly signupOpened = signal(false);
  readonly submitted = signal(false);
  readonly busy = signal(false);
  readonly error = signal('');
  email = '';
  consent = false;
  honeypot = '';
  private previousFocus?: HTMLElement;
  constructor() {
    effect((cleanup) => {
      if (!this.membership.opened()) return;
      this.previousFocus = document.activeElement as HTMLElement;
      this.dialog().nativeElement.showModal();
      this.dialog().nativeElement.scrollTop = 0;
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      cleanup(() => {
        document.body.style.overflow = previousOverflow;
        this.dialog().nativeElement.close();
        this.previousFocus?.focus();
      });
    });
  }
  text(en: string, es: string): string {
    return this.i18n.lang() === 'en' ? en : es;
  }
  close(): void {
    this.membership.opened.set(false);
  }
  backdrop(event: MouseEvent): void {
    if (event.target !== this.dialog().nativeElement) return;
    const rect = this.dialog().nativeElement.getBoundingClientRect();
    if (
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    )
      this.close();
  }
  async submit(): Promise<void> {
    if (this.busy() || !this.consent) return;
    this.busy.set(true);
    this.error.set('');
    try {
      const response = await fetch('/__forms.html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          'form-name': 'front-row',
          email: this.email.trim(),
          plan: this.plan(),
          consent: 'Launch offer and invitation',
          'bot-field': this.honeypot,
        }),
      });
      if (!response.ok) throw new Error('submission');
      this.submitted.set(true);
      this.email = '';
    } catch {
      this.error.set(
        this.text(
          'We couldn’t save your request. Please check your connection and try again.',
          'No pudimos guardar tu solicitud. Revisa tu conexión e inténtalo de nuevo.',
        ),
      );
    } finally {
      this.busy.set(false);
    }
  }
}
