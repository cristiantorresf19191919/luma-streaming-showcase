import { ChangeDetectionStrategy, Component, inject, HostListener } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Icon } from './shared/icon';
import { I18nService } from './core/i18n.service';
import { AuthService } from './core/auth.service';
import { LibraryStore } from './core/library.store';
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icon],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  readonly auth = inject(AuthService);
  readonly store = inject(LibraryStore);
  readonly i18n = inject(I18nService);
  private readonly router = inject(Router);
  @HostListener('document:keydown', ['$event'])
  onShortcut(event: KeyboardEvent): void {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      void this.router.navigate(['/search']);
    }
  }
}
