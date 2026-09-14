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
  readonly genres = ['All', 'Sci-Fi', 'Action', 'Drama', 'Thriller'];
  readonly featured = FILMS[0];
  readonly trending = FILMS.slice(1, 7);
  readonly picks = [FILMS[6], FILMS[7], FILMS[8], FILMS[9], FILMS[0], FILMS[2]];
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
  scrollRail(rail: HTMLElement, direction: number): void {
    rail.scrollBy({
      left: direction * rail.clientWidth * 0.8,
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    });
  }
}
