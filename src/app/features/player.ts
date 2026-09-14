import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { toSignal } from '@angular/core/rxjs-interop';
import { FILMS, poster } from '../core/catalog';
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
            ><luma-icon name="back" />{{ film.title }}</a
          ><span class="preview-label">SHOWCASE PREVIEW</span>
        </div>
        <div class="player-layout">
          <div class="screen-column">
            <div class="video-wrap">
              <video
                #video
                controls
                playsinline
                preload="metadata"
                [poster]="film.id === 'dune' ? '/images/dune-hero.jpg' : poster(film.id)"
                (error)="failed.set(true)"
              >
                <source src="/media/preview.mp4" type="video/mp4" />
                <track
                  kind="captions"
                  src="/media/preview.vtt"
                  srclang="en"
                  label="English"
                  default
                />
              </video>
            </div>
            @if (failed()) {
              <p role="alert">
                The preview couldn’t load.
                <button class="text-button" type="button" (click)="video.load(); failed.set(false)">
                  Try again
                </button>
              </p>
            }
            <div class="player-title">
              <div>
                <span class="section-kicker"
                  >NOW PREVIEWING
                  @if (episode()) {
                    · EPISODE {{ episode() }}
                  }
                </span>
                <h1>{{ film.title }}</h1>
              </div>
              <button
                type="button"
                class="button glass companion-toggle"
                [attr.aria-expanded]="companion()"
                (click)="companion.set(!companion())"
              >
                <luma-icon name="sparkle" />Story companion
              </button>
            </div>
            <p class="muted preview-note">
              Sample footage for the viewing experience. Full titles aren’t streamed in this
              showcase.
            </p>
            <p class="player-description">{{ film.description }}</p>
          </div>
          @if (companion()) {
            <aside class="companion">
              <div class="companion-header">
                <span><luma-icon name="sparkle" />movie companion</span
                ><button
                  class="icon-button"
                  aria-label="Close story companion"
                  type="button"
                  (click)="companion.set(false)"
                >
                  <luma-icon name="close" />
                </button>
              </div>
              <div class="companion-intro">
                <div class="glowing-orb"></div>
                <span class="section-kicker">GO A LITTLE DEEPER</span>
                <h2>There’s more<br />to every story.</h2>
                <p>Explore the world behind what you watch.</p>
                <span class="demo-label">Curated demo · No live AI</span>
              </div>
              <div class="prompt-chips">
                @for (prompt of prompts; track prompt) {
                  <button class="chip" type="button" (click)="ask(prompt)">{{ prompt }}</button>
                }
              </div>
              <div class="companion-response" aria-live="polite">
                @if (answer()) {
                  <span class="section-kicker">STORY NOTES</span>
                  <p>{{ answer() }}</p>
                } @else {
                  <p>Pick a topic above, or ask about this title.</p>
                }
              </div>
              <form class="companion-form" (submit)="submit($event, question)">
                <label class="sr-only" for="question">Ask about this title</label
                ><input
                  #question
                  id="question"
                  name="story-question"
                  placeholder="Ask about this story…"
                  autocomplete="off"
                /><button class="orb-send" aria-label="Send question" type="submit">
                  <luma-icon name="send" />
                </button>
              </form>
            </aside>
          }
        </div>
      </section>
    } @else {
      <section class="page-shell empty-state">
        <h1>Preview not found</h1>
        <a routerLink="/" class="button primary">Discover another story</a>
      </section>
    }
  `,
})
export class Player {
  private readonly route = inject(ActivatedRoute);
  readonly params = toSignal(this.route.paramMap);
  readonly queryParams = toSignal(this.route.queryParamMap);
  readonly film = computed(() => FILMS.find((f) => f.id === this.params()?.get('id')));
  readonly episode = computed(() => this.queryParams()?.get('episode'));
  readonly poster = poster;
  readonly companion = signal(true);
  readonly failed = signal(false);
  readonly answer = signal('');
  readonly prompts = ['Story summary', 'Behind the scenes', 'Similar stories'];
  private readonly title = inject(Title);
  constructor() {
    effect(() => this.title.setTitle(`Watch ${this.film()?.title ?? 'preview'} — movie`));
  }
  ask(prompt: string): void {
    const film = this.film();
    if (!film) return;
    if (prompt === 'Story summary') this.answer.set(film.description);
    else if (prompt === 'Behind the scenes')
      this.answer.set(
        `${film.title} is directed or created by ${film.director}, and features ${film.cast}. Its ${film.genre.toLowerCase()} storytelling invites you to look a little closer.`,
      );
    else if (prompt === 'Similar stories')
      this.answer.set(
        `Keep exploring with ${
          FILMS.filter((item) => item.genre === film.genre && item.id !== film.id)
            .map((item) => item.title)
            .join(', ') || 'more stories as our collection grows'
        }. Find them in Discover.`,
      );
    else
      this.answer.set(
        `This showcase has curated notes rather than live AI answers. For ${film.title}, try “Story summary”, “Behind the scenes”, or “Similar stories” above.`,
      );
  }
  submit(event: Event, input: HTMLInputElement): void {
    event.preventDefault();
    if (input.value.trim()) {
      this.ask(input.value.trim());
      input.value = '';
    } else {
      this.answer.set('Choose a topic or type a question to explore this story.');
      input.focus();
    }
  }
}
