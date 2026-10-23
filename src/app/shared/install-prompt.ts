import { Component, inject, signal, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { I18nService } from '../core/i18n.service';
import { AnalyticsService } from '../core/analytics.service';
type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};
@Component({
  selector: 'luma-install-prompt',
  template: ` @if (visible()) {
    <aside class="install-nudge" aria-label="Install movie">
      <button
        class="nudge-close"
        (click)="dismiss()"
        [attr.aria-label]="text('Dismiss installation prompt', 'Cerrar sugerencia de instalación')"
      >
        ×</button
      ><img src="/icons/icon-192.png" width="48" height="48" alt="" />
      <div>
        <span class="section-kicker">{{
          text('YOUR CINEMA, ONE TAP AWAY', 'TU CINE, A UN TOQUE')
        }}</span>
        <h2>{{ text('Make yourself at home.', 'Hazla parte de tu día.') }}</h2>
        <p>{{ text('Keep movie on your Home Screen.', 'Lleva movie a tu pantalla de inicio.') }}</p>
        <button class="button primary" (click)="install()">
          {{ text('Add to Home Screen', 'Añadir a pantalla de inicio') }}
        </button>
        @if (help()) {
          <ol>
            <li>
              {{
                text(
                  'Open this website in Safari on iPhone.',
                  'Abre esta web en Safari en tu iPhone.'
                )
              }}
            </li>
            <li>
              {{
                text(
                  'Tap Share, then Add to Home Screen.',
                  'Toca Compartir y Añadir a pantalla de inicio.'
                )
              }}
            </li>
            <li>
              {{
                text(
                  'Enable Open as Web App and tap Add.',
                  'Activa Abrir como app web y toca Añadir.'
                )
              }}
            </li>
          </ol>
          <p class="muted">
            {{
              text(
                'Other browsers: choose Install app from the browser menu. Videos and sync need a connection.',
                'Otros navegadores: elige Instalar aplicación en el menú. Vídeos y sincronización requieren conexión.'
              )
            }}
          </p>
        }
      </div>
    </aside>
  }`,
})
export class InstallPrompt implements OnDestroy {
  readonly visible = signal(false);
  readonly help = signal(false);
  private event?: InstallEvent;
  private visits = new Set([location.pathname]);
  private i18n = inject(I18nService);
  private analytics = inject(AnalyticsService);
  private router = inject(Router);
  private timer = setTimeout(() => {
    this.elapsed = true;
    if (this.visits.size >= 2) this.show();
  }, 45000);
  private elapsed = false;

  private subscription = this.router.events.subscribe((e) => {
    if (e instanceof NavigationEnd) {
      this.visits.add(e.urlAfterRedirects.split('?')[0].split('#')[0]);
      if (e.urlAfterRedirects.startsWith('/watch') || e.urlAfterRedirects.startsWith('/rental'))
        this.visible.set(false);
      if (this.elapsed && this.visits.size >= 2) this.show();
    }
  });
  private capture = (e: Event) => {
    e.preventDefault();
    this.event = e as InstallEvent;
  };
  private installed = () => {
    this.visible.set(false);
    this.analytics.track('app_installed');
  };
  constructor() {
    window.addEventListener('beforeinstallprompt', this.capture);
    window.addEventListener('appinstalled', this.installed);
  }
  text(en: string, es: string) {
    return this.i18n.lang() === 'en' ? en : es;
  }
  private show() {
    if (
      matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone ||
      this.router.url.startsWith('/watch') ||
      this.router.url.startsWith('/rental') ||
      document.querySelector('dialog[open]')
    )
      return;
    try {
      if (Date.now() - Number(localStorage.getItem('movie:install-dismissed') || 0) < 7 * 86400000)
        return;
    } catch {}
    this.visible.set(true);
    this.analytics.track('install_prompt');
  }
  dismiss() {
    this.visible.set(false);
    try {
      localStorage.setItem('movie:install-dismissed', String(Date.now()));
    } catch {}
  }
  async install() {
    if (this.event) {
      await this.event.prompt();
      const choice = await this.event.userChoice;
      if (choice.outcome === 'accepted') this.visible.set(false);
      this.event = undefined;
    } else this.help.set(true);
  }
  ngOnDestroy() {
    clearTimeout(this.timer);
    this.subscription.unsubscribe();
    window.removeEventListener('beforeinstallprompt', this.capture);
    window.removeEventListener('appinstalled', this.installed);
  }
}
