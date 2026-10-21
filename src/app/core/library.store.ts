import { Injectable, computed, effect, inject, signal } from '@angular/core';
import type { CollectionReference, DocumentData } from 'firebase/firestore';
import { AuthService } from './auth.service';
import { FILMS } from './catalog';
import { I18nService } from './i18n.service';

type FirestoreSdk = typeof import('firebase/firestore');
@Injectable({ providedIn: 'root' })
export class LibraryStore {
  private readonly i18n = inject(I18nService);
  private readonly auth = inject(AuthService);
  private readonly uid = computed(() => this.auth.user()?.uid ?? null);
  private session?: {
    uid: string;
    sdk: FirestoreSdk;
    list: CollectionReference<DocumentData>;
    ready: boolean;
  };
  readonly saved = signal<readonly string[]>(this.readSaved('luma:list'));
  readonly status = signal<'local' | 'loading' | 'syncing' | 'synced' | 'offline' | 'error'>(
    'local',
  );
  readonly statusText = computed(() => {
    const labels = {
      local: [
        'Saved on this device · Sign in to sync',
        'Guardado en este dispositivo · Entra para sincronizar',
      ],
      loading: ['Connecting your list…', 'Conectando tu lista…'],
      syncing: [
        'Saving your changes… Keep this page open.',
        'Guardando cambios… Mantén esta página abierta.',
      ],
      synced: ['Synced across your devices', 'Sincronizado entre tus dispositivos'],
      offline: [
        'Waiting for connection · Changes sync when you reconnect',
        'Esperando conexión · Los cambios se sincronizarán al volver',
      ],
      error: [
        'Couldn’t sync your list. Reload to try again.',
        'No pudimos sincronizar tu lista. Recarga para reintentar.',
      ],
    };
    return labels[this.status()][this.i18n.lang() === 'en' ? 0 : 1];
  });
  private readonly loaded = signal(false);
  readonly canToggle = computed(() => this.auth.ready() && (!this.uid() || this.loaded()));
  readonly notice = signal('');
  private noticeTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    effect((cleanup) => {
      const uid = this.uid();
      this.session = undefined;
      this.loaded.set(false);
      this.saved.set(uid ? [] : this.readSaved('luma:list'));
      this.status.set(uid ? 'loading' : 'local');
      if (!uid) return;
      let cancelled = false;
      let unsubscribe: (() => void) | undefined;
      cleanup(() => {
        cancelled = true;
        unsubscribe?.();
      });
      void (async () => {
        try {
          const sdk = await import('firebase/firestore');
          if (cancelled) return;
          const list = sdk.collection(sdk.getFirestore(), 'users', uid, 'watchlist');
          const session = { uid, sdk, list, ready: false };
          this.session = session;
          // Only migrate the legacy list for this account; never import a shared guest list.
          const legacyKey = `luma:list:${uid}`;
          const legacy = this.readSaved(legacyKey);
          if (legacy.length) {
            const batch = sdk.writeBatch(sdk.getFirestore());
            for (const id of legacy) batch.set(sdk.doc(list, id), { saved: true });
            await batch.commit();
            try {
              localStorage.removeItem(legacyKey);
            } catch {
              /* Storage may be disabled. */
            }
          }
          if (cancelled) return;
          unsubscribe = sdk.onSnapshot(
            list,
            { includeMetadataChanges: true },
            (snapshot) => {
              if (cancelled) return;
              if (!snapshot.metadata.fromCache) {
                session.ready = true;
                this.loaded.set(true);
              }
              this.saved.set(
                snapshot.docs
                  .map((entry) => entry.id)
                  .filter((id) => FILMS.some((film) => film.id === id)),
              );
              this.status.set(
                snapshot.metadata.hasPendingWrites
                  ? 'syncing'
                  : snapshot.metadata.fromCache
                    ? 'offline'
                    : 'synced',
              );
            },
            () => {
              if (!cancelled) {
                session.ready = false;
                this.loaded.set(false);
                this.status.set('error');
              }
            },
          );
        } catch {
          if (!cancelled) this.status.set('error');
        }
      })();
    });
  }
  toggle(id: string): void {
    if (!this.canToggle()) {
      this.announce(this.statusText());
      return;
    }
    if (!FILMS.some((film) => film.id === id)) return;
    const uid = this.uid();
    const removing = this.saved().includes(id);
    const message = removing ? this.i18n.t('toast.removed') : this.i18n.t('toast.added');
    if (uid) {
      const session = this.session;
      if (!session?.ready || session.uid !== uid) {
        this.announce(this.statusText());
        return;
      }
      const ref = session.sdk.doc(session.list, id);
      this.status.set('syncing');
      void (removing ? session.sdk.deleteDoc(ref) : session.sdk.setDoc(ref, { saved: true }))
        .then(() => {
          if (this.session === session) this.announce(message);
        })
        .catch(() => {
          if (this.session === session) {
            this.status.set('error');
            this.announce(this.statusText());
          }
        });
      return;
    }
    this.saved.update((ids) => (removing ? ids.filter((value) => value !== id) : [...ids, id]));
    try {
      localStorage.setItem('luma:list', JSON.stringify(this.saved()));
      this.announce(message);
    } catch {
      this.announce(this.i18n.t('toast.storage'));
    }
  }
  announce(message: string): void {
    clearTimeout(this.noticeTimer);
    this.notice.set(message);
    this.noticeTimer = setTimeout(() => this.notice.set(''), 3500);
  }
  private readSaved(key: string): readonly string[] {
    try {
      const raw: unknown = JSON.parse(localStorage.getItem(key) ?? '[]');
      return Array.isArray(raw)
        ? [
            ...new Set(
              raw.filter(
                (id): id is string =>
                  typeof id === 'string' && FILMS.some((film) => film.id === id),
              ),
            ),
          ]
        : [];
    } catch {
      return [];
    }
  }
}
