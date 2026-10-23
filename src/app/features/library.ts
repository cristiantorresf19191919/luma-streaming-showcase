import { Component, computed, inject, signal, effect } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AnalyticsService } from '../core/analytics.service';
import { FILMS, filmTitle } from '../core/catalog';
import { LibraryStore } from '../core/library.store';
import { ViewingStore } from '../core/viewing.store';
import { I18nService } from '../core/i18n.service';
import { FilmCard } from '../shared/film-card';
@Component({
  selector: 'luma-library',
  imports: [RouterLink, FilmCard, DatePipe],
  template: ` <section class="page-shell catalog-page personal-library">
    <span class="section-kicker">{{
      text('YOUR PRIVATE SCREENING ROOM', 'TU SALA PERSONAL')
    }}</span>
    <h1>{{ text('Your stories, waiting.', 'Tus historias te esperan.') }}</h1>
    <p class="muted" role="status">{{ store.statusText() }}</p>
    <div class="library-tabs" aria-label="Library sections">
      @for (item of tabs; track item.id) {
        <button
          class="chip"
          [class.selected]="tab() === item.id"
          [attr.aria-pressed]="tab() === item.id"
          (click)="tab.set(item.id)"
        >
          {{ text(item.en, item.es) }}
        </button>
      }
    </div>
    @if (success) {
      <p class="rental-notice" role="status">
        {{
          text(
            'Thanks! Your purchase appears here after payment verification. Your rental clock has not started.',
            '¡Gracias! Tu compra aparecerá al verificar el pago. El tiempo de alquiler aún no ha comenzado.'
          )
        }}
      </p>
    }
    @if (viewing.error()) {
      <p role="alert">
        {{
          text(
            'We could not load all account data. Check your connection and reload.',
            'No pudimos cargar todos tus datos. Revisa tu conexión y recarga.'
          )
        }}
      </p>
    }
    @if (tab() === 'saved') {
      <div class="catalog-grid">
        @for (film of saved(); track film.id) {
          <luma-film-card [film]="film" />
        }
      </div>
      @if (!saved().length) {
        <div class="library-empty">
          <span>＋</span>
          <h2>
            {{ text('A place for your next favorite.', 'Un lugar para tu próxima favorita.') }}
          </h2>
          <p>
            {{
              text(
                'Tap + on any movie to keep it here.',
                'Toca + en una película para guardarla aquí.'
              )
            }}
          </p>
          <a class="button primary" routerLink="/movies">{{
            text('Find your next story', 'Encuentra tu próxima historia')
          }}</a>
        </div>
      }
    }
    @if (tab() === 'continue') {
      <div class="library-rows">
        @for (p of viewing.continuing(); track p.filmId + p.mode) {
          <a
            class="library-row"
            [routerLink]="
              p.mode === 'trailer' ? ['/watch', p.filmId] : ['/rental', purchaseId(p.filmId)]
            "
            ><img [src]="'/images/' + p.filmId + '.jpg'" alt="" />
            <div>
              <span class="section-kicker">{{
                p.mode === 'trailer' ? text('TRAILER', 'TRÁILER') : text('FILM', 'PELÍCULA')
              }}</span>
              <h2>{{ title(p.filmId) }}</h2>
              <progress
                [value]="p.position"
                [max]="p.duration"
                [attr.aria-label]="text('Viewing progress', 'Progreso')"
              ></progress>
              <p>
                {{ text('Resume at', 'Continuar en') }} {{ time(p.position) }} ·
                {{ text('of', 'de') }} {{ time(p.duration) }}
              </p>
            </div>
            <span>▶</span></a
          >
        }
      </div>
      @if (!viewing.continuing().length) {
        <div class="library-empty">
          <span>▶</span>
          <h2>{{ text('Pick up right where you left off.', 'Continúa donde lo dejaste.') }}</h2>
          <p>
            {{
              text(
                'Start a trailer or purchased film. Your progress will appear here.',
                'Inicia un tráiler o una película comprada. Tu progreso aparecerá aquí.'
              )
            }}
          </p>
          <a routerLink="/movies" class="button primary">{{
            text('Explore films', 'Explorar películas')
          }}</a>
        </div>
      }
    }
    @if (tab() === 'purchased') {
      @if (!viewing.purchasesReady()) {
        <p role="status">{{ text('Loading your purchases…', 'Cargando tus compras…') }}</p>
      }
      <div class="library-rows">
        @for (p of viewing.purchases(); track p.id) {
          <article class="purchase-card">
            <span class="section-kicker">{{ text('YOUR NIGHT PASS', 'TU PASE DE CINE') }}</span>
            <h2>{{ title(p.filmId) }}</h2>
            @if (p.status !== 'paid') {
              <p>
                {{
                  text(
                    'Access revoked. Check your payment receipt.',
                    'Acceso revocado. Consulta el recibo de pago.'
                  )
                }}
              </p>
            } @else if (p.expiresAt && p.expiresAt < now()) {
              <p>
                {{ text('Rental ended', 'Alquiler finalizado') }} ·
                {{ p.expiresAt | date: 'medium' }}
              </p>
            } @else {
              <p>
                {{
                  p.startedAt
                    ? text('Available until', 'Disponible hasta')
                    : text(
                        '48 hours start when you choose Start rental.',
                        'Las 48 horas comienzan al elegir Iniciar alquiler.'
                      )
                }}
                {{ p.expiresAt ? (p.expiresAt | date: 'medium') : '' }}
              </p>
              <a class="button primary" [routerLink]="['/rental', p.id]">{{
                p.startedAt
                  ? text('Continue film', 'Continuar película')
                  : text('View rental', 'Ver alquiler')
              }}</a>
            }
            @if (p.receiptUrl) {
              <a class="text-button" [href]="p.receiptUrl" target="_blank" rel="noopener">{{
                text('View receipt ↗', 'Ver recibo ↗')
              }}</a>
            }
          </article>
        }
      </div>
      @if (viewing.purchasesReady() && !viewing.purchases().length) {
        <div class="library-empty">
          <span>✦</span>
          <h2>
            {{ text('Your next movie night lives here.', 'Tu próxima noche de cine vive aquí.') }}
          </h2>
          <p>
            {{
              text(
                'Completed purchases and receipts appear here after secure payment.',
                'Tus compras y recibos aparecerán aquí tras confirmar el pago seguro.'
              )
            }}
          </p>
          <a routerLink="/title/invisibles" class="button primary">{{
            text('Explore the night pass', 'Conocer el pase de cine')
          }}</a>
        </div>
      }
    }
    @if (!viewing.auth.user()) {
      <p class="rental-notice">
        <a routerLink="/profile">{{
          text(
            'Sign in to sync across devices and view purchases.',
            'Entra para sincronizar dispositivos y ver tus compras.'
          )
        }}</a>
      </p>
    }
  </section>`,
})
export class Library {
  private analytics = inject(AnalyticsService);
  constructor() {
    effect(() => {
      const session = this.route.snapshot.queryParamMap.get('session_id');
      const purchase = this.viewing
        .purchases()
        .find((p) => p.id === session && p.status === 'paid');
      if (!this.success || !purchase || !this.analytics.enabled()) return;
      try {
        const key = 'movie:purchase-event:' + purchase.id;
        if (localStorage.getItem(key)) return;
        this.analytics.track('purchase_confirmed', purchase.filmId);
        localStorage.setItem(key, '1');
      } catch {}
    });
  }
  readonly store = inject(LibraryStore);
  readonly viewing = inject(ViewingStore);
  readonly i18n = inject(I18nService);
  private route = inject(ActivatedRoute);
  readonly success = this.route.snapshot.queryParamMap.get('checkout') === 'success';
  readonly tab = signal(
    this.route.snapshot.queryParamMap.get('tab') === 'purchased' ? 'purchased' : 'saved',
  );
  readonly tabs = [
    { id: 'saved', en: 'My List', es: 'Mi lista' },
    { id: 'continue', en: 'Continue watching', es: 'Seguir viendo' },
    { id: 'purchased', en: 'Purchased', es: 'Compradas' },
  ];
  readonly saved = computed(() => FILMS.filter((f) => this.store.saved().includes(f.id)));
  text(en: string, es: string) {
    return this.i18n.lang() === 'en' ? en : es;
  }
  title(id: string) {
    const f = FILMS.find((f) => f.id === id);
    return f ? filmTitle(f, this.i18n.lang()) : id;
  }
  time(n: number) {
    return Math.floor(n / 60) + ':' + String(Math.floor(n % 60)).padStart(2, '0');
  }
  now() {
    return Date.now();
  }
  purchaseId(filmId: string) {
    return (
      this.viewing
        .purchases()
        .find(
          (p) =>
            p.filmId === filmId &&
            p.status === 'paid' &&
            (!p.expiresAt || p.expiresAt > Date.now()),
        )?.id || 'unavailable'
    );
  }
}
