import {
  Component,
  computed,
  inject,
  signal,
  effect,
  viewChild,
  ElementRef,
  OnDestroy,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommerceService } from '../core/commerce.service';
import { ViewingStore } from '../core/viewing.store';
import { I18nService } from '../core/i18n.service';
@Component({
  selector: 'luma-rental',
  imports: [RouterLink, DatePipe],
  template: `<section class="page-shell player-page">
    <a routerLink="/list" [queryParams]="{ tab: 'purchased' }" class="back-link"
      >← {{ text('Purchased', 'Compradas') }}</a
    >
    <h1>Invisible’s</h1>
    @if (!viewing.auth.ready() || !viewing.ready() || !viewing.purchasesReady()) {
      <p role="status">{{ text('Loading your rental…', 'Cargando tu alquiler…') }}</p>
    } @else if (!purchase()) {
      <div class="library-empty">
        <h2>
          {{
            text(
              'Sign in to the account that purchased this film.',
              'Entra a la cuenta que compró esta película.'
            )
          }}
        </h2>
        <a routerLink="/profile" class="button primary">{{ text('Sign in', 'Entrar') }}</a>
      </div>
    } @else if (purchase()?.status !== 'paid' || expired()) {
      <p role="status">
        {{
          text(
            'This rental has ended or access was revoked.',
            'Este alquiler finalizó o su acceso fue revocado.'
          )
        }}
      </p>
    } @else {
      @if (!playing()) {
        <div class="rental-offer">
          <span class="section-kicker">{{ text('YOUR NIGHT PASS', 'TU PASE DE CINE') }}</span>
          <h2>{{ text('Make a night of it.', 'Haz de una noche tu gran noche.') }}</h2>
          <p>
            {{
              purchase()?.startedAt
                ? text(
                    'Resume your film within your viewing window.',
                    'Continúa la película dentro de tu período de alquiler.'
                  )
                : text(
                    'Choosing Start rental starts your 48-hour viewing window now, even if you pause or close this page.',
                    'Al elegir Iniciar alquiler comienzan tus 48 horas, aunque pauses o cierres esta página.'
                  )
            }}
          </p>
          <button class="button primary" [disabled]="busy()" (click)="open()">
            {{
              busy()
                ? text('Preparing…', 'Preparando…')
                : purchase()?.startedAt
                  ? text('Continue film', 'Continuar película')
                  : text('Start rental · 48 hours', 'Iniciar alquiler · 48 horas')
            }}
          </button>
        </div>
      }
      @if (playing()) {
        <div class="video-wrap">
          <video
            #video
            controls
            playsinline
            preload="metadata"
            (loadedmetadata)="restore(video)"
            (timeupdate)="save(video)"
            (pause)="save(video, true)"
            (ended)="save(video, true)"
            (error)="
              error.set(
                text(
                  'Video unavailable. Retry without restarting your rental.',
                  'Vídeo no disponible. Reintenta sin reiniciar el alquiler.'
                )
              )
            "
          ></video>
        </div>
        <button class="button glass" (click)="fullscreen(video)">
          {{ text('Full screen', 'Pantalla completa') }}
        </button>
      }
      @if (expiresAt() || purchase()?.expiresAt) {
        <p class="rental-notice">
          {{ text('Available until', 'Disponible hasta') }}
          {{ expiresAt() || purchase()?.expiresAt | date: 'medium' }}
        </p>
      }
    }
    @if (error()) {
      <p role="alert">{{ error() }}</p>
    }
  </section>`,
})
export class Rental implements OnDestroy {
  readonly viewing = inject(ViewingStore);
  readonly commerce = inject(CommerceService);
  readonly i18n = inject(I18nService);
  readonly id = inject(ActivatedRoute).snapshot.paramMap.get('purchaseId') || '';
  readonly purchase = computed(() => this.viewing.purchases().find((p) => p.id === this.id));
  readonly videoRef = viewChild<ElementRef<HTMLVideoElement>>('video');
  readonly playing = signal(false);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly expiresAt = signal(0);
  readonly now = signal(Date.now());
  readonly expired = computed(
    () => !!this.purchase()?.expiresAt && this.purchase()!.expiresAt! <= this.now(),
  );
  private owner: string | null = null;
  private lastSave = 0;
  private restored = false;
  private hls?: { destroy(): void };
  private interval = setInterval(() => this.now.set(Date.now()), 1000);
  constructor() {
    effect(() => {
      const uid = this.viewing.auth.user()?.uid;
      const p = this.purchase();
      if (this.playing() && (uid !== this.owner || this.expired() || p?.status !== 'paid')) {
        this.videoRef()?.nativeElement.pause();
        this.hls?.destroy();
        this.playing.set(false);
      }
    });
  }
  text(en: string, es: string) {
    return this.i18n.lang() === 'en' ? en : es;
  }
  async open() {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    const uid = this.viewing.auth.user()?.uid;
    try {
      const data = await this.commerce.request('playback', {
        purchaseId: this.id,
        start: !this.purchase()?.startedAt,
      });
      if (this.viewing.auth.user()?.uid !== uid) return;
      this.owner = uid || null;
      this.expiresAt.set(data.expiresAt);
      this.playing.set(true);
      // Wait for Angular to insert the video before attaching native HLS / MediaSource.
      requestAnimationFrame(() => {
        void this.attach(data.url);
      });
    } catch (e) {
      this.error.set((e as Error).message);
    } finally {
      this.busy.set(false);
    }
  }
  private async attach(url: string) {
    const video = this.videoRef()?.nativeElement;
    if (!video) return;
    if (video.canPlayType('application/vnd.apple.mpegurl')) video.src = url;
    else {
      const { default: Hls } = await import('hls.js');
      if (!this.playing()) return;
      if (!Hls.isSupported()) {
        this.error.set(
          this.text(
            'Use Safari or a browser with HLS support.',
            'Usa Safari u otro navegador compatible.',
          ),
        );
        return;
      }
      const hls = new Hls();
      this.hls = hls;
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal)
          this.error.set(
            this.text(
              'Playback interrupted. Reopen this rental to retry.',
              'Reproducción interrumpida. Reabre el alquiler para reintentar.',
            ),
          );
      });
    }
  }
  restore(video: HTMLVideoElement) {
    if (this.restored) return;
    this.restored = true;
    const p = this.viewing.progress()['invisibles-film'];
    if (p && p.position < video.duration - Math.min(3, video.duration * 0.1))
      video.currentTime = p.position;
    void video.play().catch(() => {});
  }
  save(video: HTMLVideoElement, force = false) {
    if (!this.restored || (!force && Date.now() - this.lastSave < 15000)) return;
    this.lastSave = Date.now();
    this.viewing.save('invisibles', 'film', video.currentTime, video.duration, this.owner);
  }
  fullscreen(video: HTMLVideoElement) {
    const ios = video as HTMLVideoElement & { webkitEnterFullscreen?: () => void };
    if (ios.webkitEnterFullscreen) ios.webkitEnterFullscreen();
    else void video.requestFullscreen?.().catch(() => {});
  }
  ngOnDestroy() {
    const v = this.videoRef()?.nativeElement;
    if (v) this.save(v, true);
    this.hls?.destroy();
    clearInterval(this.interval);
  }
}
