import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Film, poster } from '../core/catalog';
import { LibraryStore } from '../core/library.store';
import { Icon } from './icon';
@Component({
  selector: 'luma-film-card',
  imports: [RouterLink, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <article class="film-card">
    <a
      class="poster-link"
      [routerLink]="['/title', film().id]"
      [attr.aria-label]="'View ' + film().title"
    >
      <img [src]="poster(film().id)" [alt]="film().title" width="500" height="750" loading="lazy" />
      @if (film().tag) {
        <span class="poster-tag">{{ film().tag }}</span>
      }
      <span class="poster-hover"
        ><span class="poster-play"><luma-icon name="play" /></span
        ><span>Discover the story</span></span
      >
    </a>
    <div class="card-caption">
      <a [routerLink]="['/title', film().id]">{{ film().title }}</a
      ><button
        type="button"
        class="save-button"
        [attr.aria-label]="(store.saved().includes(film().id) ? 'Remove ' : 'Save ') + film().title"
        [attr.aria-pressed]="store.saved().includes(film().id)"
        (click)="store.toggle(film().id)"
      >
        <luma-icon [name]="store.saved().includes(film().id) ? 'check' : 'plus'" />
      </button>
    </div>
    <p class="card-meta">{{ film().year }} <span>·</span> {{ film().genre }}</p>
  </article>`,
})
export class FilmCard {
  readonly film = input.required<Film>();
  readonly store = inject(LibraryStore);
  readonly poster = poster;
}
