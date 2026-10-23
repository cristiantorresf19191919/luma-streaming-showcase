import { Injectable, signal } from '@angular/core';
import { analyticsId } from '../../environments/firebase.generated';
declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}
@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  readonly enabled = signal(false);
  readonly configured = /^G-[A-Z0-9]+$/.test(analyticsId);
  constructor() {
    try {
      if (localStorage.getItem('movie:analytics') === 'yes') this.setConsent(true);
    } catch {}
  }
  setConsent(value: boolean) {
    this.enabled.set(value);
    try {
      localStorage.setItem('movie:analytics', value ? 'yes' : 'no');
    } catch {}
    if (value && this.configured && !window.gtag) {
      window.dataLayer = [];
      window.gtag = function () {
        window.dataLayer!.push(arguments);
      };
      window.gtag('js', new Date());
      window.gtag('config', analyticsId, {
        send_page_view: false,
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
      });
      const s = document.createElement('script');
      s.async = true;
      s.src = 'https://www.googletagmanager.com/gtag/js?id=' + analyticsId;
      document.head.append(s);
    }
    if (!value)
      window.gtag?.('consent', 'update', { analytics_storage: 'denied', ad_storage: 'denied' });
    else window.gtag?.('consent', 'update', { analytics_storage: 'granted', ad_storage: 'denied' });
  }
  track(
    name:
      | 'trailer_view'
      | 'discount_request'
      | 'checkout_start'
      | 'purchase_confirmed'
      | 'install_prompt'
      | 'app_installed',
    filmId?: string,
  ) {
    if (this.enabled() && this.configured)
      window.gtag?.('event', name, {
        ...(filmId ? { film_id: filmId } : {}),
        send_to: analyticsId,
      });
  }
}
