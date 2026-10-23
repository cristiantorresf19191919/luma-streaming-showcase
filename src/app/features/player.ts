import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  viewChild,
  ElementRef,
  OnDestroy,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { toSignal } from '@angular/core/rxjs-interop';
import { FILMS, filmDescription, filmTitle, filmTrailer, poster } from '../core/catalog';
import { I18nService } from '../core/i18n.service';
import { ViewingStore } from '../core/viewing.store';
import { AnalyticsService } from '../core/analytics.service';
import { Icon } from '../shared/icon';
@Component({
  selector: 'luma-player',
  imports: [RouterLink, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (film(); as film) {
      <section class="player-page page-shell">
        <div class="player-heading">
          <a class="back-link" [routerLink]="['/title', film.id]"
            ><luma-icon name="back" />{{ titleOf(film) }}</a
          ><span class="preview-label">{{ i18n.t('player.preview') }}</span>
        </div>
        <div class="player-layout">
          <div class="screen-column">
            <div class="video-wrap">
              <video
                #video
                controls
                playsinline
                preload="metadata"
                [attr.poster]="posterOf(film)"
                [src]="trailerOf(film)"
                (error)="failed.set(true)"
                (loadedmetadata)="prepare(video)"
                (timeupdate)="saveProgress(video)"
                (pause)="saveProgress(video, true)"
                (ended)="saveProgress(video, true)"
                (play)="trackPlay()"
              >
                @if (film.id === 'dune') {
                  <track
                    kind="captions"
                    src="/media/preview.vtt"
                    srclang="en"
                    label="English · sample clip"
                  />
                }
              </video>
            </div>
            <div class="actions playback-tools">
              <button class="button glass" type="button" (click)="fullscreen(video)">
                {{ i18n.lang() === 'en' ? 'Full screen' : 'Pantalla completa' }}
              </button>
              @if (resume() > 2) {
                <button
                  class="button glass"
                  type="button"
                  (click)="video.currentTime = 0; resume.set(0)"
                >
                  {{ i18n.lang() === 'en' ? 'Start over' : 'Desde el inicio' }}
                </button>
              }
            </div>
            <p class="muted" role="status">
              {{
                !viewing.ready()
                  ? i18n.lang() === 'en'
                    ? 'Loading your saved place…'
                    : 'Cargando tu progreso…'
                  : viewing.error()
                    ? i18n.lang() === 'en'
                      ? 'Progress sync unavailable. Keep this page open and retry your connection.'
                      : 'No se pudo sincronizar el progreso. Revisa tu conexión.'
                    : i18n.lang() === 'en'
                      ? 'Your place is saved as you watch.'
                      : 'Guardamos tu progreso mientras miras.'
              }}
            </p>
            @if (failed()) {
              <p role="alert">
                {{ i18n.t('player.error') }}
                <button class="text-button" type="button" (click)="video.load(); failed.set(false)">
                  {{ i18n.t('player.retry') }}
                </button>
              </p>
            }
            <div class="player-title">
              <div>
                <span class="section-kicker"
                  >{{ i18n.t('player.now') }}
                  @if (episode()) {
                    · {{ i18n.t('player.episode') }} {{ episode() }}
                  }
                </span>
                <h1>{{ titleOf(film) }}</h1>
              </div>
              <button
                type="button"
                class="button glass companion-toggle"
                [attr.aria-expanded]="companion()"
                [attr.aria-label]="i18n.t('player.companion')"
                (click)="companion.set(!companion())"
              >
                <luma-icon name="sparkle" />{{ i18n.t('player.companion') }}
              </button>
            </div>
            <p class="muted preview-note">{{ i18n.t('player.note') }}</p>
            <p class="player-description">{{ descriptionOf(film) }}</p>
          </div>
          @if (companion()) {
            <aside class="companion">
              <div class="companion-header">
                <span><luma-icon name="sparkle" />movie companion</span
                ><button
                  class="icon-button"
                  [attr.aria-label]="
                    i18n.lang() === 'en' ? 'Close story companion' : 'Cerrar compañero de historia'
                  "
                  type="button"
                  (click)="companion.set(false)"
                >
                  <luma-icon name="close" />
                </button>
              </div>
              <div class="companion-intro">
                <div class="glowing-orb"></div>
                <span class="section-kicker">{{ i18n.t('player.ask') }}</span>
                <h2>{{ titleOf(film) }}</h2>
                <p>{{ descriptionOf(film) }}</p>
              </div>
              <div class="prompt-chips">
                @for (prompt of prompts(); track prompt) {
                  <button class="chip" type="button" (click)="ask(prompt)">{{ prompt }}</button>
                }
              </div>
              <div class="companion-response" aria-live="polite">
                @if (answer()) {
                  <p>{{ answer() }}</p>
                } @else {
                  <p>{{ i18n.t('player.ask') }}</p>
                }
              </div>
              <form class="companion-form" (submit)="submit($event, question)">
                <label class="sr-only" for="question">{{ i18n.t('player.ask') }}</label
                ><input
                  #question
                  id="question"
                  name="story-question"
                  [placeholder]="i18n.t('player.placeholder')"
                  autocomplete="off"
                /><button class="orb-send" [attr.aria-label]="i18n.t('player.send')" type="submit">
                  <luma-icon name="send" />
                </button>
              </form>
            </aside>
          }
        </div>
      </section>
    } @else {
      <section class="page-shell empty-state">
        <h1>{{ i18n.t('detail.missing.title') }}</h1>
        <a routerLink="/" class="button primary">{{ i18n.t('detail.missing.cta') }}</a>
      </section>
    }
  `,
})
export class Player implements OnDestroy {
  readonly viewing = inject(ViewingStore);
  readonly analytics = inject(AnalyticsService);
  readonly videoRef = viewChild<ElementRef<HTMLVideoElement>>('video');
  readonly resume = signal(0);
  private prepared = '';
  private lastSaved = 0;
  private tracked = '';
  private owner: string | null = null;
  private readonly route = inject(ActivatedRoute);
  readonly i18n = inject(I18nService);
  readonly params = toSignal(this.route.paramMap);
  readonly queryParams = toSignal(this.route.queryParamMap);
  readonly film = computed(() => FILMS.find((f) => f.id === this.params()?.get('id')));
  readonly episode = computed(() => this.queryParams()?.get('episode'));
  readonly poster = poster;
  readonly companion = signal(true);
  readonly failed = signal(false);
  readonly answer = signal('');
  readonly prompts = computed(() => {
    this.i18n.lang();
    return this.i18n.lang() === 'es'
      ? ['Resumen', 'Detrás de cámaras', 'Historias similares']
      : ['Story summary', 'Behind the scenes', 'Similar stories'];
  });
  private readonly title = inject(Title);
  constructor() {
    effect(() => {
      const film = this.film();
      const name = film ? filmTitle(film, this.i18n.lang()) : 'preview';
      this.title.setTitle(`Watch ${name} — movie`);
      this.failed.set(false);
    });
    effect(() => {
      const ready = this.viewing.ready();
      const uid = this.viewing.auth.user()?.uid ?? null;
      const video = this.videoRef()?.nativeElement;
      if (video && ready) {
        if (this.owner !== uid) {
          video.pause();
          this.prepared = '';
        }
        this.owner = uid;
        this.prepare(video);
      }
    });
  }
  titleOf = (film: (typeof FILMS)[number]) => filmTitle(film, this.i18n.lang());
  descriptionOf = (film: (typeof FILMS)[number]) => filmDescription(film, this.i18n.lang());
  trailerOf = (film: (typeof FILMS)[number]) => filmTrailer(film);
  posterOf = (film: (typeof FILMS)[number]) =>
    film.id === 'dune' ? '/images/dune-hero.jpg' : poster(film.id);
  prepare(video: HTMLVideoElement): void {
    const id = this.film()?.id;
    if (!id || !this.viewing.ready() || !video.duration || this.prepared === id) return;
    this.owner = this.viewing.auth.user()?.uid ?? null;
    this.prepared = id;
    const p = this.viewing.progress()[id + '-trailer'];
    if (p && p.position < video.duration - Math.min(3, video.duration * 0.1)) {
      video.currentTime = p.position;
      this.resume.set(p.position);
    } else {
      video.currentTime = 0;
      this.resume.set(0);
    }
  }
  saveProgress(video: HTMLVideoElement, force = false): void {
    const id = this.film()?.id;
    if (!id || this.prepared !== id) return;
    if (!force && Date.now() - this.lastSaved < 15000) return;
    this.lastSaved = Date.now();
    this.viewing.save(id, 'trailer', video.currentTime, video.duration, this.owner);
  }
  trackPlay() {
    if (this.tracked !== this.film()?.id) {
      this.tracked = this.film()?.id || '';
      this.analytics.track('trailer_view', this.film()?.id);
    }
  }
  fullscreen(video: HTMLVideoElement) {
    const ios = video as HTMLVideoElement & { webkitEnterFullscreen?: () => void };
    if (ios.webkitEnterFullscreen) ios.webkitEnterFullscreen();
    else void video.requestFullscreen?.().catch(() => {});
  }
  ngOnDestroy() {
    const video = this.videoRef()?.nativeElement;
    if (video) this.saveProgress(video, true);
  }
  ask(prompt: string): void {
    const film = this.film();
    if (!film) return;
    const lang = this.i18n.lang();
    const summary = prompt === 'Story summary' || prompt === 'Resumen';
    const behind = prompt === 'Behind the scenes' || prompt === 'Detrás de cámaras';
    const similar = prompt === 'Similar stories' || prompt === 'Historias similares';
    if (summary) this.answer.set(filmDescription(film, lang));
    else if (behind)
      this.answer.set(
        lang === 'es'
          ? `${filmTitle(film, lang)} está dirigida o creada por ${film.director}, y cuenta con ${film.cast}.`
          : `${filmTitle(film, lang)} is directed or created by ${film.director}, and features ${film.cast}.`,
      );
    else if (similar)
      this.answer.set(
        lang === 'es'
          ? `Sigue explorando con ${
              FILMS.filter((item) => item.genre === film.genre && item.id !== film.id)
                .map((item) => filmTitle(item, lang))
                .join(', ') || 'más historias a medida que crece la colección'
            }.`
          : `Keep exploring with ${
              FILMS.filter((item) => item.genre === film.genre && item.id !== film.id)
                .map((item) => filmTitle(item, lang))
                .join(', ') || 'more stories as our collection grows'
            }.`,
      );
    else this.answer.set(filmDescription(film, lang));
  }
  submit(event: Event, input: HTMLInputElement): void {
    event.preventDefault();
    if (input.value.trim()) {
      this.ask(input.value.trim());
      input.value = '';
    } else {
      this.answer.set(this.i18n.t('player.ask'));
      input.focus();
    }
  }
}
