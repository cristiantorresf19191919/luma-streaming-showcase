import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { I18nService } from '../core/i18n.service';
import { LibraryStore } from '../core/library.store';
import { Icon } from '../shared/icon';
@Component({
  selector: 'luma-profile',
  imports: [RouterLink, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<section class="page-shell profile-page">
    <span class="section-kicker">{{ i18n.t('profile.kicker') }}</span>
    <h1>{{ i18n.t('profile.heading') }}</h1>
    <div class="profile-panel">
      <div class="profile-avatar">J</div>
      <h2>{{ i18n.t('profile.hey') }}</h2>
      <p class="muted">{{ i18n.t('profile.tagline') }}</p>
      <a class="profile-row" routerLink="/list"
        ><luma-icon name="bookmark" /><span
          >{{ i18n.t('profile.list')
          }}<small
            >{{ store.saved().length }} {{ i18n.t('profile.listMeta') }}</small
          ></span
        ><luma-icon name="arrow" /></a
      ><a class="profile-row" routerLink="/movies"
        ><luma-icon name="film" /><span
          >{{ i18n.t('profile.explore')
          }}<small>{{ i18n.t('profile.exploreMeta') }}</small></span
        ><luma-icon name="arrow"
      /></a>
      <p class="profile-note" [innerHTML]="i18n.t('profile.note')"></p>
      <a class="button primary" routerLink="/">{{ i18n.t('profile.cta') }}</a>
    </div>
  </section>`,
})
export class Profile {
  readonly store = inject(LibraryStore);
  readonly i18n = inject(I18nService);
}
