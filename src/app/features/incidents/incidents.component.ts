import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { IncidentsActions } from '../../store/incidents/incidents.actions';
import { selectAllIncidents, selectIncidentsLoading } from '../../store/incidents/incidents.state';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-incidents',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-4 md:p-6 max-w-7xl mx-auto space-y-4">
      <h2 class="text-xl font-bold text-wa-light-text dark:text-wa-dark-text">Historial de Incidentes</h2>

      <div class="rounded-xl bg-wa-light-surface dark:bg-wa-dark-surface border border-wa-light-border dark:border-wa-dark-border overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-wa-light-border dark:border-wa-dark-border">
                <th class="px-4 py-2 text-left text-xs font-semibold text-wa-light-muted dark:text-wa-dark-muted">Severidad</th>
                <th class="px-4 py-2 text-left text-xs font-semibold text-wa-light-muted dark:text-wa-dark-muted">Título</th>
                <th class="px-4 py-2 text-left text-xs font-semibold text-wa-light-muted dark:text-wa-dark-muted">Estado</th>
                <th class="px-4 py-2 text-left text-xs font-semibold text-wa-light-muted dark:text-wa-dark-muted">Causa Raíz</th>
                <th class="px-4 py-2 text-left text-xs font-semibold text-wa-light-muted dark:text-wa-dark-muted">Detectado</th>
                <th class="px-4 py-2 text-left text-xs font-semibold text-wa-light-muted dark:text-wa-dark-muted">Resuelto</th>
                <th class="px-4 py-2 text-right text-xs font-semibold text-wa-light-muted dark:text-wa-dark-muted">Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (incident of incidents(); track incident.id) {
                <tr class="border-b border-wa-light-border/50 dark:border-wa-dark-border/50 hover:bg-wa-light-bg/30 dark:hover:bg-wa-dark-border/30">
                  <td class="px-4 py-2">
                    <span class="inline-block px-2 py-0.5 rounded text-xs font-semibold" [class]="severityClass(incident.severity)">{{ severityLabel(incident.severity) }}</span>
                  </td>
                  <td class="px-4 py-2 text-sm text-wa-light-text dark:text-wa-dark-text">{{ incident.title }}</td>
                  <td class="px-4 py-2">
                    <span class="inline-block px-2 py-0.5 rounded text-xs font-semibold" [class]="statusClass(incident.status)">{{ statusLabel(incident.status) }}</span>
                  </td>
                  <td class="px-4 py-2 text-xs text-wa-light-muted dark:text-wa-dark-muted">{{ incident.root_cause_device_id ? 'Identificada' : 'Pendiente' }}</td>
                  <td class="px-4 py-2 text-xs text-wa-light-muted dark:text-wa-dark-muted">{{ incident.detected_at | date:'medium' }}</td>
                  <td class="px-4 py-2 text-xs text-wa-light-muted dark:text-wa-dark-muted">{{ incident.resolved_at ? (incident.resolved_at | date:'medium') : '-' }}</td>
                  <td class="px-4 py-2 text-right">
                    @if (incident.status === 'open') {
                      <button (click)="acknowledge(incident.id)"
                        class="px-2.5 py-1 rounded text-xs font-medium bg-wa-light-bg dark:bg-wa-dark-border text-wa-light-text dark:text-wa-dark-text hover:bg-wa-light-border dark:hover:bg-wa-dark-panel transition-colors">
                        Reconocer
                      </button>
                    }
                    @if (incident.status === 'acknowledged') {
                      <button (click)="resolve(incident.id)"
                        class="px-2.5 py-1 rounded text-xs font-medium bg-wa-teal text-white hover:bg-wa-teal-dark transition-colors">
                        Resolver
                      </button>
                    }
                  </td>
                </tr>
              }
              @if (incidents().length === 0) {
                <tr>
                  <td colspan="7" class="px-4 py-8 text-center text-sm text-wa-light-muted dark:text-wa-dark-muted">Sin incidentes registrados</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
})
export class IncidentsComponent implements OnInit {
  private store = inject(Store);
  private api = inject(ApiService);
  incidents = this.store.selectSignal(selectAllIncidents);
  loading = this.store.selectSignal(selectIncidentsLoading);

  ngOnInit(): void { this.store.dispatch(IncidentsActions.loadIncidents()); }

  acknowledge(id: string): void {
    this.api.updateIncident(id, { status: 'acknowledged' } as any).subscribe(() => this.store.dispatch(IncidentsActions.loadIncidents()));
  }
  resolve(id: string): void {
    this.api.updateIncident(id, { status: 'resolved' } as any).subscribe(() => this.store.dispatch(IncidentsActions.loadIncidents()));
  }

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
