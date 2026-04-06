import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import cytoscape from 'cytoscape';
import { TopologyActions } from '../../store/topology/topology.actions';
import { selectRCAResults, selectTopologyLoading } from '../../store/topology/topology.state';
import { ThemeService } from '../../core/services/theme.service';
import { ApiService } from '../../core/services/api.service';
import { TopologyData } from '../../shared/models/network.models';

@Component({
  selector: 'app-topology',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col h-full">
      <div class="flex items-center justify-between px-4 py-3 border-b border-wa-light-border dark:border-wa-dark-border bg-wa-light-surface dark:bg-wa-dark-surface">
        <h2 class="text-base font-semibold text-wa-light-text dark:text-wa-dark-text">Topología de Red</h2>
        <div class="flex gap-2">
          <button (click)="refreshTopology()"
            class="px-3 py-1.5 rounded-lg text-sm font-medium bg-wa-light-bg dark:bg-wa-dark-border text-wa-light-text dark:text-wa-dark-text border border-wa-light-border dark:border-wa-dark-border hover:bg-wa-light-border dark:hover:bg-wa-dark-panel transition-colors">
            Actualizar
          </button>
          <button (click)="runRCA()" [disabled]="rcaLoading()"
            class="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {{ rcaLoading() ? 'Analizando...' : 'Análisis de Causa Raíz' }}
          </button>
          <button (click)="fitGraph()"
            class="px-3 py-1.5 rounded-lg text-sm font-medium bg-wa-light-bg dark:bg-wa-dark-border text-wa-light-text dark:text-wa-dark-text border border-wa-light-border dark:border-wa-dark-border hover:bg-wa-light-border dark:hover:bg-wa-dark-panel transition-colors">
            Ajustar
          </button>
        </div>
      </div>

      @if (rcaResults().length > 0) {
        <div class="mx-4 mt-3 rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 p-4">
          <h3 class="text-sm font-semibold text-amber-700 dark:text-amber-400 mb-2">Resultados del Análisis de Causa Raíz</h3>
          @for (result of rcaResults(); track result.root_cause_device_id) {
            <div class="flex items-start gap-3 mb-2 last:mb-0 bg-wa-light-surface dark:bg-wa-dark-surface rounded-lg p-3 border border-wa-light-border dark:border-wa-dark-border">
              <span class="shrink-0 px-2 py-0.5 rounded text-xs font-bold bg-amber-200 dark:bg-amber-500/30 text-amber-800 dark:text-amber-300">
                {{ (result.confidence * 100).toFixed(0) }}%
              </span>
              <div class="min-w-0">
                <p class="text-sm font-semibold text-wa-light-text dark:text-wa-dark-text">{{ result.root_cause_hostname }}</p>
                <p class="text-xs text-wa-light-muted dark:text-wa-dark-muted mt-0.5">{{ result.reasoning }}</p>
                <p class="text-xs text-red-500 dark:text-red-400 mt-1 font-medium">{{ result.affected_device_ids.length }} dispositivos afectados</p>
              </div>
            </div>
          }
        </div>
      }

      <div class="flex-1 m-4 rounded-xl border border-wa-light-border dark:border-wa-dark-border bg-wa-light-surface dark:bg-wa-dark-surface overflow-hidden relative">
        <div #cyContainer class="w-full h-full min-h-[500px]"></div>

        @if (selectedNode()) {
          <div class="absolute top-3 right-3 w-56 bg-wa-light-surface dark:bg-wa-dark-surface rounded-lg shadow-lg border border-wa-light-border dark:border-wa-dark-border p-3 z-10">
            <h4 class="text-sm font-semibold text-wa-light-text dark:text-wa-dark-text mb-2">{{ selectedNode()!['label'] }}</h4>
            <div class="space-y-1 text-xs">
              <div class="flex justify-between"><span class="text-wa-light-muted dark:text-wa-dark-muted">IP</span><span class="font-mono text-wa-light-text dark:text-wa-dark-text">{{ selectedNode()!['ip'] }}</span></div>
              <div class="flex justify-between"><span class="text-wa-light-muted dark:text-wa-dark-muted">Tipo</span><span class="text-wa-light-text dark:text-wa-dark-text">{{ selectedNode()!['type'] }}</span></div>
              <div class="flex justify-between"><span class="text-wa-light-muted dark:text-wa-dark-muted">Estado</span>
                <span class="flex items-center gap-1">
                  <span class="w-2 h-2 rounded-full" [class]="selectedNode()!['status'] === 'up' ? 'bg-status-up' : selectedNode()!['status'] === 'down' ? 'bg-status-down' : 'bg-status-degraded'"></span>
                  <span class="uppercase font-semibold" [class]="selectedNode()!['status'] === 'up' ? 'text-status-up' : selectedNode()!['status'] === 'down' ? 'text-status-down' : 'text-status-degraded'">{{ selectedNode()!['status'] }}</span>
                </span>
              </div>
              <div class="flex justify-between"><span class="text-wa-light-muted dark:text-wa-dark-muted">Crítico</span><span class="text-wa-light-text dark:text-wa-dark-text">{{ selectedNode()!['is_critical'] ? 'Sí' : 'No' }}</span></div>
            </div>
          </div>
        }
      </div>

      <div class="flex items-center gap-4 px-4 pb-3 text-xs text-wa-light-muted dark:text-wa-dark-muted">
        <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-status-up"></span> Activo</span>
        <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-status-down"></span> Caído</span>
        <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-status-degraded"></span> Degradado</span>
        <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-status-unknown"></span> Desconocido</span>
        <span class="ml-4">◆ Router  ■ Switch  ▲ AP  ⬡ Firewall</span>
      </div>
    </div>
  `,
  styles: [`:host { display: block; height: 100%; }`],
})
export class TopologyComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('cyContainer', { static: true }) cyContainer!: ElementRef;
  private store = inject(Store);
  private api = inject(ApiService);
  private themeService = inject(ThemeService);
  private cy: cytoscape.Core | null = null;

  rcaResults = this.store.selectSignal(selectRCAResults);
  rcaLoading = this.store.selectSignal(selectTopologyLoading);
  selectedNode = signal<Record<string, unknown> | null>(null);

  private pollInterval: any;
  private layoutDone = false;

  constructor() {
    effect(() => { this.themeService.mode(); if (this.cy) this.cy.style(this.getStyles() as any); });
  }

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.initCytoscape();
    this.fetchAndRender();
    // Poll every 10s — fetch directly from API and update Cytoscape
    this.pollInterval = setInterval(() => this.fetchAndRender(), 10_000);
  }

  ngOnDestroy(): void {
    clearInterval(this.pollInterval);
    this.cy?.destroy();
  }

  private fetchAndRender(): void {
    this.api.getTopology().subscribe(data => {
      if (!this.cy) return;
      this.updateCytoscape(data);
    });
  }

  private updateCytoscape(data: TopologyData): void {
    if (!this.cy) return;

    if (!this.layoutDone) {
      this.cy.elements().remove();
      this.cy.add([...data.nodes, ...data.edges] as any);
      this.cy.layout({ name: 'breadthfirst', directed: true, spacingFactor: 1.5 } as any).run();
      this.layoutDone = true;
    } else {
      // Update existing node/edge data without changing layout positions
      for (const node of data.nodes) {
        const el = this.cy.getElementById(node.data.id);
        if (el.length) {
          el.data('status', node.data.status);
          el.data('is_critical', node.data.is_critical);
        }
      }
      for (const edge of data.edges) {
        const el = this.cy.getElementById(edge.data.id);
        if (el.length) {
          el.data('status', edge.data.status);
        }
      }
    }
  }

  private initCytoscape(): void {
    this.cy = cytoscape({
      container: this.cyContainer.nativeElement,
      style: this.getStyles() as any,
      minZoom: 0.3,
      maxZoom: 3,
      wheelSensitivity: 0.2,
    });
    this.cy.on('tap', 'node', (evt) => this.selectedNode.set(evt.target.data()));
    this.cy.on('tap', (evt) => { if (evt.target === this.cy) this.selectedNode.set(null); });
  }

  private getStyles(): cytoscape.StylesheetStyle[] {
    const dark = this.themeService.mode() === 'dark';
    const txt = dark ? '#E9EDEF' : '#111B21';
    const edge = dark ? '#2A3942' : '#E9EDEF';
    return [
      { selector: 'node', style: { label: 'data(label)', 'text-valign': 'bottom', 'text-margin-y': 8, 'font-size': '11px', 'font-weight': 'bold', color: txt, width: 40, height: 40, 'border-width': 3, 'border-color': edge, 'background-color': '#8696A0' } },
      { selector: 'node[status="up"]', style: { 'background-color': '#22c55e', 'border-color': '#16a34a' } },
      { selector: 'node[status="down"]', style: { 'background-color': '#ef4444', 'border-color': '#dc2626' } },
      { selector: 'node[status="degraded"]', style: { 'background-color': '#f59e0b', 'border-color': '#d97706' } },
      { selector: 'node[is_critical]', style: { width: 55, height: 55, 'border-width': 4 } },
      { selector: 'node[type="router"]', style: { shape: 'diamond' } },
      { selector: 'node[type="switch"]', style: { shape: 'rectangle' } },
      { selector: 'node[type="access_point"]', style: { shape: 'triangle' } },
      { selector: 'node[type="firewall"]', style: { shape: 'hexagon' } },
      { selector: 'edge', style: { width: 2, 'line-color': edge, 'target-arrow-color': edge, 'target-arrow-shape': 'triangle', 'curve-style': 'bezier' } },
      { selector: 'edge[status="active"]', style: { 'line-color': '#22c55e', 'target-arrow-color': '#22c55e' } },
      { selector: 'edge[status="down"]', style: { 'line-color': '#ef4444', 'target-arrow-color': '#ef4444', 'line-style': 'dashed' } },
      { selector: 'edge[status="degraded"]', style: { 'line-color': '#f59e0b', 'target-arrow-color': '#f59e0b' } },
    ];
  }

  refreshTopology(): void {
    this.layoutDone = false;
    this.fetchAndRender();
  }

  runRCA(): void { this.store.dispatch(TopologyActions.runRCA()); }
  fitGraph(): void { this.cy?.fit(undefined, 50); }
}
