import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-wa-light-bg dark:bg-wa-dark-bg px-4">
      <button (click)="theme.toggle()"
              class="absolute top-4 right-4 p-2 rounded-lg bg-wa-light-surface dark:bg-wa-dark-surface border border-wa-light-border dark:border-wa-dark-border text-wa-light-muted dark:text-wa-dark-muted hover:text-wa-light-text dark:hover:text-wa-dark-text transition-colors">
        @if (theme.mode() === 'light') {
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"/></svg>
        } @else {
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"/></svg>
        }
      </button>

      <div class="w-full max-w-sm bg-wa-light-surface dark:bg-wa-dark-surface rounded-xl shadow-sm border border-wa-light-border dark:border-wa-dark-border p-8">
        <div class="text-center mb-8">
          <h1 class="text-2xl font-bold text-wa-light-text dark:text-wa-dark-text">Orbis360</h1>
          <p class="text-sm text-wa-light-muted dark:text-wa-dark-muted mt-1">Plataforma de Monitoreo de Red</p>
        </div>

        <form (ngSubmit)="login()" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-wa-light-muted dark:text-wa-dark-muted mb-1.5">Usuario</label>
            <input type="text" [(ngModel)]="username" name="username" required placeholder="admin"
                   class="w-full px-3 py-2.5 rounded-lg bg-wa-light-bg dark:bg-wa-dark-border border-none outline-none text-sm text-wa-light-text dark:text-wa-dark-text placeholder:text-wa-light-muted focus:ring-2 focus:ring-wa-teal" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-wa-light-muted dark:text-wa-dark-muted mb-1.5">Contraseña</label>
            <input type="password" [(ngModel)]="password" name="password" required placeholder="Contraseña"
                   class="w-full px-3 py-2.5 rounded-lg bg-wa-light-bg dark:bg-wa-dark-border border-none outline-none text-sm text-wa-light-text dark:text-wa-dark-text placeholder:text-wa-light-muted focus:ring-2 focus:ring-wa-teal" />
          </div>

          @if (error()) {
            <div class="px-3 py-2 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm">{{ error() }}</div>
          }

          <button type="submit" [disabled]="loading()"
                  class="w-full px-4 py-2.5 rounded-lg bg-wa-teal text-white text-sm font-medium hover:bg-wa-teal-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {{ loading() ? 'Ingresando...' : 'Iniciar Sesión' }}
          </button>
        </form>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private api = inject(ApiService);
  private router = inject(Router);
  private authService = inject(AuthService);
  theme = inject(ThemeService);

  username = '';
  password = '';
  error = signal('');
  loading = signal(false);

  login(): void {
    this.loading.set(true);
    this.error.set('');
    this.api.login(this.username, this.password).subscribe({
      next: (res) => {
        localStorage.setItem('orbis360_token', res.access_token);
        this.authService.updateFromToken();
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.error.set(err.error?.detail || 'Error al iniciar sesión');
        this.loading.set(false);
      },
    });
  }
}
