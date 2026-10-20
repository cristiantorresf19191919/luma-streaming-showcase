import { Injectable, signal } from '@angular/core';
import { DICT, type I18nKey, type Lang } from './i18n.dict';

@Injectable({ providedIn: 'root' })
export class I18nService {
  readonly lang = signal<Lang>(this.readLang());

  constructor() {
    this.applyDocumentLang(this.lang());
  }

  t(key: I18nKey): string {
    const lang = this.lang();
    return DICT[lang][key] ?? DICT.en[key] ?? key;
  }

  toggle(): void {
    const next: Lang = this.lang() === 'en' ? 'es' : 'en';
    this.lang.set(next);
    try {
      localStorage.setItem('luma:lang', next);
    } catch {
      /* ignore */
    }
    this.applyDocumentLang(next);
  }

  private readLang(): Lang {
    try {
      const raw = localStorage.getItem('luma:lang');
      if (raw === 'en' || raw === 'es') return raw;
    } catch {
      /* ignore */
    }
    return 'en';
  }

  private applyDocumentLang(lang: Lang): void {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }
  }
}
