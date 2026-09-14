import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LibraryStore } from '../core/library.store';
import { Icon } from '../shared/icon';
@Component({
  selector: 'luma-profile',
  imports: [RouterLink, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<section class="page-shell profile-page">
    <span class="section-kicker">MAKE YOURSELF AT HOME</span>
    <h1>Your own little escape.</h1>
    <div class="profile-panel">
      <div class="profile-avatar">J</div>
      <h2>Hey, Jamie.</h2>
      <p class="muted">A world of stories. A space that’s yours.</p>
      <a class="profile-row" routerLink="/list"
        ><luma-icon name="bookmark" /><span
          >My List<small>{{ store.saved().length }} stories saved for later</small></span
        ><luma-icon name="arrow" /></a
      ><a class="profile-row" routerLink="/movies"
        ><luma-icon name="film" /><span
          >Find your next favorite<small>Explore the collection</small></span
        ><luma-icon name="arrow"
      /></a>
      <p class="profile-note">
        You’re exploring the Luma showcase as Jamie.<br />Your saved titles stay on this device.
      </p>
      <a class="button primary" routerLink="/">Back to discovering</a>
    </div>
  </section>`,
})
export class Profile {
  readonly store = inject(LibraryStore);
}
