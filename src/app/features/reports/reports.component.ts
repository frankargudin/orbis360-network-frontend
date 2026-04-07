import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-3 md:p-6 max-w-7xl mx-auto space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h2 class="text-lg md:text-xl font-bold text-wa-light-text dark:text-wa-dark-text">Reporte de Disponibilidad (SLA)</h2>
        <div class="flex gap-1.5">
          @for (p of periods; track p.hours) {
            <button (click)="load(p.hours)" [class]="selectedHours() === p.hours
              ? 'px-3 py-1 rounded-lg text-xs md:text-sm font-medium bg-wa-teal text-white'
              : 'px-3 py-1 rounded-lg text-xs md:text-sm font-medium bg-wa-light-surface dark:bg-wa-dark-surface border border-wa-light-border dark:border-wa-dark-border text-wa-light-text dark:text-wa-dark-text hover:bg-wa-light-bg dark:hover:bg-wa-dark-border transition-colors'">
              {{ p.label }}
            </button>
          }
        </div>
      </div>

      @if (report()) {
        <!-- Summary cards -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
          <div class="rounded-xl bg-wa-light-surface dark:bg-wa-dark-surface border border-wa-light-border dark:border-wa-dark-border p-3 text-center">
            <p class="text-2xl font-bold text-wa-light-text dark:text-wa-dark-text">{{ report()!.overall_availability }}%</p>
            <p class="text-[11px] text-wa-light-muted dark:text-wa-dark-muted">Disponibilidad general</p>
          </div>
          <div class="rounded-xl bg-wa-light-surface dark:bg-wa-dark-surface border border-wa-light-border dark:border-wa-dark-border p-3 text-center">
            <p class="text-2xl font-bold text-wa-light-text dark:text-wa-dark-text">{{ report()!.total_devices }}</p>
            <p class="text-[11px] text-wa-light-muted dark:text-wa-dark-muted">Total dispositivos</p>
          </div>
          <div class="rounded-xl bg-wa-light-surface dark:bg-wa-dark-surface border border-wa-light-border dark:border-wa-dark-border p-3 text-center">
            <p class="text-2xl font-bold text-status-up">{{ report()!.devices_meeting_sla }}</p>
            <p class="text-[11px] text-wa-light-muted dark:text-wa-dark-muted">Cumplen SLA (99.9%)</p>
          </div>
          <div class="rounded-xl bg-wa-light-surface dark:bg-wa-dark-surface border border-wa-light-border dark:border-wa-dark-border p-3 text-center">
            <p class="text-2xl font-bold text-status-down">{{ report()!.total_devices - report()!.devices_meeting_sla }}</p>
            <p class="text-[11px] text-wa-light-muted dark:text-wa-dark-muted">No cumplen SLA</p>
          </div>
        </div>

        <!-- Device table -->
        <div class="rounded-xl bg-wa-light-surface dark:bg-wa-dark-surface border border-wa-light-border dark:border-wa-dark-border overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b border-wa-light-border dark:border-wa-dark-border">
                  <th class="px-3 md:px-4 py-2 text-left text-xs font-semibold text-wa-light-muted dark:text-wa-dark-muted">Dispositivo</th>
                  <th class="px-3 md:px-4 py-2 text-left text-xs font-semibold text-wa-light-muted dark:text-wa-dark-muted">Tipo</th>
                  <th class="px-3 md:px-4 py-2 text-right text-xs font-semibold text-wa-light-muted dark:text-wa-dark-muted">Disponibilidad</th>
                  <th class="px-3 md:px-4 py-2 text-right text-xs font-semibold text-wa-light-muted dark:text-wa-dark-muted hidden sm:table-cell">Downtime</th>
                  <th class="px-3 md:px-4 py-2 text-right text-xs font-semibold text-wa-light-muted dark:text-wa-dark-muted hidden md:table-cell">Incidentes</th>
                  <th class="px-3 md:px-4 py-2 text-right text-xs font-semibold text-wa-light-muted dark:text-wa-dark-muted hidden md:table-cell">Latencia prom.</th>
                  <th class="px-3 md:px-4 py-2 text-center text-xs font-semibold text-wa-light-muted dark:text-wa-dark-muted">SLA</th>
                </tr>
              </thead>
              <tbody>
                @for (d of report()!.devices; track d.device_id) {
                  <tr class="border-b border-wa-light-border/50 dark:border-wa-dark-border/50 hover:bg-wa-light-bg/30 dark:hover:bg-wa-dark-border/30">
                    <td class="px-3 md:px-4 py-2">
                      <p class="text-sm font-semibold text-wa-light-text dark:text-wa-dark-text">{{ d.hostname }}</p>
                      <p class="text-[11px] font-mono text-wa-light-muted dark:text-wa-dark-muted">{{ d.ip_address }}</p>
                    </td>
                    <td class="px-3 md:px-4 py-2 text-xs text-wa-light-text dark:text-wa-dark-text capitalize">{{ d.device_type }}</td>
                    <td class="px-3 md:px-4 py-2 text-right">
                      <span class="text-sm font-bold" [class]="d.uptime_pct >= 99.9 ? 'text-status-up' : d.uptime_pct >= 95 ? 'text-status-degraded' : 'text-status-down'">
                        {{ d.uptime_pct }}%
                      </span>
                    </td>
                    <td class="px-3 md:px-4 py-2 text-right text-xs text-wa-light-muted dark:text-wa-dark-muted hidden sm:table-cell">{{ d.downtime_minutes }} min</td>
                    <td class="px-3 md:px-4 py-2 text-right text-xs text-wa-light-muted dark:text-wa-dark-muted hidden md:table-cell">{{ d.incidents_count }}</td>
                    <td class="px-3 md:px-4 py-2 text-right text-xs text-wa-light-muted dark:text-wa-dark-muted hidden md:table-cell">{{ d.avg_latency_ms }} ms</td>
                    <td class="px-3 md:px-4 py-2 text-center">
                      @if (d.sla_met) {
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">OK</span>
                      } @else {
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400">FALLA</span>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    </div>
  `,
})
export class ReportsComponent implements OnInit {
  private api = inject(ApiService);
  report = signal<any | null>(null);
  selectedHours = signal(720);

  periods = [
    { label: '24h', hours: 24 },
    { label: '7 días', hours: 168 },
    { label: '30 días', hours: 720 },
    { label: '90 días', hours: 2160 },
  ];

  ngOnInit(): void { this.load(720); }

  load(hours: number): void {
    this.selectedHours.set(hours);
    this.api.getAvailabilityReport(hours).subscribe(r => this.report.set(r));
  }
}
