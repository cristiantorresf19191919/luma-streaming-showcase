import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { I18nService } from '../core/i18n.service';
import { LibraryStore } from '../core/library.store';
import { AuthService } from '../core/auth.service';
import { Icon } from '../shared/icon';
@Component({
  selector: 'luma-profile',
  imports: [RouterLink, Icon, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<section class="account-page page-shell">
    <div class="account-story">
      <span class="section-kicker">MOVIE / {{ text('YOUR FRONT ROW', 'TU PRIMERA FILA') }}</span>
      <h1>
        {{ text('Great stories.', 'Grandes historias.') }}<br /><em>{{
          text('Your own space.', 'Tu propio espacio.')
        }}</em>
      </h1>
      <p>
        {{
          text(
            'A place for the films you love, and the ones you haven’t discovered yet.',
            'Un lugar para las películas que amas y las que aún te esperan.'
          )
        }}
      </p>
      <div class="account-still">
        <img src="/images/invisibles.jpg" alt="Invisible’s" /><span
          >{{ text('IN THE SPOTLIGHT', 'EN PRIMER PLANO') }}<strong>INVISIBLE’S</strong></span
        >
      </div>
      <small>{{
        text(
          'An independent cinema showcase. Made for curious minds.',
          'Una muestra de cine independiente. Para mentes curiosas.'
        )
      }}</small>
    </div>
    <div class="account-card">
      @if (!auth.ready()) {
        <p role="status">{{ text('Opening your space…', 'Abriendo tu espacio…') }}</p>
      } @else if (auth.user(); as user) {
        <span class="section-kicker">{{ text('YOUR ACCOUNT', 'TU CUENTA') }}</span>
        <div class="profile-avatar">{{ auth.initial() }}</div>
        <h2>
          {{ text('Welcome,', 'Hola,') }} {{ user.displayName || user.email?.split('@')?.[0] }}
        </h2>
        <p class="muted account-email">{{ user.email }}</p>
        @if (!user.emailVerified) {
          <div class="auth-message">
            <p>
              {{
                text(
                  'Verify your email before purchasing a film.',
                  'Verifica tu correo antes de comprar una película.'
                )
              }}
            </p>
            <button class="text-button" [disabled]="busy()" (click)="run('verify')">
              {{ text('Send verification email', 'Enviar correo de verificación') }}
            </button>
            <button class="text-button" [disabled]="busy()" (click)="run('refresh')">
              {{ text('I have verified my email', 'Ya verifiqué mi correo') }}
            </button>
          </div>
        }
        <a class="profile-row" routerLink="/list"
          ><luma-icon name="bookmark" /><span
            >{{ i18n.t('profile.list')
            }}<small
              >{{ store.saved().length }} {{ text('saved films', 'películas guardadas') }}</small
            ></span
          ><luma-icon name="arrow"
        /></a>
        <p role="status" class="muted">{{ store.statusText() }}</p>
        <a class="button primary" routerLink="/movies">{{
          text('Find your next film', 'Descubre tu próxima película')
        }}</a>
        <button class="text-button" (click)="run('logout')" [disabled]="busy()">
          {{ text('Sign out', 'Cerrar sesión') }}
        </button>
      } @else {
        <span class="section-kicker">{{ text('MAKE YOURSELF AT HOME', 'ESTÁS EN CASA') }}</span>
        <h2>
          {{
            mode() === 'signup'
              ? text('Your story starts here.', 'Tu historia empieza aquí.')
              : mode() === 'reset'
                ? text('A fresh start.', 'Un nuevo comienzo.')
                : text('Welcome back.', 'Qué bueno verte.')
          }}
        </h2>
        <p class="muted">
          {{
            mode() === 'reset'
              ? text(
                  'We’ll send you a link to reset your password.',
                  'Te enviaremos un enlace para cambiar tu contraseña.'
                )
              : text('Step into your own corner of cinema.', 'Entra a tu propio rincón de cine.')
          }}
        </p>
        @if (!auth.configured) {
          <p role="status" class="auth-message">
            {{
              text(
                'Account setup is in progress. You can still explore the films.',
                'Estamos preparando las cuentas. Mientras tanto, explora las películas.'
              )
            }}
          </p>
        }
        @if (mode() !== 'reset') {
          <button
            class="button google-button"
            [disabled]="busy() || !auth.configured"
            (click)="run('google')"
          >
            <span aria-hidden="true">G</span
            >{{ text('Continue with Google', 'Continuar con Google') }}
          </button>
          <div class="auth-divider">
            <span>{{ text('or with email', 'o con tu correo') }}</span>
          </div>
        }
        <form #form="ngForm" (ngSubmit)="form.valid && run(mode())">
          @if (mode() === 'signup') {
            <label for="name">{{ text('Your name', 'Tu nombre') }}</label
            ><input
              id="name"
              name="name"
              [(ngModel)]="name"
              required
              maxlength="60"
              autocomplete="name"
            />
          }
          <label for="email">{{ text('Email address', 'Correo electrónico') }}</label
          ><input
            id="email"
            name="email"
            type="email"
            [(ngModel)]="email"
            required
            email
            autocomplete="email"
            placeholder="you@example.com"
          />
          @if (mode() !== 'reset') {
            <label for="password">{{ text('Password', 'Contraseña') }}</label>
            <div class="password-field">
              <input
                id="password"
                name="password"
                [type]="showPassword() ? 'text' : 'password'"
                [(ngModel)]="password"
                required
                [minlength]="mode() === 'signup' ? 8 : 1"
                [attr.autocomplete]="mode() === 'signup' ? 'new-password' : 'current-password'"
              /><button
                type="button"
                class="text-button"
                [attr.aria-pressed]="showPassword()"
                (click)="showPassword.set(!showPassword())"
              >
                {{ showPassword() ? text('Hide', 'Ocultar') : text('Show', 'Mostrar') }}
              </button>
            </div>
            @if (mode() === 'signup') {
              <small class="muted">{{
                text('Use at least 8 characters.', 'Usa al menos 8 caracteres.')
              }}</small>
            }
          }
          <button
            class="button primary auth-submit"
            type="submit"
            [disabled]="busy() || !auth.configured || !form.valid"
          >
            {{
              busy()
                ? text('One moment…', 'Un momento…')
                : mode() === 'signup'
                  ? text('Create account', 'Crear cuenta')
                  : mode() === 'reset'
                    ? text('Send reset link', 'Enviar enlace')
                    : text('Sign in', 'Iniciar sesión')
            }}<luma-icon name="arrow" />
          </button>
        </form>
        @if (mode() === 'signin') {
          <button class="text-button" (click)="switchMode('reset')">
            {{ text('Forgot password?', '¿Olvidaste tu contraseña?') }}
          </button>
        }
        <div class="auth-switch">
          {{
            mode() === 'signin'
              ? text('New here?', '¿Primera vez aquí?')
              : text('Already have an account?', '¿Ya tienes cuenta?')
          }}
          <button
            class="text-button"
            (click)="switchMode(mode() === 'signin' ? 'signup' : 'signin')"
          >
            {{
              mode() === 'signin'
                ? text('Join the audience', 'Únete al público')
                : text('Sign in', 'Iniciar sesión')
            }}
          </button>
        </div>
        <a class="guest-link" routerLink="/movies"
          >{{ text('Keep exploring as a guest', 'Seguir explorando como invitado') }} →</a
        >
      }
      @if (message()) {
        <p class="auth-message" [class.auth-error]="error()" role="status">{{ message() }}</p>
      }
    </div>
  </section>`,
})
export class Profile {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly auth = inject(AuthService);
  readonly store = inject(LibraryStore);
  readonly i18n = inject(I18nService);
  readonly mode = signal<'signin' | 'signup' | 'reset'>('signin');
  readonly busy = signal(false);
  readonly message = signal('');
  readonly error = signal(false);
  readonly showPassword = signal(false);
  name = '';
  email = '';
  password = '';
  text(en: string, es: string): string {
    return this.i18n.lang() === 'es' ? es : en;
  }
  switchMode(mode: 'signin' | 'signup' | 'reset'): void {
    this.mode.set(mode);
    this.message.set('');
    this.password = '';
    this.showPassword.set(false);
  }
  async run(action: string): Promise<void> {
    if (this.busy()) return;
    this.busy.set(true);
    this.message.set('');
    this.error.set(false);
    try {
      if (action === 'verify') {
        await this.auth.verifyEmail();
        this.message.set(
          this.text(
            'Verification email sent. Check your inbox.',
            'Correo de verificación enviado. Revisa tu bandeja.',
          ),
        );
      } else if (action === 'refresh') {
        await this.auth.refreshUser();
        this.message.set(
          this.auth.user()?.emailVerified
            ? this.text('Email verified. You’re ready.', 'Correo verificado. Todo listo.')
            : this.text(
                'Not verified yet. Open the link in your email.',
                'Aún no está verificado. Abre el enlace de tu correo.',
              ),
        );
      } else if (action === 'google') await this.auth.google();
      else if (action === 'logout') await this.auth.logout();
      else if (action === 'reset') {
        await this.auth.reset(this.email.trim());
        this.message.set(
          this.text(
            'If an account exists, a reset link is on its way. Check your inbox.',
            'Si existe una cuenta, recibirás un enlace. Revisa tu correo.',
          ),
        );
      } else
        await this.auth.email(
          this.email.trim(),
          this.password,
          action === 'signup' ? this.name : undefined,
        );
      this.password = '';
      const returnTo = this.route.snapshot.queryParamMap.get('returnTo');
      if (
        ['google', 'signin', 'signup'].includes(action) &&
        returnTo &&
        /^\/title\/(invisibles|dune)$/.test(returnTo)
      )
        await this.router.navigateByUrl(returnTo);
    } catch (error) {
      this.error.set(true);
      const code = (error as { code?: string }).code;
      const messages: Record<string, [string, string]> = {
        'auth/invalid-credential': [
          'Email or password is incorrect.',
          'El correo o la contraseña son incorrectos.',
        ],
        'auth/email-already-in-use': [
          'Unable to create this account. Try signing in or resetting your password.',
          'No se pudo crear la cuenta. Intenta iniciar sesión o cambiar la contraseña.',
        ],
        'auth/weak-password': [
          'Choose a stronger password with at least 8 characters.',
          'Elige una contraseña más segura de al menos 8 caracteres.',
        ],
        'auth/too-many-requests': [
          'Too many attempts. Please try again later.',
          'Demasiados intentos. Inténtalo más tarde.',
        ],
        'auth/network-request-failed': [
          'Check your connection and try again.',
          'Revisa tu conexión e inténtalo de nuevo.',
        ],
        'auth/popup-blocked': [
          'Allow the sign-in popup, or use email instead.',
          'Permite la ventana de acceso o usa tu correo.',
        ],
        'auth/popup-closed-by-user': [
          'Sign-in was cancelled. You can try again.',
          'Se canceló el acceso. Puedes intentarlo de nuevo.',
        ],
      };
      const message = messages[code || ''] || [
        'Sign-in is unavailable right now. Please try again shortly.',
        'El acceso no está disponible ahora. Inténtalo en un momento.',
      ];
      this.message.set(this.text(...message));
    } finally {
      this.busy.set(false);
    }
  }
}
