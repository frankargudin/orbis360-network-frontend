import { Component, OnInit, OnDestroy, inject } from '@angular/core';
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
    <header class="h-12 flex items-center px-3 gap-2 bg-wa-light-header dark:bg-wa-dark-header text-white shrink-0">
      @if (!isHome()) {
        <button (click)="goBack()" class="p-1.5 rounded hover:bg-white/10 transition-colors" title="Volver">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
          </svg>
        </button>
      }

      <span class="text-base font-semibold tracking-tight">Orbis360</span>
      <span class="text-xs text-white/60 hidden md:inline">Monitor de Red</span>

      <nav class="flex items-center gap-1 ml-4">
        <a routerLink="/" routerLinkActive="bg-white/20" [routerLinkActiveOptions]="{exact:true}"
           class="px-3 py-1 rounded text-sm font-medium hover:bg-white/10 transition-colors">Panel</a>
        <a routerLink="/topology" routerLinkActive="bg-white/20"
           class="px-3 py-1 rounded text-sm font-medium hover:bg-white/10 transition-colors">Topología</a>
        <a routerLink="/devices" routerLinkActive="bg-white/20"
           class="px-3 py-1 rounded text-sm font-medium hover:bg-white/10 transition-colors">Dispositivos</a>
        <a routerLink="/incidents" routerLinkActive="bg-white/20"
           class="px-3 py-1 rounded text-sm font-medium hover:bg-white/10 transition-colors">Incidentes</a>
        <a routerLink="/links" routerLinkActive="bg-white/20"
           class="px-3 py-1 rounded text-sm font-medium hover:bg-white/10 transition-colors">Enlaces</a>
        <a routerLink="/locations" routerLinkActive="bg-white/20"
           class="px-3 py-1 rounded text-sm font-medium hover:bg-white/10 transition-colors">Ubicaciones</a>
      </nav>

      <div class="flex-1"></div>

      <div class="flex items-center gap-1.5 text-xs text-white/60">
        <span class="w-2 h-2 rounded-full" [class]="wsService.connected() ? 'bg-green-400' : 'bg-red-400'"></span>
        {{ wsService.connected() ? 'En vivo' : 'Desconectado' }}
      </div>

      <button (click)="theme.toggle()" class="p-1.5 rounded hover:bg-white/10 transition-colors" title="Cambiar tema">
        @if (theme.mode() === 'light') {
          <svg class="w-5 h-5 text-white/80" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"/>
          </svg>
        } @else {
          <svg class="w-5 h-5 text-white/80" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"/>
          </svg>
        }
      </button>

      <button (click)="logout()" class="p-1.5 rounded hover:bg-white/10 transition-colors text-white/80" title="Cerrar sesión">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"/>
        </svg>
      </button>
    </header>

    <main class="flex-1 overflow-auto">
      <router-outlet />
    </main>
  `,
  styles: [`:host { display: flex; flex-direction: column; height: 100vh; }`],
})
export class ShellComponent implements OnInit, OnDestroy {
  theme = inject(ThemeService);
  wsService = inject(WebSocketService);
  private store = inject(Store);
  private router = inject(Router);
  private location = inject(Location);
  private pollInterval: any;
  private unsubWs?: () => void;

  private currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(e => e.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  isHome = () => this.currentUrl() === '/';

  ngOnInit(): void {
    // Connect WebSocket
    this.wsService.connect();

    // Listen to real-time device changes
    this.unsubWs = this.wsService.on('device_status_change', (data) => {
      this.store.dispatch(DevicesActions.updateDeviceStatus({
        deviceId: data['device_id'] as string,
        status: data['status'] as DeviceStatus,
      }));
      this.store.dispatch(DevicesActions.loadSummary());
      this.store.dispatch(IncidentsActions.loadIncidents());
    });

    // Polling every 10s as fallback (WS may not be connected)
    this.refreshAll();
    this.pollInterval = setInterval(() => this.refreshAll(), 10_000);
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

  goBack(): void {
    this.location.back();
  }

  logout(): void {
    localStorage.removeItem('orbis360_token');
    this.wsService.disconnect();
    this.router.navigate(['/login']);
  }
}
