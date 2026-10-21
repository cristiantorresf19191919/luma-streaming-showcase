import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Film, filmTag, filmTitle, poster } from '../core/catalog';
import type { I18nKey } from '../core/i18n.dict';
import { I18nService } from '../core/i18n.service';
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
      [attr.aria-label]="i18n.t('card.view') + ' ' + title()"
    >
      <img [src]="poster(film().id)" [alt]="title()" width="500" height="750" loading="lazy" />
      @if (tag(); as tagLabel) {
        <span class="poster-tag">{{ tagLabel }}</span>
      }
      <span class="poster-hover"
        ><span class="poster-play"><luma-icon name="play" /></span
        ><span>{{ i18n.t('card.discover') }}</span></span
      >
    </a>
    <div class="card-caption">
      <a [routerLink]="['/title', film().id]">{{ title() }}</a
      ><button
        type="button"
        class="save-button"
        [attr.aria-label]="
          (store.saved().includes(film().id) ? i18n.t('card.remove') : i18n.t('card.save')) +
          ' ' +
          title()
        "
        [attr.aria-pressed]="store.saved().includes(film().id)"
        [disabled]="!store.canToggle()"
        (click)="store.toggle(film().id)"
      >
        <luma-icon [name]="store.saved().includes(film().id) ? 'check' : 'plus'" />
      </button>
    </div>
    <p class="card-meta">{{ film().year }} <span>·</span> {{ genreLabel() }}</p>
    <div class="card-actions">
      <a class="button primary card-action" [routerLink]="['/watch', film().id]">
        <luma-icon name="play" />{{ i18n.t('card.trailer') }}
      </a>
      <a class="button glass card-action" [routerLink]="['/title', film().id]">
        <luma-icon name="info" />{{ i18n.t('card.moreInfo') }}
      </a>
    </div>
  </article>`,
})
export class FilmCard {
  readonly film = input.required<Film>();
  readonly store = inject(LibraryStore);
  readonly i18n = inject(I18nService);
  readonly poster = poster;
  title = () => filmTitle(this.film(), this.i18n.lang());
  tag = () => filmTag(this.film(), this.i18n.lang());
  genreLabel = () => {
    const key = `genre.${this.film().genre}` as I18nKey;
    const label = this.i18n.t(key);
    return label === key ? this.film().genre : label;
  };
}
