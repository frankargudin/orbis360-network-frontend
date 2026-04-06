import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { Location } from '../../shared/models/network.models';

@Component({
  selector: 'app-locations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-4 md:p-6 max-w-5xl mx-auto space-y-4">

      <div class="flex items-center justify-between">
        <h2 class="text-xl font-bold text-wa-light-text dark:text-wa-dark-text">Ubicaciones</h2>
        <button (click)="showAdd.set(true)"
                class="px-3 py-1.5 rounded-lg bg-wa-teal text-white text-sm font-medium hover:bg-wa-teal-dark transition-colors flex items-center gap-1.5">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
          Agregar Ubicación
        </button>
      </div>

      <div class="rounded-xl bg-wa-light-surface dark:bg-wa-dark-surface border border-wa-light-border dark:border-wa-dark-border overflow-hidden">
        <table class="w-full">
          <thead>
            <tr class="border-b border-wa-light-border dark:border-wa-dark-border">
              <th class="px-4 py-2 text-left text-xs font-semibold text-wa-light-muted dark:text-wa-dark-muted">Edificio</th>
              <th class="px-4 py-2 text-left text-xs font-semibold text-wa-light-muted dark:text-wa-dark-muted">Piso</th>
              <th class="px-4 py-2 text-left text-xs font-semibold text-wa-light-muted dark:text-wa-dark-muted">Nombre</th>
              <th class="px-4 py-2 text-left text-xs font-semibold text-wa-light-muted dark:text-wa-dark-muted">Área</th>
              <th class="px-4 py-2 text-right text-xs font-semibold text-wa-light-muted dark:text-wa-dark-muted">Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (loc of locations(); track loc.id) {
              <tr class="border-b border-wa-light-border/50 dark:border-wa-dark-border/50 hover:bg-wa-light-bg/30 dark:hover:bg-wa-dark-border/30">
                <td class="px-4 py-2 text-sm font-semibold text-wa-light-text dark:text-wa-dark-text">{{ loc.building }}</td>
                <td class="px-4 py-2 text-sm text-wa-light-text dark:text-wa-dark-text">{{ loc.floor || '-' }}</td>
                <td class="px-4 py-2 text-sm text-wa-light-text dark:text-wa-dark-text">{{ loc.name }}</td>
                <td class="px-4 py-2 text-sm text-wa-light-muted dark:text-wa-dark-muted">{{ loc.area || '-' }}</td>
                <td class="px-4 py-2 text-right">
                  <button (click)="locToDelete.set(loc)"
                    class="p-1 rounded hover:bg-red-50 dark:hover:bg-red-500/10 text-wa-light-muted hover:text-red-500 dark:hover:text-red-400 transition-colors" title="Eliminar">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/>
                    </svg>
                  </button>
                </td>
              </tr>
            }
            @if (locations().length === 0) {
              <tr><td colspan="5" class="px-4 py-8 text-center text-sm text-wa-light-muted dark:text-wa-dark-muted">Sin ubicaciones registradas</td></tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Agregar -->
      @if (showAdd()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" (click)="showAdd.set(false)">
          <div class="w-full max-w-md bg-wa-light-surface dark:bg-wa-dark-surface rounded-xl shadow-xl border border-wa-light-border dark:border-wa-dark-border p-6" (click)="$event.stopPropagation()">
            <h3 class="text-base font-semibold text-wa-light-text dark:text-wa-dark-text mb-4">Agregar Ubicación</h3>
            <form (ngSubmit)="addLocation()" class="space-y-3">
              <div>
                <label class="block text-xs font-semibold text-wa-light-muted dark:text-wa-dark-muted mb-1">Nombre *</label>
                <input type="text" [(ngModel)]="fn.name" name="name" required placeholder="Data Center Piso 1"
                  class="w-full px-3 py-2 rounded-lg bg-wa-light-bg dark:bg-wa-dark-border border-none outline-none text-sm text-wa-light-text dark:text-wa-dark-text placeholder:text-wa-light-muted focus:ring-2 focus:ring-wa-teal" />
              </div>
              <div class="grid grid-cols-3 gap-3">
                <div>
                  <label class="block text-xs font-semibold text-wa-light-muted dark:text-wa-dark-muted mb-1">Edificio *</label>
                  <input type="text" [(ngModel)]="fn.building" name="building" required placeholder="Torre A"
                    class="w-full px-3 py-2 rounded-lg bg-wa-light-bg dark:bg-wa-dark-border border-none outline-none text-sm text-wa-light-text dark:text-wa-dark-text placeholder:text-wa-light-muted focus:ring-2 focus:ring-wa-teal" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-wa-light-muted dark:text-wa-dark-muted mb-1">Piso</label>
                  <input type="text" [(ngModel)]="fn.floor" name="floor" placeholder="1"
                    class="w-full px-3 py-2 rounded-lg bg-wa-light-bg dark:bg-wa-dark-border border-none outline-none text-sm text-wa-light-text dark:text-wa-dark-text placeholder:text-wa-light-muted focus:ring-2 focus:ring-wa-teal" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-wa-light-muted dark:text-wa-dark-muted mb-1">Área</label>
                  <input type="text" [(ngModel)]="fn.area" name="area" placeholder="Networking"
                    class="w-full px-3 py-2 rounded-lg bg-wa-light-bg dark:bg-wa-dark-border border-none outline-none text-sm text-wa-light-text dark:text-wa-dark-text placeholder:text-wa-light-muted focus:ring-2 focus:ring-wa-teal" />
                </div>
              </div>
              <div class="flex justify-end gap-2 pt-2">
                <button type="button" (click)="showAdd.set(false)"
                  class="px-3 py-1.5 rounded-lg text-sm font-medium text-wa-light-muted dark:text-wa-dark-muted hover:bg-wa-light-bg dark:hover:bg-wa-dark-border transition-colors">Cancelar</button>
                <button type="submit"
                  class="px-3 py-1.5 rounded-lg bg-wa-teal text-white text-sm font-medium hover:bg-wa-teal-dark transition-colors">Agregar</button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Eliminar -->
      @if (locToDelete()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" (click)="locToDelete.set(null)">
          <div class="w-full max-w-sm bg-wa-light-surface dark:bg-wa-dark-surface rounded-xl shadow-xl border border-wa-light-border dark:border-wa-dark-border p-6" (click)="$event.stopPropagation()">
            <h3 class="text-base font-semibold text-wa-light-text dark:text-wa-dark-text mb-2">Eliminar Ubicación</h3>
            <p class="text-sm text-wa-light-muted dark:text-wa-dark-muted mb-4">¿Eliminar <strong class="text-wa-light-text dark:text-wa-dark-text">{{ locToDelete()!.name }}</strong>?</p>
            <div class="flex justify-end gap-2">
              <button (click)="locToDelete.set(null)" class="px-3 py-1.5 rounded-lg text-sm font-medium text-wa-light-muted dark:text-wa-dark-muted hover:bg-wa-light-bg dark:hover:bg-wa-dark-border transition-colors">Cancelar</button>
              <button (click)="deleteLocation()" class="px-3 py-1.5 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors">Eliminar</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class LocationsComponent implements OnInit {
  private api = inject(ApiService);
  locations = signal<Location[]>([]);
  showAdd = signal(false);
  locToDelete = signal<Location | null>(null);
  fn = { name: '', building: '', floor: '', area: '' };

  ngOnInit(): void { this.load(); }
  load(): void { this.api.getLocations().subscribe(l => this.locations.set(l)); }

  addLocation(): void {
    if (!this.fn.name || !this.fn.building) return;
    this.api.createLocation(this.fn as any).subscribe(() => {
      this.showAdd.set(false);
      this.fn = { name: '', building: '', floor: '', area: '' };
      this.load();
    });
  }

  deleteLocation(): void {
    const loc = this.locToDelete();
    if (!loc) return;
    this.api.deleteLocation(loc.id).subscribe({ next: () => { this.locToDelete.set(null); this.load(); }, error: () => this.locToDelete.set(null) });
  }
}
