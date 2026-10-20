import { Injectable, inject, signal } from '@angular/core';
import { FILMS } from './catalog';
import { I18nService } from './i18n.service';

@Injectable({ providedIn: 'root' })
export class LibraryStore {
  private readonly i18n = inject(I18nService);
  readonly saved = signal<readonly string[]>(this.readSaved());
  readonly notice = signal('');
  private noticeTimer?: ReturnType<typeof setTimeout>;

  toggle(id: string): void {
    const removing = this.saved().includes(id);
    this.saved.update((ids) => (removing ? ids.filter((value) => value !== id) : [...ids, id]));
    try {
      localStorage.setItem('luma:list', JSON.stringify(this.saved()));
      this.announce(removing ? this.i18n.t('toast.removed') : this.i18n.t('toast.added'));
    } catch {
      this.announce(this.i18n.t('toast.storage'));
    }
  }
  announce(message: string): void {
    clearTimeout(this.noticeTimer);
    this.notice.set(message);
    this.noticeTimer = setTimeout(() => this.notice.set(''), 3500);
  }
  private readSaved(): readonly string[] {
    try {
      const raw: unknown = JSON.parse(localStorage.getItem('luma:list') ?? '[]');
      return Array.isArray(raw)
        ? raw.filter(
            (id): id is string => typeof id === 'string' && FILMS.some((film) => film.id === id),
          )
        : [];
    } catch {
      return [];
    }
  }
}
