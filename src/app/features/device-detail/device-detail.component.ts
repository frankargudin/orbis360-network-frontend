import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { ApiService } from '../../core/services/api.service';
import { Device, Metric } from '../../shared/models/network.models';

Chart.register(...registerables);

@Component({
  selector: 'app-device-detail',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-3 md:p-6 max-w-7xl mx-auto space-y-4">

      <!-- Device Header -->
      @if (device()) {
        <div class="rounded-xl bg-wa-light-surface dark:bg-wa-dark-surface border border-wa-light-border dark:border-wa-dark-border p-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <span class="w-3 h-3 rounded-full shrink-0" [class]="device()!.status === 'up' ? 'bg-status-up' : device()!.status === 'down' ? 'bg-status-down animate-pulse-dot' : 'bg-status-degraded'"></span>
              <div>
                <h1 class="text-lg md:text-xl font-bold text-wa-light-text dark:text-wa-dark-text">{{ device()!.hostname }}</h1>
                <p class="text-xs md:text-sm text-wa-light-muted dark:text-wa-dark-muted font-mono">{{ device()!.ip_address }} · {{ device()!.vendor }} {{ device()!.model }}</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              @if (device()!.is_critical) {
                <span class="px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">CRÍTICO</span>
              }
              <span class="px-2 py-0.5 rounded text-xs font-semibold uppercase"
                [class]="device()!.status === 'up' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : device()!.status === 'down' ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'">
                {{ device()!.status }}
              </span>
            </div>
          </div>
        </div>
      }

      <!-- Period selector -->
      <div class="flex gap-1.5 flex-wrap">
        @for (p of periods; track p.hours) {
          <button (click)="loadMetrics(p.hours)" [class]="selectedHours() === p.hours
            ? 'px-3 py-1 rounded-lg text-xs md:text-sm font-medium bg-wa-teal text-white'
            : 'px-3 py-1 rounded-lg text-xs md:text-sm font-medium bg-wa-light-surface dark:bg-wa-dark-surface border border-wa-light-border dark:border-wa-dark-border text-wa-light-text dark:text-wa-dark-text hover:bg-wa-light-bg dark:hover:bg-wa-dark-border transition-colors'">
            {{ p.label }}
          </button>
        }
      </div>

      <!-- Charts grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        <!-- Latency -->
        <div class="rounded-xl bg-wa-light-surface dark:bg-wa-dark-surface border border-wa-light-border dark:border-wa-dark-border p-3 md:p-4">
          <h3 class="text-xs md:text-sm font-semibold text-wa-light-text dark:text-wa-dark-text mb-3">Latencia (ms)</h3>
          <div class="h-48 md:h-56"><canvas #latencyChart></canvas></div>
        </div>

        <!-- Packet Loss -->
        <div class="rounded-xl bg-wa-light-surface dark:bg-wa-dark-surface border border-wa-light-border dark:border-wa-dark-border p-3 md:p-4">
          <h3 class="text-xs md:text-sm font-semibold text-wa-light-text dark:text-wa-dark-text mb-3">Pérdida de Paquetes (%)</h3>
          <div class="h-48 md:h-56"><canvas #packetLossChart></canvas></div>
        </div>

        <!-- CPU -->
        <div class="rounded-xl bg-wa-light-surface dark:bg-wa-dark-surface border border-wa-light-border dark:border-wa-dark-border p-3 md:p-4">
          <h3 class="text-xs md:text-sm font-semibold text-wa-light-text dark:text-wa-dark-text mb-3">CPU (%)</h3>
          <div class="h-48 md:h-56"><canvas #cpuChart></canvas></div>
        </div>

        <!-- Memory -->
        <div class="rounded-xl bg-wa-light-surface dark:bg-wa-dark-surface border border-wa-light-border dark:border-wa-dark-border p-3 md:p-4">
          <h3 class="text-xs md:text-sm font-semibold text-wa-light-text dark:text-wa-dark-text mb-3">Memoria (%)</h3>
          <div class="h-48 md:h-56"><canvas #memoryChart></canvas></div>
        </div>
      </div>

      <!-- Stats summary -->
      @if (avgMetrics()) {
        <div class="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
          <div class="rounded-xl bg-wa-light-surface dark:bg-wa-dark-surface border border-wa-light-border dark:border-wa-dark-border p-3 text-center">
            <p class="text-xl md:text-2xl font-bold text-wa-light-text dark:text-wa-dark-text">{{ avgMetrics()!['avg_latency_ms'] ?? '-' }}</p>
            <p class="text-[11px] md:text-xs text-wa-light-muted dark:text-wa-dark-muted">Latencia prom. (ms)</p>
          </div>
          <div class="rounded-xl bg-wa-light-surface dark:bg-wa-dark-surface border border-wa-light-border dark:border-wa-dark-border p-3 text-center">
            <p class="text-xl md:text-2xl font-bold text-wa-light-text dark:text-wa-dark-text">{{ avgMetrics()!['avg_packet_loss_pct'] ?? '-' }}</p>
            <p class="text-[11px] md:text-xs text-wa-light-muted dark:text-wa-dark-muted">Pérdida prom. (%)</p>
          </div>
          <div class="rounded-xl bg-wa-light-surface dark:bg-wa-dark-surface border border-wa-light-border dark:border-wa-dark-border p-3 text-center">
            <p class="text-xl md:text-2xl font-bold text-wa-light-text dark:text-wa-dark-text">{{ avgMetrics()!['avg_cpu_usage_pct'] ?? '-' }}</p>
            <p class="text-[11px] md:text-xs text-wa-light-muted dark:text-wa-dark-muted">CPU prom. (%)</p>
          </div>
          <div class="rounded-xl bg-wa-light-surface dark:bg-wa-dark-surface border border-wa-light-border dark:border-wa-dark-border p-3 text-center">
            <p class="text-xl md:text-2xl font-bold text-wa-light-text dark:text-wa-dark-text">{{ avgMetrics()!['sample_count'] ?? 0 }}</p>
            <p class="text-[11px] md:text-xs text-wa-light-muted dark:text-wa-dark-muted">Muestras</p>
          </div>
        </div>
      }

      @if (metrics().length === 0 && !loading()) {
        <div class="text-center py-12 text-sm text-wa-light-muted dark:text-wa-dark-muted">
          Sin datos de métricas para este período
        </div>
      }

      <!-- Thresholds config -->
      <div class="rounded-xl bg-wa-light-surface dark:bg-wa-dark-surface border border-wa-light-border dark:border-wa-dark-border p-3 md:p-4">
        <h3 class="text-xs md:text-sm font-semibold text-wa-light-text dark:text-wa-dark-text mb-3">Umbrales de Alerta</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          @for (m of metricDefs; track m.key) {
            <div class="flex items-center gap-2 p-2 rounded-lg bg-wa-light-bg dark:bg-wa-dark-border">
              <div class="flex-1 min-w-0">
                <p class="text-xs font-medium text-wa-light-text dark:text-wa-dark-text">{{ m.label }}</p>
                <div class="flex gap-2 mt-1">
                  <div class="flex-1">
                    <label class="text-[10px] text-wa-light-muted dark:text-wa-dark-muted">Aviso</label>
                    <input type="number" [value]="getThresholdValue(m.key, 'warning')" (change)="setThreshold(m.key, 'warning', $event)"
                      class="w-full px-2 py-1 rounded text-xs bg-wa-light-surface dark:bg-wa-dark-surface border border-wa-light-border dark:border-wa-dark-border text-wa-light-text dark:text-wa-dark-text" placeholder="-" />
                  </div>
                  <div class="flex-1">
                    <label class="text-[10px] text-wa-light-muted dark:text-wa-dark-muted">Crítico</label>
                    <input type="number" [value]="getThresholdValue(m.key, 'critical')" (change)="setThreshold(m.key, 'critical', $event)"
                      class="w-full px-2 py-1 rounded text-xs bg-wa-light-surface dark:bg-wa-dark-surface border border-wa-light-border dark:border-wa-dark-border text-wa-light-text dark:text-wa-dark-text" placeholder="-" />
                  </div>
                </div>
              </div>
            </div>
          }
        </div>
        <p class="text-[11px] text-wa-light-muted dark:text-wa-dark-muted mt-2">Se generará un incidente automáticamente cuando una métrica supere el umbral configurado.</p>
      </div>

      <!-- Maintenance Windows -->
      <div class="rounded-xl bg-wa-light-surface dark:bg-wa-dark-surface border border-wa-light-border dark:border-wa-dark-border p-3 md:p-4">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-xs md:text-sm font-semibold text-wa-light-text dark:text-wa-dark-text">Mantenimiento Programado</h3>
          <button (click)="showMaintForm.set(!showMaintForm())"
            class="px-2 py-1 rounded text-xs font-medium bg-wa-teal text-white hover:bg-wa-teal-dark transition-colors">
            {{ showMaintForm() ? 'Cancelar' : '+ Programar' }}
          </button>
        </div>

        @if (showMaintForm()) {
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3 p-3 rounded-lg bg-wa-light-bg dark:bg-wa-dark-border">
            <div>
              <label class="block text-[10px] text-wa-light-muted dark:text-wa-dark-muted mb-0.5">Título</label>
              <input type="text" #maintTitle placeholder="Actualización de firmware"
                class="w-full px-2 py-1.5 rounded text-xs bg-wa-light-surface dark:bg-wa-dark-surface border border-wa-light-border dark:border-wa-dark-border text-wa-light-text dark:text-wa-dark-text" />
            </div>
            <div>
              <label class="block text-[10px] text-wa-light-muted dark:text-wa-dark-muted mb-0.5">Descripción</label>
              <input type="text" #maintDesc placeholder="Opcional"
                class="w-full px-2 py-1.5 rounded text-xs bg-wa-light-surface dark:bg-wa-dark-surface border border-wa-light-border dark:border-wa-dark-border text-wa-light-text dark:text-wa-dark-text" />
            </div>
            <div>
              <label class="block text-[10px] text-wa-light-muted dark:text-wa-dark-muted mb-0.5">Inicio</label>
              <input type="datetime-local" #maintStart
                class="w-full px-2 py-1.5 rounded text-xs bg-wa-light-surface dark:bg-wa-dark-surface border border-wa-light-border dark:border-wa-dark-border text-wa-light-text dark:text-wa-dark-text" />
            </div>
            <div>
              <label class="block text-[10px] text-wa-light-muted dark:text-wa-dark-muted mb-0.5">Fin</label>
              <input type="datetime-local" #maintEnd
                class="w-full px-2 py-1.5 rounded text-xs bg-wa-light-surface dark:bg-wa-dark-surface border border-wa-light-border dark:border-wa-dark-border text-wa-light-text dark:text-wa-dark-text" />
            </div>
            <div class="sm:col-span-2 flex justify-end">
              <button (click)="createMaintenance(maintTitle.value, maintDesc.value, maintStart.value, maintEnd.value)"
                class="px-3 py-1 rounded text-xs font-medium bg-wa-teal text-white hover:bg-wa-teal-dark transition-colors">
                Guardar
              </button>
            </div>
          </div>
        }

        <!-- List -->
        @if (maintenanceWindows().length > 0) {
          <div class="space-y-2">
            @for (mw of maintenanceWindows(); track mw.id) {
              <div class="flex items-center justify-between p-2 rounded-lg bg-wa-light-bg dark:bg-wa-dark-border">
                <div class="min-w-0">
                  <p class="text-xs font-medium text-wa-light-text dark:text-wa-dark-text truncate">{{ mw.title }}</p>
                  <p class="text-[10px] text-wa-light-muted dark:text-wa-dark-muted">
                    {{ mw.start_time | date:'short' }} → {{ mw.end_time | date:'short' }}
                  </p>
                </div>
                <button (click)="deleteMaintenance(mw.id)" class="p-1 rounded hover:bg-red-50 dark:hover:bg-red-500/10 text-wa-light-muted hover:text-red-500 transition-colors shrink-0">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>
                </button>
              </div>
            }
          </div>
        } @else if (!showMaintForm()) {
          <p class="text-[11px] text-wa-light-muted dark:text-wa-dark-muted">Sin mantenimientos programados. Durante una ventana de mantenimiento, las alertas del dispositivo se silencian automáticamente.</p>
        }
      </div>
    </div>
  `,
})
export class DeviceDetailComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('latencyChart') latencyCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('packetLossChart') packetLossCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('cpuChart') cpuCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('memoryChart') memoryCanvas!: ElementRef<HTMLCanvasElement>;

  private route = inject(ActivatedRoute);
  private api = inject(ApiService);

  device = signal<Device | null>(null);
  metrics = signal<Metric[]>([]);
  avgMetrics = signal<Record<string, unknown> | null>(null);
  thresholds = signal<any[]>([]);
  maintenanceWindows = signal<any[]>([]);
  showMaintForm = signal(false);
  loading = signal(false);
  selectedHours = signal(24);

  private charts: Chart[] = [];
  private pollInterval: any;
  private deviceId = '';

  metricDefs = [
    { key: 'latency_ms', label: 'Latencia (ms)' },
    { key: 'packet_loss_pct', label: 'Pérdida de paquetes (%)' },
    { key: 'cpu_usage_pct', label: 'CPU (%)' },
    { key: 'memory_usage_pct', label: 'Memoria (%)' },
  ];

  periods = [
    { label: '1h', hours: 1 },
    { label: '6h', hours: 6 },
    { label: '24h', hours: 24 },
    { label: '48h', hours: 48 },
    { label: '7 días', hours: 168 },
  ];

  ngOnInit(): void {
    this.deviceId = this.route.snapshot.params['id'];
    this.api.getDevice(this.deviceId).subscribe(d => this.device.set(d));
    this.api.getDeviceThresholds(this.deviceId).subscribe(t => this.thresholds.set(t));
    this.loadMaintenance();
  }

  private loadMaintenance(): void {
    this.api.getMaintenanceWindows(this.deviceId).subscribe(m => this.maintenanceWindows.set(m));
  }

  ngAfterViewInit(): void {
    this.loadMetrics(24);
    this.pollInterval = setInterval(() => this.loadMetrics(this.selectedHours()), 30_000);
  }

  ngOnDestroy(): void {
    clearInterval(this.pollInterval);
    this.charts.forEach(c => c.destroy());
  }

  loadMetrics(hours: number): void {
    this.selectedHours.set(hours);
    this.loading.set(true);

    this.api.getDeviceMetrics(this.deviceId, hours).subscribe(data => {
      this.metrics.set(data);
      this.loading.set(false);
      this.renderCharts(data);
    });

    this.api.getDeviceAvgMetrics(this.deviceId, hours).subscribe(avg => {
      this.avgMetrics.set(avg);
    });

    this.api.getDevice(this.deviceId).subscribe(d => this.device.set(d));
  }

  private renderCharts(data: Metric[]): void {
    this.charts.forEach(c => c.destroy());
    this.charts = [];

    const sorted = [...data].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const labels = sorted.map(m => this.formatTime(m.timestamp));

    const isDark = document.documentElement.classList.contains('dark');
    const gridColor = isDark ? 'rgba(42,57,66,0.5)' : 'rgba(233,237,239,0.8)';
    const textColor = isDark ? '#8696A0' : '#8696A0';

    const baseOptions: any = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { intersect: false, mode: 'index' },
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: textColor, font: { size: 10 }, maxTicksLimit: 8 }, grid: { color: gridColor } },
        y: { ticks: { color: textColor, font: { size: 10 } }, grid: { color: gridColor }, beginAtZero: true },
      },
    };

    // Latency
    this.charts.push(new Chart(this.latencyCanvas.nativeElement, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          data: sorted.map(m => m.latency_ms),
          borderColor: '#00A884',
          backgroundColor: 'rgba(0,168,132,0.1)',
          borderWidth: 1.5,
          fill: true,
          tension: 0.3,
          pointRadius: 0,
        }],
      },
      options: baseOptions,
    }));

    // Packet Loss
    this.charts.push(new Chart(this.packetLossCanvas.nativeElement, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          data: sorted.map(m => m.packet_loss_pct),
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239,68,68,0.1)',
          borderWidth: 1.5,
          fill: true,
          tension: 0.3,
          pointRadius: 0,
        }],
      },
      options: baseOptions,
    }));

    // CPU
    this.charts.push(new Chart(this.cpuCanvas.nativeElement, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          data: sorted.map(m => m.cpu_usage_pct),
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245,158,11,0.1)',
          borderWidth: 1.5,
          fill: true,
          tension: 0.3,
          pointRadius: 0,
        }],
      },
      options: { ...baseOptions, scales: { ...baseOptions.scales, y: { ...baseOptions.scales.y, max: 100 } } },
    }));

    // Memory
    this.charts.push(new Chart(this.memoryCanvas.nativeElement, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          data: sorted.map(m => m.memory_usage_pct),
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99,102,241,0.1)',
          borderWidth: 1.5,
          fill: true,
          tension: 0.3,
          pointRadius: 0,
        }],
      },
      options: { ...baseOptions, scales: { ...baseOptions.scales, y: { ...baseOptions.scales.y, max: 100 } } },
    }));
  }

  private formatTime(ts: string): string {
    const d = new Date(ts);
    const hours = this.selectedHours();
    if (hours <= 6) return d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
    if (hours <= 48) return d.toLocaleString('es', { day: '2-digit', hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString('es', { month: 'short', day: '2-digit', hour: '2-digit' });
  }

  // ── Thresholds ──────────────────────────────────────────────────────────────

  getThresholdValue(metricName: string, type: 'warning' | 'critical'): number | null {
    const t = this.thresholds().find((th: any) => th.metric_name === metricName);
    if (!t) return null;
    return type === 'warning' ? t.warning_value : t.critical_value;
  }

  createMaintenance(title: string, desc: string, start: string, end: string): void {
    if (!title || !start || !end) return;
    this.api.createMaintenance({
      device_id: this.deviceId,
      title,
      description: desc || null,
      start_time: new Date(start).toISOString(),
      end_time: new Date(end).toISOString(),
    }).subscribe(() => {
      this.showMaintForm.set(false);
      this.loadMaintenance();
    });
  }

  deleteMaintenance(id: string): void {
    this.api.deleteMaintenance(id).subscribe(() => this.loadMaintenance());
  }

  setThreshold(metricName: string, type: 'warning' | 'critical', event: Event): void {
    const value = parseFloat((event.target as HTMLInputElement).value) || null;
    const existing = this.thresholds().find((th: any) => th.metric_name === metricName);

    const data = {
      device_id: this.deviceId,
      metric_name: metricName,
      warning_value: type === 'warning' ? value : (existing?.warning_value ?? null),
      critical_value: type === 'critical' ? value : (existing?.critical_value ?? null),
      enabled: true,
    };

    this.api.saveThreshold(data).subscribe(() => {
      this.api.getDeviceThresholds(this.deviceId).subscribe(t => this.thresholds.set(t));
    });
  }
}
