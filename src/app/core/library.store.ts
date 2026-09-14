import { Injectable, signal } from '@angular/core';
import { FILMS } from './catalog';

@Injectable({ providedIn: 'root' })
export class LibraryStore {
  readonly saved = signal<readonly string[]>(this.readSaved());
  readonly notice = signal('');
  private noticeTimer?: ReturnType<typeof setTimeout>;

  toggle(id: string): void {
    const removing = this.saved().includes(id);
    this.saved.update((ids) => (removing ? ids.filter((value) => value !== id) : [...ids, id]));
    try {
      localStorage.setItem('luma:list', JSON.stringify(this.saved()));
      this.announce(removing ? 'Removed from your list' : 'Added to your list');
    } catch {
      this.announce('List updated for this visit. Device storage is unavailable.');
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
