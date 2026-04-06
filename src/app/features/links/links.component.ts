import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { Device, Link } from '../../shared/models/network.models';

@Component({
  selector: 'app-links',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-4 md:p-6 max-w-7xl mx-auto space-y-4">

      <div class="flex items-center justify-between">
        <h2 class="text-xl font-bold text-wa-light-text dark:text-wa-dark-text">Enlaces de Red</h2>
        <button (click)="showAdd.set(true)"
                class="px-3 py-1.5 rounded-lg bg-wa-teal text-white text-sm font-medium hover:bg-wa-teal-dark transition-colors flex items-center gap-1.5">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
          Agregar Enlace
        </button>
      </div>

      <!-- Tabla de enlaces -->
      <div class="rounded-xl bg-wa-light-surface dark:bg-wa-dark-surface border border-wa-light-border dark:border-wa-dark-border overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-wa-light-border dark:border-wa-dark-border">
                <th class="px-4 py-2 text-left text-xs font-semibold text-wa-light-muted dark:text-wa-dark-muted">Origen</th>
                <th class="px-4 py-2 text-left text-xs font-semibold text-wa-light-muted dark:text-wa-dark-muted">Puerto</th>
                <th class="px-4 py-2 text-center text-xs font-semibold text-wa-light-muted dark:text-wa-dark-muted">→</th>
                <th class="px-4 py-2 text-left text-xs font-semibold text-wa-light-muted dark:text-wa-dark-muted">Destino</th>
                <th class="px-4 py-2 text-left text-xs font-semibold text-wa-light-muted dark:text-wa-dark-muted">Puerto</th>
                <th class="px-4 py-2 text-left text-xs font-semibold text-wa-light-muted dark:text-wa-dark-muted">Tipo</th>
                <th class="px-4 py-2 text-left text-xs font-semibold text-wa-light-muted dark:text-wa-dark-muted">Ancho de banda</th>
                <th class="px-4 py-2 text-left text-xs font-semibold text-wa-light-muted dark:text-wa-dark-muted">Estado</th>
                <th class="px-4 py-2 text-right text-xs font-semibold text-wa-light-muted dark:text-wa-dark-muted">Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (link of links(); track link.id) {
                <tr class="border-b border-wa-light-border/50 dark:border-wa-dark-border/50 hover:bg-wa-light-bg/30 dark:hover:bg-wa-dark-border/30">
                  <td class="px-4 py-2 text-sm font-semibold text-wa-light-text dark:text-wa-dark-text">{{ deviceName(link.source_device_id) }}</td>
                  <td class="px-4 py-2 text-xs font-mono text-wa-light-muted dark:text-wa-dark-muted">{{ link.source_port || '-' }}</td>
                  <td class="px-4 py-2 text-center text-wa-light-muted dark:text-wa-dark-muted">→</td>
                  <td class="px-4 py-2 text-sm font-semibold text-wa-light-text dark:text-wa-dark-text">{{ deviceName(link.target_device_id) }}</td>
                  <td class="px-4 py-2 text-xs font-mono text-wa-light-muted dark:text-wa-dark-muted">{{ link.target_port || '-' }}</td>
                  <td class="px-4 py-2 text-xs text-wa-light-text dark:text-wa-dark-text capitalize">{{ linkTypeLabel(link.link_type) }}</td>
                  <td class="px-4 py-2 text-xs text-wa-light-muted dark:text-wa-dark-muted">{{ link.bandwidth_mbps ? link.bandwidth_mbps + ' Mbps' : '-' }}</td>
                  <td class="px-4 py-2">
                    <span class="inline-block w-2 h-2 rounded-full mr-1" [class]="link.status === 'active' ? 'bg-status-up' : link.status === 'down' ? 'bg-status-down' : 'bg-status-degraded'"></span>
                    <span class="text-xs font-semibold" [class]="link.status === 'active' ? 'text-status-up' : link.status === 'down' ? 'text-status-down' : 'text-status-degraded'">{{ linkStatusLabel(link.status) }}</span>
                  </td>
                  <td class="px-4 py-2 text-right">
                    <button (click)="linkToDelete.set(link)"
                            class="p-1 rounded hover:bg-red-50 dark:hover:bg-red-500/10 text-wa-light-muted hover:text-red-500 dark:hover:text-red-400 transition-colors" title="Eliminar">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/>
                      </svg>
                    </button>
                  </td>
                </tr>
              }
              @if (links().length === 0) {
                <tr><td colspan="9" class="px-4 py-8 text-center text-sm text-wa-light-muted dark:text-wa-dark-muted">No hay enlaces registrados</td></tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Diálogo agregar enlace -->
      @if (showAdd()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" (click)="showAdd.set(false)">
          <div class="w-full max-w-lg bg-wa-light-surface dark:bg-wa-dark-surface rounded-xl shadow-xl border border-wa-light-border dark:border-wa-dark-border p-6" (click)="$event.stopPropagation()">
            <h3 class="text-base font-semibold text-wa-light-text dark:text-wa-dark-text mb-4">Agregar Enlace</h3>
            <form (ngSubmit)="addLink()" class="space-y-3">
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-semibold text-wa-light-muted dark:text-wa-dark-muted mb-1">Dispositivo origen *</label>
                  <select [(ngModel)]="fl.source_device_id" name="source" required
                    class="w-full px-3 py-2 rounded-lg bg-wa-light-bg dark:bg-wa-dark-border border-none outline-none text-sm text-wa-light-text dark:text-wa-dark-text focus:ring-2 focus:ring-wa-teal">
                    <option [ngValue]="''">— Seleccionar —</option>
                    @for (d of devices(); track d.id) {
                      <option [ngValue]="d.id">{{ d.hostname }} ({{ d.ip_address }})</option>
                    }
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-wa-light-muted dark:text-wa-dark-muted mb-1">Dispositivo destino *</label>
                  <select [(ngModel)]="fl.target_device_id" name="target" required
                    class="w-full px-3 py-2 rounded-lg bg-wa-light-bg dark:bg-wa-dark-border border-none outline-none text-sm text-wa-light-text dark:text-wa-dark-text focus:ring-2 focus:ring-wa-teal">
                    <option [ngValue]="''">— Seleccionar —</option>
                    @for (d of devices(); track d.id) {
                      <option [ngValue]="d.id">{{ d.hostname }} ({{ d.ip_address }})</option>
                    }
                  </select>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-semibold text-wa-light-muted dark:text-wa-dark-muted mb-1">Puerto origen</label>
                  <input type="text" [(ngModel)]="fl.source_port" name="source_port" placeholder="Gi0/0"
                    class="w-full px-3 py-2 rounded-lg bg-wa-light-bg dark:bg-wa-dark-border border-none outline-none text-sm text-wa-light-text dark:text-wa-dark-text placeholder:text-wa-light-muted focus:ring-2 focus:ring-wa-teal" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-wa-light-muted dark:text-wa-dark-muted mb-1">Puerto destino</label>
                  <input type="text" [(ngModel)]="fl.target_port" name="target_port" placeholder="Te1/0/1"
                    class="w-full px-3 py-2 rounded-lg bg-wa-light-bg dark:bg-wa-dark-border border-none outline-none text-sm text-wa-light-text dark:text-wa-dark-text placeholder:text-wa-light-muted focus:ring-2 focus:ring-wa-teal" />
                </div>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-semibold text-wa-light-muted dark:text-wa-dark-muted mb-1">Tipo de enlace *</label>
                  <select [(ngModel)]="fl.link_type" name="link_type"
                    class="w-full px-3 py-2 rounded-lg bg-wa-light-bg dark:bg-wa-dark-border border-none outline-none text-sm text-wa-light-text dark:text-wa-dark-text focus:ring-2 focus:ring-wa-teal">
                    <option value="fiber">Fibra óptica</option>
                    <option value="copper">Cobre (UTP)</option>
                    <option value="wireless">Inalámbrico</option>
                    <option value="virtual">Virtual</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-wa-light-muted dark:text-wa-dark-muted mb-1">Ancho de banda (Mbps)</label>
                  <input type="number" [(ngModel)]="fl.bandwidth_mbps" name="bandwidth" placeholder="1000"
                    class="w-full px-3 py-2 rounded-lg bg-wa-light-bg dark:bg-wa-dark-border border-none outline-none text-sm text-wa-light-text dark:text-wa-dark-text placeholder:text-wa-light-muted focus:ring-2 focus:ring-wa-teal" />
                </div>
              </div>
              <div>
                <label class="block text-xs font-semibold text-wa-light-muted dark:text-wa-dark-muted mb-1">Descripción</label>
                <input type="text" [(ngModel)]="fl.description" name="description" placeholder="Enlace troncal piso 2 a piso 3"
                  class="w-full px-3 py-2 rounded-lg bg-wa-light-bg dark:bg-wa-dark-border border-none outline-none text-sm text-wa-light-text dark:text-wa-dark-text placeholder:text-wa-light-muted focus:ring-2 focus:ring-wa-teal" />
              </div>
              @if (addError()) {
                <div class="px-3 py-2 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm">{{ addError() }}</div>
              }
              <div class="flex justify-end gap-2 pt-2">
                <button type="button" (click)="showAdd.set(false)"
                  class="px-3 py-1.5 rounded-lg text-sm font-medium text-wa-light-muted dark:text-wa-dark-muted hover:bg-wa-light-bg dark:hover:bg-wa-dark-border transition-colors">Cancelar</button>
                <button type="submit" [disabled]="addLoading()"
                  class="px-3 py-1.5 rounded-lg bg-wa-teal text-white text-sm font-medium hover:bg-wa-teal-dark transition-colors disabled:opacity-50">
                  {{ addLoading() ? 'Guardando...' : 'Agregar Enlace' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Diálogo eliminar enlace -->
      @if (linkToDelete()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" (click)="linkToDelete.set(null)">
          <div class="w-full max-w-sm bg-wa-light-surface dark:bg-wa-dark-surface rounded-xl shadow-xl border border-wa-light-border dark:border-wa-dark-border p-6" (click)="$event.stopPropagation()">
            <h3 class="text-base font-semibold text-wa-light-text dark:text-wa-dark-text mb-2">Eliminar Enlace</h3>
            <p class="text-sm text-wa-light-muted dark:text-wa-dark-muted mb-4">
              ¿Eliminar enlace entre <strong class="text-wa-light-text dark:text-wa-dark-text">{{ deviceName(linkToDelete()!.source_device_id) }}</strong> y <strong class="text-wa-light-text dark:text-wa-dark-text">{{ deviceName(linkToDelete()!.target_device_id) }}</strong>?
            </p>
            <div class="flex justify-end gap-2">
              <button (click)="linkToDelete.set(null)"
                class="px-3 py-1.5 rounded-lg text-sm font-medium text-wa-light-muted dark:text-wa-dark-muted hover:bg-wa-light-bg dark:hover:bg-wa-dark-border transition-colors">Cancelar</button>
              <button (click)="deleteLink()"
                class="px-3 py-1.5 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors">Eliminar</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class LinksComponent implements OnInit {
  private api = inject(ApiService);
  links = signal<Link[]>([]);
  devices = signal<Device[]>([]);
  showAdd = signal(false);
  addLoading = signal(false);
  addError = signal('');
  linkToDelete = signal<Link | null>(null);

  fl = { source_device_id: '', target_device_id: '', source_port: '', target_port: '', link_type: 'copper', bandwidth_mbps: null as number | null, description: '' };

  ngOnInit(): void { this.loadAll(); }

  loadAll(): void {
    this.api.getLinks().subscribe(l => this.links.set(l));
    this.api.getDevices().subscribe(d => this.devices.set(d));
  }

  deviceName(id: string): string {
    return this.devices().find(d => d.id === id)?.hostname || id.slice(0, 8);
  }

  linkTypeLabel(t: string): string {
    return ({ fiber: 'Fibra', copper: 'Cobre', wireless: 'Inalámbrico', virtual: 'Virtual' } as Record<string, string>)[t] || t;
  }
  linkStatusLabel(s: string): string {
    return ({ active: 'Activo', down: 'Caído', degraded: 'Degradado' } as Record<string, string>)[s] || s;
  }

  addLink(): void {
    if (!this.fl.source_device_id || !this.fl.target_device_id) { this.addError.set('Selecciona dispositivo origen y destino'); return; }
    if (this.fl.source_device_id === this.fl.target_device_id) { this.addError.set('Origen y destino deben ser diferentes'); return; }
    this.addLoading.set(true); this.addError.set('');
    this.api.createLink({
      source_device_id: this.fl.source_device_id,
      target_device_id: this.fl.target_device_id,
      source_port: this.fl.source_port || null,
      target_port: this.fl.target_port || null,
      link_type: this.fl.link_type,
      bandwidth_mbps: this.fl.bandwidth_mbps,
      description: this.fl.description || null,
    } as any).subscribe({
      next: () => {
        this.showAdd.set(false); this.addLoading.set(false);
        this.fl = { source_device_id: '', target_device_id: '', source_port: '', target_port: '', link_type: 'copper', bandwidth_mbps: null, description: '' };
        this.loadAll();
      },
      error: (err) => { this.addError.set(err.error?.detail || 'Error al crear enlace'); this.addLoading.set(false); },
    });
  }

  deleteLink(): void {
    const link = this.linkToDelete();
    if (!link) return;
    this.api.deleteLink(link.id).subscribe({
      next: () => { this.linkToDelete.set(null); this.loadAll(); },
      error: () => this.linkToDelete.set(null),
    });
  }
}
