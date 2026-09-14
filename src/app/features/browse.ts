import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { FILMS } from '../core/catalog';
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
        `${f.title} ${f.genre} ${f.cast} ${f.director}`
          .toLowerCase()
          .includes(this.query().trim().toLowerCase()),
    ),
  );
  readonly heading =
    this.page === 'list'
      ? 'Your next great watch.'
      : this.page === 'search'
        ? 'What are you in the mood for?'
        : this.page === 'series'
          ? 'One more episode.'
          : 'Stories worth staying in for.';
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
