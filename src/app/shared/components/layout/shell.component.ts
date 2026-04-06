import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { Store } from '@ngrx/store';
import { filter, map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { ThemeService } from '../../../core/services/theme.service';
import { WebSocketService } from '../../../core/services/websocket.service';
import { DevicesActions } from '../../../store/devices/devices.actions';
import { IncidentsActions } from '../../../store/incidents/incidents.actions';
import { DeviceStatus } from '../../../shared/models/network.models';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <!-- Header -->
    <header class="h-12 flex items-center px-3 gap-2 bg-wa-light-header dark:bg-wa-dark-header text-white shrink-0 relative z-50">
      @if (!isHome()) {
        <button (click)="goBack()" class="p-1.5 rounded hover:bg-white/10 transition-colors shrink-0" title="Volver">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
        </button>
      }

      <span class="text-base font-semibold tracking-tight shrink-0">Orbis360</span>
      <span class="text-xs text-white/60 hidden lg:inline">Monitor de Red</span>

      <!-- Desktop nav -->
      <nav class="hidden md:flex items-center gap-1 ml-4">
        @for (link of navLinks; track link.path) {
          <a [routerLink]="link.path" routerLinkActive="bg-white/20" [routerLinkActiveOptions]="link.exact ? {exact:true} : {exact:false}"
             class="px-3 py-1 rounded text-sm font-medium hover:bg-white/10 transition-colors">{{ link.label }}</a>
        }
      </nav>

      <div class="flex-1"></div>

      <!-- Status + actions -->
      <div class="flex items-center gap-1.5 text-xs text-white/60 shrink-0">
        <span class="w-2 h-2 rounded-full" [class]="wsService.connected() ? 'bg-green-400' : 'bg-red-400'"></span>
        <span class="hidden sm:inline">{{ wsService.connected() ? 'En vivo' : 'Desconectado' }}</span>
      </div>

      <button (click)="theme.toggle()" class="p-1.5 rounded hover:bg-white/10 transition-colors shrink-0" title="Cambiar tema">
        @if (theme.mode() === 'light') {
          <svg class="w-5 h-5 text-white/80" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"/></svg>
        } @else {
          <svg class="w-5 h-5 text-white/80" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"/></svg>
        }
      </button>

      <!-- Mobile menu button -->
      <button (click)="mobileMenuOpen.set(!mobileMenuOpen())" class="md:hidden p-1.5 rounded hover:bg-white/10 transition-colors shrink-0" title="Menú">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          @if (mobileMenuOpen()) {
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
          } @else {
            <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"/>
          }
        </svg>
      </button>

      <button (click)="logout()" class="hidden sm:block p-1.5 rounded hover:bg-white/10 transition-colors text-white/80 shrink-0" title="Cerrar sesión">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"/></svg>
      </button>
    </header>

    <!-- Mobile nav dropdown -->
    @if (mobileMenuOpen()) {
      <div class="md:hidden absolute top-12 left-0 right-0 z-40 bg-wa-light-header dark:bg-wa-dark-header border-t border-white/10 shadow-lg">
        @for (link of navLinks; track link.path) {
          <a [routerLink]="link.path" (click)="mobileMenuOpen.set(false)"
             routerLinkActive="bg-white/20" [routerLinkActiveOptions]="link.exact ? {exact:true} : {exact:false}"
             class="block px-4 py-3 text-sm font-medium text-white hover:bg-white/10 transition-colors border-b border-white/5">
            {{ link.label }}
          </a>
        }
        <button (click)="logout(); mobileMenuOpen.set(false)"
                class="w-full text-left px-4 py-3 text-sm font-medium text-red-300 hover:bg-white/10 transition-colors">
          Cerrar sesión
        </button>
      </div>
    }

    <!-- Content -->
    <main class="flex-1 overflow-auto">
      <router-outlet />
    </main>
  `,
  styles: [`:host { display: flex; flex-direction: column; height: 100vh; position: relative; }`],
})
export class ShellComponent implements OnInit, OnDestroy {
  theme = inject(ThemeService);
  wsService = inject(WebSocketService);
  private store = inject(Store);
  private router = inject(Router);
  private location = inject(Location);
  private pollInterval: any;
  private unsubWs?: () => void;

  mobileMenuOpen = signal(false);

  navLinks = [
    { path: '/', label: 'Panel', exact: true },
    { path: '/topology', label: 'Topología', exact: false },
    { path: '/devices', label: 'Dispositivos', exact: false },
    { path: '/incidents', label: 'Incidentes', exact: false },
    { path: '/links', label: 'Enlaces', exact: false },
    { path: '/locations', label: 'Ubicaciones', exact: false },
  ];

  private currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(e => e.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  isHome = () => this.currentUrl() === '/';

  ngOnInit(): void {
    this.wsService.connect();
    this.unsubWs = this.wsService.on('device_status_change', (data) => {
      this.store.dispatch(DevicesActions.updateDeviceStatus({ deviceId: data['device_id'] as string, status: data['status'] as DeviceStatus }));
      this.store.dispatch(DevicesActions.loadSummary());
      this.store.dispatch(IncidentsActions.loadIncidents());
    });
    this.refreshAll();
    this.pollInterval = setInterval(() => this.refreshAll(), 10_000);

    // Close mobile menu on navigation
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => this.mobileMenuOpen.set(false));
  }

  ngOnDestroy(): void {
    this.unsubWs?.();
    clearInterval(this.pollInterval);
  }

  private refreshAll(): void {
    this.store.dispatch(DevicesActions.loadDevices());
    this.store.dispatch(DevicesActions.loadSummary());
    this.store.dispatch(IncidentsActions.loadIncidents());
  }

  goBack(): void { this.location.back(); }

  logout(): void {
    localStorage.removeItem('orbis360_token');
    this.wsService.disconnect();
    this.router.navigate(['/login']);
  }
}
