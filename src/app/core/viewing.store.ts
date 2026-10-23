import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { AuthService } from './auth.service';
export interface Progress {
  filmId: string;
  mode: 'trailer' | 'film';
  position: number;
  duration: number;
  updatedAt: number;
}
export interface Purchase {
  id: string;
  filmId: string;
  purchasedAt: number;
  startedAt?: number;
  expiresAt?: number;
  receiptUrl?: string;
  status: string;
}
@Injectable({ providedIn: 'root' })
export class ViewingStore {
  readonly auth = inject(AuthService);
  readonly progress = signal<Record<string, Progress>>({});
  readonly purchases = signal<Purchase[]>([]);
  readonly ready = signal(false);
  readonly error = signal(false);
  readonly purchasesReady = signal(false);
  readonly continuing = computed(() =>
    Object.values(this.progress())
      .filter((p) => p.position > 2 && p.position < p.duration - Math.min(3, p.duration * 0.1))
      .filter(
        (p) =>
          p.mode === 'trailer' ||
          this.purchases().some(
            (b) =>
              b.filmId === p.filmId &&
              b.status === 'paid' &&
              (!b.expiresAt || b.expiresAt > Date.now()),
          ),
      )
      .sort((a, b) => b.updatedAt - a.updatedAt),
  );
  private writer?: (key: string, value: Progress) => Promise<void>;
  constructor() {
    effect((cleanup) => {
      const uid = this.auth.user()?.uid;
      const authReady = this.auth.ready();
      this.writer = undefined;
      this.progress.set({});
      this.purchases.set([]);
      this.purchasesReady.set(false);
      this.ready.set(false);
      this.error.set(false);
      let stopped = false;
      const unsub: (() => void)[] = [];
      cleanup(() => {
        stopped = true;
        unsub.forEach((fn) => fn());
      });
      if (!authReady) return;
      if (!uid) {
        try {
          const data = JSON.parse(localStorage.getItem('movie:progress:guest') || '{}');
          if (data && typeof data === 'object' && !Array.isArray(data))
            this.progress.set(
              Object.fromEntries(
                Object.entries(data as Record<string, Progress>).filter(
                  ([key, p]) =>
                    p &&
                    ['invisibles', 'dune'].includes(p.filmId) &&
                    ['trailer', 'film'].includes(p.mode) &&
                    key === p.filmId + '-' + p.mode &&
                    Number.isFinite(p.position) &&
                    Number.isFinite(p.duration) &&
                    Number.isFinite(p.updatedAt) &&
                    p.position >= 0 &&
                    p.position <= p.duration &&
                    p.duration > 0 &&
                    p.duration < 86400,
                ),
              ),
            );
        } catch {}
        this.ready.set(true);
        this.purchasesReady.set(true);
        return;
      }
      void import('firebase/firestore')
        .then((s) => {
          if (stopped) return;
          const db = s.getFirestore();
          const ref = s.collection(db, 'users', uid, 'progress');
          unsub.push(
            s.onSnapshot(
              ref,
              (snap) => {
                if (stopped) return;
                this.progress.set(
                  Object.fromEntries(snap.docs.map((d) => [d.id, d.data() as Progress])),
                );
                this.ready.set(true);
              },
              () => {
                if (!stopped) {
                  this.error.set(true);
                  this.ready.set(true);
                }
              },
            ),
          );
          unsub.push(
            s.onSnapshot(
              s.collection(db, 'users', uid, 'purchases'),
              (snap) => {
                if (!stopped) {
                  this.purchases.set(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Purchase));
                  this.purchasesReady.set(true);
                }
              },
              () => {
                if (!stopped) {
                  this.error.set(true);
                  this.purchasesReady.set(true);
                }
              },
            ),
          );
          this.writer = (key, value) => s.setDoc(s.doc(ref, key), value);
        })
        .catch(() => {
          if (!stopped) {
            this.error.set(true);
            this.ready.set(true);
          }
        });
    });
  }
  save(
    filmId: string,
    mode: 'trailer' | 'film',
    position: number,
    duration: number,
    owner: string | null,
  ): void {
    if (
      !this.ready() ||
      (this.auth.user()?.uid ?? null) !== owner ||
      !Number.isFinite(position) ||
      !Number.isFinite(duration) ||
      duration <= 0
    )
      return;
    const key = `${filmId}-${mode}`;
    const value = {
      filmId,
      mode,
      position: Math.min(Math.max(position, 0), duration),
      duration,
      updatedAt: Date.now(),
    };
    this.progress.update((p) => ({ ...p, [key]: value }));
    if (owner) {
      void this.writer?.(key, value).catch(() => {
        if ((this.auth.user()?.uid ?? null) === owner) this.error.set(true);
      });
    } else
      try {
        localStorage.setItem('movie:progress:guest', JSON.stringify(this.progress()));
      } catch {}
  }
}
