import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { toSignal } from '@angular/core/rxjs-interop';
import { FILMS, filmDescription, filmTitle, poster } from '../core/catalog';
import type { I18nKey } from '../core/i18n.dict';
import { I18nService } from '../core/i18n.service';
import { LibraryStore } from '../core/library.store';
import { Icon } from '../shared/icon';
import { FilmCard } from '../shared/film-card';
@Component({
  selector: 'luma-detail',
  imports: [RouterLink, Icon, FilmCard],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (film(); as film) {
      <section class="detail-hero" [class.dune-detail]="film.id === 'dune'">
        <img
          class="detail-art"
          [src]="film.id === 'dune' ? '/images/dune-hero.jpg' : poster(film.id)"
          alt=""
          width="1280"
          height="720"
        />
        <div class="detail-gradient"></div>
        <div class="detail-content page-shell">
          <a routerLink="/" class="back-link"
            ><luma-icon name="back" />{{ i18n.t('detail.back') }}</a
          ><span class="section-kicker">{{ i18n.t('detail.kicker') }}</span>
          <h1>{{ titleOf(film) }}</h1>
          <div class="film-meta">
            <strong>{{ i18n.t('detail.acclaimed') }}</strong
            ><span>{{ film.year }}</span
            ><span class="rating">{{ film.rating }}</span
            ><span>{{ film.duration }}</span
            ><span class="quality">4K</span>
          </div>
          <p class="detail-description">{{ descriptionOf(film) }}</p>
          <div class="actions">
            <a class="button primary" [routerLink]="['/watch', film.id]"
              ><luma-icon name="play" />{{
                film.kind === 'series' ? i18n.t('detail.playEpisode') : i18n.t('detail.watch')
              }}</a
            ><button
              type="button"
              class="button glass"
              (click)="store.toggle(film.id)"
              [attr.aria-pressed]="store.saved().includes(film.id)"
            >
              <luma-icon [name]="store.saved().includes(film.id) ? 'check' : 'plus'" />{{
                store.saved().includes(film.id) ? i18n.t('detail.inList') : i18n.t('detail.myList')
              }}
            </button>
          </div>
          <div class="detail-credits">
            <p>
              <span>{{ i18n.t('detail.directed') }}</span
              >{{ film.director }}
            </p>
            <p>
              <span>{{ i18n.t('detail.starring') }}</span
              >{{ film.cast }}
            </p>
            <p>
              <span>{{ i18n.t('detail.genre') }}</span
              >{{ genreLabel(film.genre) }}
            </p>
          </div>
        </div>
      </section>
      <section class="page-shell detail-bottom">
        @if (film.kind === 'series') {
          <div class="section-heading">
            <h2>{{ i18n.t('detail.episodes.heading') }}</h2>
            <span class="muted">{{ i18n.t('detail.episodes.meta') }}</span>
          </div>
          <div class="episode-list">
            @for (episode of episodes; track episode.number) {
              <a
                [routerLink]="['/watch', film.id]"
                [queryParams]="{ episode: episode.number }"
                class="episode"
                ><span class="episode-number">0{{ episode.number }}</span
                ><luma-icon name="play" />
                <div>
                  <h3>{{ episode.title }}</h3>
                  <p>{{ episode.description }}</p>
                </div>
                <span>48m</span></a
              >
            }
          </div>
        }
        @if (related().length) {
          <div class="section-heading">
            <div>
              <span class="section-kicker">{{ i18n.t('detail.related.kicker') }}</span>
              <h2>{{ i18n.t('detail.related.heading') }}</h2>
            </div>
          </div>
          <div class="poster-rail">
            @for (item of related(); track item.id) {
              <luma-film-card [film]="item" />
            }
          </div>
        }
      </section>
    } @else {
      <section class="page-shell empty-state">
        <h1>{{ i18n.t('detail.missing.title') }}</h1>
        <p>{{ i18n.t('detail.missing.body') }}</p>
        <a class="button primary" routerLink="/">{{ i18n.t('detail.missing.cta') }}</a>
      </section>
    }
  `,
})
export class Detail {
  readonly params = toSignal(inject(ActivatedRoute).paramMap);
  readonly film = computed(() => FILMS.find((f) => f.id === this.params()?.get('id')));
  readonly related = computed(() =>
    FILMS.filter((f) => f.id !== this.film()?.id)
      .sort(
        (a, b) => Number(b.genre === this.film()?.genre) - Number(a.genre === this.film()?.genre),
      )
      .slice(0, 6),
  );
  readonly store = inject(LibraryStore);
  readonly i18n = inject(I18nService);
  readonly poster = poster;
  readonly title = inject(Title);
  readonly episodes = [
    {
      number: 1,
      title: 'The beginning',
      description: 'Enter a world where nothing is quite what it seems.',
    },
    {
      number: 2,
      title: 'A different perspective',
      description: 'New connections bring unexpected discoveries.',
    },
    { number: 3, title: 'The turning point', description: 'One decision changes everything.' },
  ];
  constructor() {
    effect(() => {
      const film = this.film();
      const name = film ? filmTitle(film, this.i18n.lang()) : 'Title not found';
      this.title.setTitle(`${name} — movie`);
    });
  }
  titleOf = (film: (typeof FILMS)[number]) => filmTitle(film, this.i18n.lang());
  descriptionOf = (film: (typeof FILMS)[number]) => filmDescription(film, this.i18n.lang());
  genreLabel(genre: string): string {
    const key = `genre.${genre}` as I18nKey;
    const label = this.i18n.t(key);
    return label === key ? genre : label;
  }
}
