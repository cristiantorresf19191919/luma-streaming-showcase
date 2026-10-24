import { ChangeDetectionStrategy, Component, inject, signal, HostListener } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { InstallPrompt } from './shared/install-prompt';
import { AnalyticsService } from './core/analytics.service';
import { Membership } from './shared/membership';
import { MembershipService } from './core/membership.service';
import { Icon } from './shared/icon';
import { I18nService } from './core/i18n.service';
import { AuthService } from './core/auth.service';
import { LibraryStore } from './core/library.store';
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icon, Membership, InstallPrompt],
  templateUrl: './app.html',
  host: { '[class.keyboard-navigation]': 'keyboardNavigation()' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  readonly keyboardNavigation = signal(false);
  @HostListener('document:pointerdown')
  onPointer(): void {
    this.keyboardNavigation.set(false);
  }
  readonly analytics = inject(AnalyticsService);
  readonly installHelp = signal(false);
  readonly membership = inject(MembershipService);
  readonly auth = inject(AuthService);
  readonly store = inject(LibraryStore);
  readonly i18n = inject(I18nService);
  private readonly router = inject(Router);
  @HostListener('document:keydown', ['$event'])
  onShortcut(event: KeyboardEvent): void {
    this.keyboardNavigation.set(true);
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      void this.router.navigate(['/search']);
    }
  }
}
