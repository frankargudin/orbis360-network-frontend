import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-discovery',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-3 md:p-6 max-w-5xl mx-auto space-y-4">
      <h2 class="text-lg md:text-xl font-bold text-wa-light-text dark:text-wa-dark-text">Autodescubrimiento de Red</h2>

      <!-- Scan form -->
      <div class="rounded-xl bg-wa-light-surface dark:bg-wa-dark-surface border border-wa-light-border dark:border-wa-dark-border p-4">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div class="sm:col-span-2">
            <label class="block text-xs font-semibold text-wa-light-muted dark:text-wa-dark-muted mb-1">Rango de red</label>
            <input type="text" [(ngModel)]="network" placeholder="192.168.1.0/24 ó 10.0.0.1-10.0.0.50"
              class="w-full px-3 py-2 rounded-lg bg-wa-light-bg dark:bg-wa-dark-border border-none outline-none text-sm text-wa-light-text dark:text-wa-dark-text placeholder:text-wa-light-muted focus:ring-2 focus:ring-wa-teal" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-wa-light-muted dark:text-wa-dark-muted mb-1">Comunidad SNMP</label>
            <input type="text" [(ngModel)]="community" placeholder="public"
              class="w-full px-3 py-2 rounded-lg bg-wa-light-bg dark:bg-wa-dark-border border-none outline-none text-sm text-wa-light-text dark:text-wa-dark-text placeholder:text-wa-light-muted focus:ring-2 focus:ring-wa-teal" />
          </div>
        </div>
        <div class="flex items-center justify-between mt-3">
          <p class="text-[11px] text-wa-light-muted dark:text-wa-dark-muted">Escanea hasta 256 IPs con ping + SNMP</p>
          <button (click)="scan()" [disabled]="scanning() || !network"
            class="px-4 py-2 rounded-lg bg-wa-teal text-white text-sm font-medium hover:bg-wa-teal-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {{ scanning() ? 'Escaneando...' : 'Escanear' }}
          </button>
        </div>
      </div>

      <!-- Results -->
      @if (result()) {
        <div class="rounded-xl bg-wa-light-surface dark:bg-wa-dark-surface border border-wa-light-border dark:border-wa-dark-border p-4">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-semibold text-wa-light-text dark:text-wa-dark-text">
              {{ result()!.found }} dispositivos encontrados <span class="text-wa-light-muted dark:text-wa-dark-muted font-normal">({{ result()!.scanned }} escaneados)</span>
            </h3>
          </div>

          @if (result()!.devices.length > 0) {
            <div class="space-y-2">
              @for (device of result()!.devices; track device.ip_address) {
                <div class="flex items-center justify-between p-3 rounded-lg bg-wa-light-bg dark:bg-wa-dark-border">
                  <div class="min-w-0">
                    <p class="text-sm font-semibold text-wa-light-text dark:text-wa-dark-text">
                      {{ device.hostname || device.ip_address }}
                    </p>
                    <p class="text-xs font-mono text-wa-light-muted dark:text-wa-dark-muted">{{ device.ip_address }}</p>
                    @if (device.description) {
                      <p class="text-[11px] text-wa-light-muted dark:text-wa-dark-muted truncate mt-0.5">{{ device.description }}</p>
                    }
                    <div class="flex gap-2 mt-1">
                      <span class="text-[10px]" [class]="device.reachable_ping ? 'text-status-up' : 'text-status-down'">
                        {{ device.reachable_ping ? '✓ Ping' : '✗ Ping' }}
                      </span>
                      <span class="text-[10px]" [class]="device.reachable_snmp ? 'text-status-up' : 'text-status-down'">
                        {{ device.reachable_snmp ? '✓ SNMP' : '✗ SNMP' }}
                      </span>
                    </div>
                  </div>
                  <button (click)="registerDevice(device)"
                    class="px-3 py-1.5 rounded-lg text-xs font-medium bg-wa-teal text-white hover:bg-wa-teal-dark transition-colors shrink-0"
                    [disabled]="device.registered">
                    {{ device.registered ? 'Registrado' : 'Registrar' }}
                  </button>
                </div>
              }
            </div>
          } @else {
            <p class="text-sm text-wa-light-muted dark:text-wa-dark-muted text-center py-4">No se encontraron dispositivos en este rango</p>
          }
        </div>
      }
    </div>
  `,
})
export class DiscoveryComponent {
  private api = inject(ApiService);

  network = '';
  community = 'public';
  scanning = signal(false);
  result = signal<any | null>(null);

  scan(): void {
    if (!this.network) return;
    this.scanning.set(true);
    this.result.set(null);

    this.api.discoverNetwork(this.network, this.community).subscribe({
      next: (res) => {
        // Add 'registered' flag to each device
        res.devices = res.devices.map((d: any) => ({ ...d, registered: false }));
        this.result.set(res);
        this.scanning.set(false);
      },
      error: () => this.scanning.set(false),
    });
  }

  registerDevice(device: any): void {
    this.api.createDevice({
      hostname: device.hostname || `device-${device.ip_address.replace(/\./g, '-')}`,
      ip_address: device.ip_address,
      device_type: 'switch',
      snmp_community: this.community,
    } as any).subscribe({
      next: () => {
        device.registered = true;
        // Trigger reactivity
        this.result.update(r => r ? { ...r } : null);
      },
    });
  }
}
