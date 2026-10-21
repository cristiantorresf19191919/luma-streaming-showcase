import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { FILMS } from '../core/catalog';
import type { I18nKey } from '../core/i18n.dict';
import { I18nService } from '../core/i18n.service';
import { LibraryStore } from '../core/library.store';
import { Icon } from '../shared/icon';
import { FilmCard } from '../shared/film-card';
@Component({
  selector: 'luma-browse',
  imports: [RouterLink, Icon, FilmCard],
  templateUrl: './browse.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Browse {
  readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);
  readonly store = inject(LibraryStore);
  readonly i18n = inject(I18nService);
  readonly params = toSignal(this.route.queryParamMap);
  readonly page = this.route.snapshot.routeConfig?.path ?? '';
  readonly home = this.page === '';
  readonly query = computed(() => this.params()?.get('q') ?? '');
  readonly genre = computed(() => this.params()?.get('genre') ?? 'All');
  readonly genres = ['All', ...new Set(FILMS.map((film) => film.genre))];
  readonly filtered = computed(() =>
    FILMS.filter(
      (f) =>
        (this.page !== 'movies' || f.kind === 'movie') &&
        (this.page !== 'series' || f.kind === 'series') &&
        (this.page !== 'list' || this.store.saved().includes(f.id)) &&
        (this.genre() === 'All' || f.genre === this.genre()) &&
        `${f.title} ${f.titleEs ?? ''} ${f.genre} ${f.cast} ${f.director}`
          .toLowerCase()
          .includes(this.query().trim().toLowerCase()),
    ),
  );
  readonly kicker = computed(() => {
    this.i18n.lang();
    if (this.page === 'list') return this.i18n.t('browse.kicker.list');
    if (this.page === 'search') return this.i18n.t('browse.kicker.search');
    return this.i18n.t('browse.kicker.default');
  });
  readonly heading = computed(() => {
    this.i18n.lang();
    if (this.page === 'list') return this.i18n.t('browse.heading.list');
    if (this.page === 'search') return this.i18n.t('browse.heading.search');
    if (this.page === 'series') return this.i18n.t('browse.heading.series');
    return this.i18n.t('browse.heading.default');
  });
  readonly subcopy = computed(() => {
    this.i18n.lang();
    return this.page === 'list'
      ? this.i18n.t('browse.sub.list')
      : this.i18n.t('browse.sub.default');
  });
  genreChip(genre: string): string {
    if (genre === 'All') return this.i18n.t('browse.allGenres');
    const key = `genre.${genre}` as I18nKey;
    const label = this.i18n.t(key);
    return label === key ? genre : label;
  }
  filter(genre: string): void {
    void this.router.navigate([], {
      queryParams: { genre: genre === 'All' ? null : genre },
      queryParamsHandling: 'merge',
    });
  }
  search(value: string): void {
    void this.router.navigate([], {
      queryParams: { q: value || null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}
