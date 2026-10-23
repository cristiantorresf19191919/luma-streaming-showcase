import { Injectable, inject, signal } from '@angular/core';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import { AnalyticsService } from './analytics.service';
@Injectable({ providedIn: 'root' })
export class CommerceService {
  readonly available = signal(false);
  readonly busy = signal(false);
  readonly error = signal('');
  private auth = inject(AuthService);
  private router = inject(Router);
  private analytics = inject(AnalyticsService);
  constructor() {
    void fetch('/.netlify/functions/commerce-status')
      .then((r) => (r.ok ? r.json() : null))
      .then((c) => this.available.set(c?.checkout === true))
      .catch(() => {});
  }
  async request(path: string, body: object): Promise<any> {
    const user = this.auth.user();
    if (!user) throw new Error('Please sign in / Inicia sesión');
    const r = await fetch('/.netlify/functions/' + path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + (await user.getIdToken()),
      },
      body: JSON.stringify(body),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || 'Please try again / Inténtalo de nuevo');
    return data;
  }
  async checkout(filmId: string): Promise<void> {
    if (!this.auth.user()) {
      await this.router.navigate(['/profile'], { queryParams: { returnTo: '/title/' + filmId } });
      return;
    }
    if (this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    try {
      const data = await this.request('checkout', { filmId });
      this.analytics.track('checkout_start', filmId);
      location.assign(data.url);
    } catch (e) {
      this.error.set((e as Error).message);
      this.busy.set(false);
    }
  }
}
