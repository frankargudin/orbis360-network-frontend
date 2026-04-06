import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { selectDevicesSummary, selectDownDevices } from '../../store/devices/devices.state';
import { selectAllIncidents } from '../../store/incidents/incidents.state';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="p-4 md:p-6 max-w-7xl mx-auto space-y-4">

      <div class="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
        <div class="rounded-xl p-3 md:p-4 bg-wa-light-surface dark:bg-wa-dark-surface border border-wa-light-border dark:border-wa-dark-border">
          <p class="text-2xl md:text-3xl font-bold text-wa-light-text dark:text-wa-dark-text">{{ summary()?.total ?? 0 }}</p>
          <p class="text-xs font-medium text-wa-light-muted dark:text-wa-dark-muted mt-1">Total Dispositivos</p>
        </div>
        <div class="rounded-xl p-4 bg-wa-light-surface dark:bg-wa-dark-surface border border-wa-light-border dark:border-wa-dark-border">
          <p class="text-3xl font-bold text-status-up">{{ summary()?.up ?? 0 }}</p>
          <p class="text-xs font-medium text-wa-light-muted dark:text-wa-dark-muted mt-1">Activos</p>
        </div>
        <div class="rounded-xl p-4 bg-wa-light-surface dark:bg-wa-dark-surface border border-wa-light-border dark:border-wa-dark-border">
          <p class="text-3xl font-bold text-status-down">{{ summary()?.down ?? 0 }}</p>
          <p class="text-xs font-medium text-wa-light-muted dark:text-wa-dark-muted mt-1">Caídos</p>
        </div>
        <div class="rounded-xl p-4 bg-wa-light-surface dark:bg-wa-dark-surface border border-wa-light-border dark:border-wa-dark-border">
          <p class="text-3xl font-bold text-status-degraded">{{ summary()?.degraded ?? 0 }}</p>
          <p class="text-xs font-medium text-wa-light-muted dark:text-wa-dark-muted mt-1">Degradados</p>
        </div>
      </div>

      @if (downDevices().length > 0) {
        <div class="rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 p-4">
          <h2 class="text-sm font-semibold text-red-700 dark:text-red-400 mb-3">Caídas Activas</h2>
          <div class="space-y-2">
            @for (device of downDevices(); track device.id) {
              <div class="flex items-center gap-3 px-3 py-2 rounded-lg bg-wa-light-surface dark:bg-wa-dark-surface border-l-4 border-red-500">
                <span class="w-2.5 h-2.5 rounded-full bg-status-down animate-pulse-dot shrink-0"></span>
                <div class="min-w-0">
                  <p class="text-sm font-semibold text-wa-light-text dark:text-wa-dark-text truncate">{{ device.hostname }}</p>
                  <p class="text-xs text-wa-light-muted dark:text-wa-dark-muted">{{ device.ip_address }} — {{ device.consecutive_failures }} fallos consecutivos</p>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <div class="rounded-xl bg-wa-light-surface dark:bg-wa-dark-surface border border-wa-light-border dark:border-wa-dark-border overflow-hidden">
        <div class="px-4 py-3 border-b border-wa-light-border dark:border-wa-dark-border">
          <h2 class="text-sm font-semibold text-wa-light-text dark:text-wa-dark-text">Incidentes Recientes</h2>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-wa-light-border dark:border-wa-dark-border">
                <th class="px-4 py-2 text-left text-xs font-semibold text-wa-light-muted dark:text-wa-dark-muted">Severidad</th>
                <th class="px-4 py-2 text-left text-xs font-semibold text-wa-light-muted dark:text-wa-dark-muted">Título</th>
                <th class="px-4 py-2 text-left text-xs font-semibold text-wa-light-muted dark:text-wa-dark-muted">Estado</th>
                <th class="px-4 py-2 text-left text-xs font-semibold text-wa-light-muted dark:text-wa-dark-muted">Detectado</th>
              </tr>
            </thead>
            <tbody>
              @for (incident of recentIncidents(); track incident.id) {
                <tr class="border-b border-wa-light-border/50 dark:border-wa-dark-border/50 hover:bg-wa-light-bg/30 dark:hover:bg-wa-dark-border/30">
                  <td class="px-4 py-2">
                    <span class="inline-block px-2 py-0.5 rounded text-xs font-semibold" [class]="severityClass(incident.severity)">{{ severityLabel(incident.severity) }}</span>
                  </td>
                  <td class="px-4 py-2 text-sm text-wa-light-text dark:text-wa-dark-text">{{ incident.title }}</td>
                  <td class="px-4 py-2">
                    <span class="inline-block px-2 py-0.5 rounded text-xs font-semibold" [class]="statusClass(incident.status)">{{ statusLabel(incident.status) }}</span>
                  </td>
                  <td class="px-4 py-2 text-xs text-wa-light-muted dark:text-wa-dark-muted">{{ incident.detected_at | date:'short' }}</td>
                </tr>
              }
              @if (recentIncidents().length === 0) {
                <tr>
                  <td colspan="4" class="px-4 py-8 text-center text-sm text-wa-light-muted dark:text-wa-dark-muted">Sin incidentes registrados</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
})
export class DashboardComponent {
  private store = inject(Store);

  summary = this.store.selectSignal(selectDevicesSummary);
  downDevices = this.store.selectSignal(selectDownDevices);
  private allIncidents = this.store.selectSignal(selectAllIncidents);
  recentIncidents = computed(() => this.allIncidents().slice(0, 10));

  severityLabel(s: string): string {
    return ({ critical: 'Crítico', major: 'Mayor', minor: 'Menor', warning: 'Aviso' } as Record<string, string>)[s] || s;
  }
  statusLabel(s: string): string {
    return ({ open: 'Abierto', acknowledged: 'Reconocido', resolved: 'Resuelto' } as Record<string, string>)[s] || s;
  }
  severityClass(s: string): string {
    return ({ critical: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400', major: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400', minor: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400', warning: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' } as Record<string, string>)[s] || '';
  }
  statusClass(s: string): string {
    return ({ open: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400', acknowledged: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400', resolved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' } as Record<string, string>)[s] || '';
  }
}
