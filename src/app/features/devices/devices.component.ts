import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { DevicesActions } from '../../store/devices/devices.actions';
import { selectAllDevices, selectDevicesLoading } from '../../store/devices/devices.state';
import { ApiService } from '../../core/services/api.service';
import { Device, Location } from '../../shared/models/network.models';

// ── Reusable CSS classes ─────────────────────────────────────────────────────
const INPUT = 'w-full px-3 py-2 rounded-lg bg-wa-light-bg dark:bg-wa-dark-border border-none outline-none text-sm text-wa-light-text dark:text-wa-dark-text placeholder:text-wa-light-muted focus:ring-2 focus:ring-wa-teal';
const LABEL = 'block text-xs font-semibold text-wa-light-muted dark:text-wa-dark-muted mb-1';
const TH = 'px-4 py-2 text-left text-xs font-semibold text-wa-light-muted dark:text-wa-dark-muted';
const TD = 'px-4 py-2';
const ROW = 'border-b border-wa-light-border/50 dark:border-wa-dark-border/50 hover:bg-wa-light-bg/30 dark:hover:bg-wa-dark-border/30';

@Component({
  selector: 'app-devices',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-4 md:p-6 max-w-7xl mx-auto space-y-4">

      <!-- Header -->
      <div class="flex items-center justify-between gap-2">
        <h2 class="text-lg md:text-xl font-bold text-wa-light-text dark:text-wa-dark-text">Dispositivos de Red</h2>
        <button (click)="openAdd()"
                class="px-2.5 md:px-3 py-1.5 rounded-lg bg-wa-teal text-white text-xs md:text-sm font-medium hover:bg-wa-teal-dark transition-colors flex items-center gap-1 shrink-0">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
          <span class="hidden sm:inline">Agregar</span> Dispositivo
        </button>
      </div>

      <!-- Filtros -->
      <div class="flex gap-1.5 flex-wrap">
        @for (f of filters; track f.value) {
          <button (click)="filterStatus.set(f.value)"
            [class]="filterStatus() === f.value
              ? 'px-3 py-1 rounded-lg text-sm font-medium bg-wa-teal text-white'
              : 'px-3 py-1 rounded-lg text-sm font-medium bg-wa-light-surface dark:bg-wa-dark-surface border border-wa-light-border dark:border-wa-dark-border text-wa-light-text dark:text-wa-dark-text hover:bg-wa-light-bg dark:hover:bg-wa-dark-border transition-colors'">
            {{ f.label }}
          </button>
        }
      </div>

      <!-- Mobile: Cards -->
      <div class="md:hidden space-y-2">
        @for (device of filteredDevices(); track device.id) {
          <div class="rounded-xl bg-wa-light-surface dark:bg-wa-dark-surface border border-wa-light-border dark:border-wa-dark-border p-3">
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2 min-w-0">
                <span class="w-2.5 h-2.5 rounded-full shrink-0" [class]="dotClass(device.status)"></span>
                <span class="text-sm font-semibold text-wa-light-text dark:text-wa-dark-text truncate">{{ device.hostname }}</span>
                @if (device.is_critical) {
                  <span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 shrink-0">CRIT</span>
                }
              </div>
              <div class="flex items-center gap-1 shrink-0">
                <button (click)="viewMetrics(device)" class="p-1.5 rounded hover:bg-wa-light-bg dark:hover:bg-wa-dark-border text-wa-light-muted hover:text-wa-teal transition-colors" title="Métricas">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"/></svg>
                </button>
                <button (click)="deviceToReboot.set(device)" class="p-1.5 rounded hover:bg-amber-50 dark:hover:bg-amber-500/10 text-wa-light-muted hover:text-amber-500 transition-colors">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M21.015 4.356v4.992"/></svg>
                </button>
                <button (click)="openEdit(device)" class="p-1.5 rounded hover:bg-wa-light-bg dark:hover:bg-wa-dark-border text-wa-light-muted hover:text-wa-teal transition-colors">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"/></svg>
                </button>
                <button (click)="deviceToDelete.set(device)" class="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-500/10 text-wa-light-muted hover:text-red-500 transition-colors">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>
                </button>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <div><span class="text-wa-light-muted dark:text-wa-dark-muted">IP:</span> <span class="font-mono text-wa-light-text dark:text-wa-dark-text">{{ device.ip_address }}</span></div>
              <div><span class="text-wa-light-muted dark:text-wa-dark-muted">Tipo:</span> <span class="text-wa-light-text dark:text-wa-dark-text">{{ typeLabel(device.device_type) }}</span></div>
              <div><span class="text-wa-light-muted dark:text-wa-dark-muted">Fabricante:</span> <span class="text-wa-light-text dark:text-wa-dark-text">{{ device.vendor || '-' }}</span></div>
              <div><span class="text-wa-light-muted dark:text-wa-dark-muted">Estado:</span> <span class="font-semibold uppercase" [class]="textClass(device.status)">{{ statusLabel(device.status) }}</span></div>
            </div>
          </div>
        }
        @if (filteredDevices().length === 0) {
          <div class="text-center py-8 text-sm text-wa-light-muted dark:text-wa-dark-muted">No se encontraron dispositivos</div>
        }
      </div>

      <!-- Desktop: Table -->
      <div class="hidden md:block rounded-xl bg-wa-light-surface dark:bg-wa-dark-surface border border-wa-light-border dark:border-wa-dark-border overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-wa-light-border dark:border-wa-dark-border">
                <th class="${TH}">Estado</th>
                <th class="${TH}">Nombre</th>
                <th class="${TH}">Dirección IP</th>
                <th class="${TH}">Tipo</th>
                <th class="${TH}">Fabricante / Modelo</th>
                <th class="${TH}">Ubicación</th>
                <th class="${TH}">Crítico</th>
                <th class="${TH}">Última vez</th>
                <th class="${TH} text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (device of filteredDevices(); track device.id) {
                <tr class="${ROW}">
                  <td class="${TD}">
                    <div class="flex items-center gap-1.5">
                      <span class="w-2.5 h-2.5 rounded-full shrink-0" [class]="dotClass(device.status)"></span>
                      <span class="text-xs font-semibold uppercase" [class]="textClass(device.status)">{{ statusLabel(device.status) }}</span>
                    </div>
                  </td>
                  <td class="${TD} text-sm font-semibold text-wa-light-text dark:text-wa-dark-text">{{ device.hostname }}</td>
                  <td class="${TD} text-sm font-mono text-wa-light-muted dark:text-wa-dark-muted">{{ device.ip_address }}</td>
                  <td class="${TD} text-sm text-wa-light-text dark:text-wa-dark-text">{{ typeLabel(device.device_type) }}</td>
                  <td class="${TD} text-sm text-wa-light-muted dark:text-wa-dark-muted">{{ device.vendor || '-' }} {{ device.model || '' }}</td>
                  <td class="${TD} text-xs text-wa-light-muted dark:text-wa-dark-muted">{{ locationName(device.location_id) }}</td>
                  <td class="${TD}">
                    @if (device.is_critical) {
                      <span class="px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">SÍ</span>
                    } @else {
                      <span class="text-xs text-wa-light-muted dark:text-wa-dark-muted">-</span>
                    }
                  </td>
                  <td class="${TD} text-xs text-wa-light-muted dark:text-wa-dark-muted">{{ device.last_seen ? (device.last_seen | date:'short') : 'Nunca' }}</td>
                  <td class="${TD} text-right">
                    <div class="flex items-center justify-end gap-1">
                      <button (click)="viewMetrics(device)" class="p-1 rounded hover:bg-wa-light-bg dark:hover:bg-wa-dark-border text-wa-light-muted hover:text-wa-teal transition-colors" title="Métricas">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"/></svg>
                      </button>
                      <button (click)="deviceToReboot.set(device)" class="p-1 rounded hover:bg-amber-50 dark:hover:bg-amber-500/10 text-wa-light-muted hover:text-amber-500 transition-colors" title="Reiniciar">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M21.015 4.356v4.992"/></svg>
                      </button>
                      <button (click)="openEdit(device)" class="p-1 rounded hover:bg-wa-light-bg dark:hover:bg-wa-dark-border text-wa-light-muted hover:text-wa-teal transition-colors" title="Editar">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"/></svg>
                      </button>
                      <button (click)="deviceToDelete.set(device)" class="p-1 rounded hover:bg-red-50 dark:hover:bg-red-500/10 text-wa-light-muted hover:text-red-500 transition-colors" title="Eliminar">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              }
              @if (filteredDevices().length === 0) {
                <tr><td colspan="9" class="px-4 py-8 text-center text-sm text-wa-light-muted dark:text-wa-dark-muted">No se encontraron dispositivos</td></tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- ═══════ DIÁLOGO AGREGAR / EDITAR ═══════ -->
      @if (dialogMode()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" (click)="closeDialog()">
          <div class="w-full max-w-lg mx-4 bg-wa-light-surface dark:bg-wa-dark-surface rounded-xl shadow-xl border border-wa-light-border dark:border-wa-dark-border p-6" (click)="$event.stopPropagation()">
            <h3 class="text-base font-semibold text-wa-light-text dark:text-wa-dark-text mb-4">
              {{ dialogMode() === 'add' ? 'Agregar Nuevo Dispositivo' : 'Editar Dispositivo' }}
            </h3>
            <form (ngSubmit)="saveDevice()" class="space-y-3">
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="${LABEL}">Nombre de host *</label>
                  <input type="text" [(ngModel)]="fd.hostname" name="hostname" required placeholder="switch-f4-01" class="${INPUT}" />
                </div>
                <div>
                  <label class="${LABEL}">Dirección IP *</label>
                  <input type="text" [(ngModel)]="fd.ip_address" name="ip_address" required placeholder="10.0.4.1" class="${INPUT}" />
                </div>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="${LABEL}">Tipo *</label>
                  <select [(ngModel)]="fd.device_type" name="device_type" class="${INPUT}">
                    <option value="router">Router</option>
                    <option value="switch">Switch</option>
                    <option value="access_point">Punto de Acceso</option>
                    <option value="firewall">Firewall</option>
                    <option value="server">Servidor</option>
                    <option value="ups">UPS</option>
                  </select>
                </div>
                <div>
                  <label class="${LABEL}">Ubicación</label>
                  <select [(ngModel)]="fd.location_id" name="location_id" class="${INPUT}">
                    <option [ngValue]="null">— Sin ubicación —</option>
                    @for (loc of locations(); track loc.id) {
                      <option [ngValue]="loc.id">{{ loc.building }} — {{ loc.name }}</option>
                    }
                  </select>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="${LABEL}">Fabricante</label>
                  <input type="text" [(ngModel)]="fd.vendor" name="vendor" placeholder="Cisco" class="${INPUT}" />
                </div>
                <div>
                  <label class="${LABEL}">Modelo</label>
                  <input type="text" [(ngModel)]="fd.model" name="model" placeholder="Catalyst 3850" class="${INPUT}" />
                </div>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="${LABEL}">Comunidad SNMP</label>
                  <input type="text" [(ngModel)]="fd.snmp_community" name="snmp_community" placeholder="public" class="${INPUT}" />
                </div>
                <div>
                  <label class="${LABEL}">Dispositivo padre</label>
                  <select [(ngModel)]="fd.parent_device_id" name="parent_device_id" class="${INPUT}">
                    <option [ngValue]="null">— Ninguno (raíz) —</option>
                    @for (d of allDevices(); track d.id) {
                      @if (d.id !== editingId()) {
                        <option [ngValue]="d.id">{{ d.hostname }} ({{ d.ip_address }})</option>
                      }
                    }
                  </select>
                </div>
              </div>
              <!-- SSH Credentials -->
              <div class="border-t border-wa-light-border dark:border-wa-dark-border pt-3 mt-1">
                <p class="text-xs font-semibold text-wa-light-muted dark:text-wa-dark-muted mb-2">Credenciales SSH (para reinicio remoto)</p>
                <div class="grid grid-cols-3 gap-3">
                  <div>
                    <label class="${LABEL}">Usuario SSH</label>
                    <input type="text" [(ngModel)]="fd.ssh_username" name="ssh_username" placeholder="admin" class="${INPUT}" />
                  </div>
                  <div>
                    <label class="${LABEL}">Contraseña SSH</label>
                    <input type="password" [(ngModel)]="fd.ssh_password" name="ssh_password" placeholder="••••••" class="${INPUT}" />
                  </div>
                  <div>
                    <label class="${LABEL}">Puerto SSH</label>
                    <input type="number" [(ngModel)]="fd.ssh_port" name="ssh_port" class="${INPUT}" />
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <input type="checkbox" [(ngModel)]="fd.is_critical" name="is_critical" id="dlg_critical"
                  class="rounded border-wa-light-border dark:border-wa-dark-border text-wa-teal focus:ring-wa-teal" />
                <label for="dlg_critical" class="text-sm text-wa-light-text dark:text-wa-dark-text">Infraestructura crítica</label>
              </div>
              @if (dialogError()) {
                <div class="px-3 py-2 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm">{{ dialogError() }}</div>
              }
              <div class="flex justify-end gap-2 pt-2">
                <button type="button" (click)="closeDialog()"
                  class="px-3 py-1.5 rounded-lg text-sm font-medium text-wa-light-muted dark:text-wa-dark-muted hover:bg-wa-light-bg dark:hover:bg-wa-dark-border transition-colors">
                  Cancelar
                </button>
                <button type="submit" [disabled]="dialogLoading()"
                  class="px-3 py-1.5 rounded-lg bg-wa-teal text-white text-sm font-medium hover:bg-wa-teal-dark transition-colors disabled:opacity-50">
                  {{ dialogLoading() ? 'Guardando...' : (dialogMode() === 'add' ? 'Agregar' : 'Guardar Cambios') }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- ═══════ DIÁLOGO ELIMINAR ═══════ -->
      @if (deviceToDelete()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" (click)="deviceToDelete.set(null)">
          <div class="w-full max-w-sm mx-4 bg-wa-light-surface dark:bg-wa-dark-surface rounded-xl shadow-xl border border-wa-light-border dark:border-wa-dark-border p-6" (click)="$event.stopPropagation()">
            <h3 class="text-base font-semibold text-wa-light-text dark:text-wa-dark-text mb-2">Eliminar Dispositivo</h3>
            <p class="text-sm text-wa-light-muted dark:text-wa-dark-muted mb-4">
              ¿Estás seguro de que deseas eliminar <strong class="text-wa-light-text dark:text-wa-dark-text">{{ deviceToDelete()!.hostname }}</strong> ({{ deviceToDelete()!.ip_address }})? Se eliminarán también todos sus enlaces. Esta acción no se puede deshacer.
            </p>
            <div class="flex justify-end gap-2">
              <button (click)="deviceToDelete.set(null)"
                class="px-3 py-1.5 rounded-lg text-sm font-medium text-wa-light-muted dark:text-wa-dark-muted hover:bg-wa-light-bg dark:hover:bg-wa-dark-border transition-colors">Cancelar</button>
              <button (click)="deleteDevice()"
                class="px-3 py-1.5 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors">Eliminar</button>
            </div>
          </div>
        </div>
      }

      <!-- ═══════ DIÁLOGO REINICIAR ═══════ -->
      @if (deviceToReboot()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" (click)="deviceToReboot.set(null)">
          <div class="w-full max-w-md mx-4 bg-wa-light-surface dark:bg-wa-dark-surface rounded-xl shadow-xl border border-wa-light-border dark:border-wa-dark-border p-6" (click)="$event.stopPropagation()">
            <div class="flex items-start gap-3 mb-4">
              <div class="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center shrink-0">
                <svg class="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
                </svg>
              </div>
              <div>
                <h3 class="text-base font-semibold text-wa-light-text dark:text-wa-dark-text">Reiniciar Dispositivo</h3>
                <p class="text-sm text-wa-light-muted dark:text-wa-dark-muted mt-1">
                  Vas a reiniciar <strong class="text-wa-light-text dark:text-wa-dark-text">{{ deviceToReboot()!.hostname }}</strong> ({{ deviceToReboot()!.ip_address }}) vía SSH.
                </p>
              </div>
            </div>

            @if (deviceToReboot()!.status === 'down') {
              <div class="px-3 py-2 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm mb-4">
                <strong>El dispositivo está caído.</strong> No es posible reiniciarlo vía SSH porque no responde. Verifica la conexión física, alimentación eléctrica o acceso al equipo presencialmente.
              </div>
            } @else if (!deviceToReboot()!.ssh_username) {
              <div class="px-3 py-2 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm mb-4">
                Este dispositivo no tiene credenciales SSH configuradas. Edita el dispositivo primero para agregar usuario y contraseña SSH.
              </div>
            } @else {
              <div class="px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 text-sm mb-4">
                <strong>Advertencia:</strong> El dispositivo dejará de responder temporalmente durante el reinicio. Todos los usuarios conectados a través de este equipo perderán conexión.
              </div>
            }

            @if (rebootResult()) {
              <div class="px-3 py-2 rounded-lg text-sm mb-4"
                [class]="rebootResult()!.success ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400'">
                <p class="font-semibold">{{ rebootResult()!.success ? 'Reinicio enviado exitosamente' : 'Error al reiniciar' }}</p>
                <p class="mt-1 text-xs font-mono">{{ rebootResult()!.output || rebootResult()!.error }}</p>
                <p class="mt-1 text-xs">Comando: {{ rebootResult()!.command_sent }}</p>
              </div>
            }

            <div class="flex justify-end gap-2">
              <button (click)="deviceToReboot.set(null); rebootResult.set(null)"
                class="px-3 py-1.5 rounded-lg text-sm font-medium text-wa-light-muted dark:text-wa-dark-muted hover:bg-wa-light-bg dark:hover:bg-wa-dark-border transition-colors">
                {{ rebootResult() ? 'Cerrar' : 'Cancelar' }}
              </button>
              @if (!rebootResult()) {
                <button (click)="rebootDevice()" [disabled]="rebootLoading() || !deviceToReboot()!.ssh_username || deviceToReboot()!.status === 'down'"
                  class="px-3 py-1.5 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  {{ rebootLoading() ? 'Reiniciando...' : 'Confirmar Reinicio' }}
                </button>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class DevicesComponent implements OnInit {
  private store = inject(Store);
  private api = inject(ApiService);
  private router = inject(Router);

  allDevices = this.store.selectSignal(selectAllDevices);
  loading = this.store.selectSignal(selectDevicesLoading);
  locations = signal<Location[]>([]);
  filterStatus = signal<string | null>(null);

  // Dialog state
  dialogMode = signal<'add' | 'edit' | null>(null);
  dialogLoading = signal(false);
  dialogError = signal('');
  editingId = signal<string | null>(null);
  deviceToDelete = signal<Device | null>(null);
  deviceToReboot = signal<Device | null>(null);
  rebootLoading = signal(false);
  rebootResult = signal<import('../../shared/models/network.models').RebootResponse | null>(null);

  // Form data
  fd = this.emptyForm();

  filters = [
    { label: 'Todos', value: null },
    { label: 'Activos', value: 'up' },
    { label: 'Caídos', value: 'down' },
    { label: 'Degradados', value: 'degraded' },
    { label: 'Desconocidos', value: 'unknown' },
  ];

  filteredDevices = computed(() => {
    const f = this.filterStatus();
    const devices = this.allDevices();
    return f ? devices.filter(d => d.status === f) : devices;
  });

  ngOnInit(): void {
    this.store.dispatch(DevicesActions.loadDevices());
    this.api.getLocations().subscribe(locs => this.locations.set(locs));
  }

  // ── Dialog helpers ────────────────────────────────────────────────────────

  openAdd(): void {
    this.fd = this.emptyForm();
    this.editingId.set(null);
    this.dialogError.set('');
    this.dialogMode.set('add');
  }

  openEdit(device: Device): void {
    this.fd = {
      hostname: device.hostname,
      ip_address: device.ip_address,
      device_type: device.device_type,
      vendor: device.vendor || '',
      model: device.model || '',
      snmp_community: device.snmp_community || '',
      ssh_username: device.ssh_username || '',
      ssh_password: '',
      ssh_port: device.ssh_port || 22,
      is_critical: device.is_critical,
      location_id: device.location_id,
      parent_device_id: device.parent_device_id,
    };
    this.editingId.set(device.id);
    this.dialogError.set('');
    this.dialogMode.set('edit');
  }

  closeDialog(): void {
    this.dialogMode.set(null);
  }

  saveDevice(): void {
    if (!this.fd.hostname || !this.fd.ip_address) {
      this.dialogError.set('Nombre de host y dirección IP son obligatorios');
      return;
    }
    this.dialogLoading.set(true);
    this.dialogError.set('');

    const payload: any = {
      hostname: this.fd.hostname,
      ip_address: this.fd.ip_address,
      device_type: this.fd.device_type,
      vendor: this.fd.vendor || null,
      model: this.fd.model || null,
      snmp_community: this.fd.snmp_community || null,
      ssh_username: this.fd.ssh_username || null,
      ssh_password: this.fd.ssh_password || null,
      ssh_port: this.fd.ssh_port,
      is_critical: this.fd.is_critical,
      location_id: this.fd.location_id || null,
      parent_device_id: this.fd.parent_device_id || null,
    };
    // Don't send empty ssh_password on edit (keep existing)
    if (this.dialogMode() === 'edit' && !this.fd.ssh_password) {
      delete payload.ssh_password;
    }

    const req$ = this.dialogMode() === 'edit'
      ? this.api.updateDevice(this.editingId()!, payload)
      : this.api.createDevice(payload);

    req$.subscribe({
      next: () => {
        this.dialogLoading.set(false);
        this.closeDialog();
        this.store.dispatch(DevicesActions.loadDevices());
        this.store.dispatch(DevicesActions.loadSummary());
      },
      error: (err) => {
        this.dialogError.set(err.error?.detail || 'Error al guardar dispositivo');
        this.dialogLoading.set(false);
      },
    });
  }

  deleteDevice(): void {
    const device = this.deviceToDelete();
    if (!device) return;
    this.api.deleteDevice(device.id).subscribe({
      next: () => {
        this.deviceToDelete.set(null);
        this.store.dispatch(DevicesActions.loadDevices());
        this.store.dispatch(DevicesActions.loadSummary());
      },
      error: () => this.deviceToDelete.set(null),
    });
  }

  viewMetrics(device: Device): void {
    this.router.navigate(['/devices', device.id]);
  }

  // ── Display helpers ───────────────────────────────────────────────────────

  locationName(id: string | null): string {
    if (!id) return '-';
    const loc = this.locations().find(l => l.id === id);
    return loc ? `${loc.building} P${loc.floor}` : '-';
  }

  statusLabel(s: string): string {
    return ({ up: 'Activo', down: 'Caído', degraded: 'Degradado', unknown: 'Desconocido', maintenance: 'Mantenimiento' } as Record<string, string>)[s] || s;
  }
  typeLabel(t: string): string {
    return ({ router: 'Router', switch: 'Switch', access_point: 'Punto de Acceso', firewall: 'Firewall', server: 'Servidor', ups: 'UPS' } as Record<string, string>)[t] || t;
  }
  dotClass(status: string): string {
    return ({ up: 'bg-status-up', down: 'bg-status-down animate-pulse-dot', degraded: 'bg-status-degraded', unknown: 'bg-status-unknown', maintenance: 'bg-status-maintenance' } as Record<string, string>)[status] || 'bg-status-unknown';
  }
  textClass(status: string): string {
    return ({ up: 'text-status-up', down: 'text-status-down', degraded: 'text-status-degraded', unknown: 'text-wa-light-muted dark:text-wa-dark-muted', maintenance: 'text-status-maintenance' } as Record<string, string>)[status] || '';
  }

  rebootDevice(): void {
    const device = this.deviceToReboot();
    if (!device) return;
    this.rebootLoading.set(true);
    this.rebootResult.set(null);
    this.api.rebootDevice(device.id).subscribe({
      next: (result) => {
        this.rebootLoading.set(false);
        this.rebootResult.set(result);
        // Refresh devices after a short delay (device will be temporarily unreachable)
        setTimeout(() => {
          this.store.dispatch(DevicesActions.loadDevices());
          this.store.dispatch(DevicesActions.loadSummary());
        }, 3000);
      },
      error: (err) => {
        this.rebootLoading.set(false);
        this.rebootResult.set({
          success: false,
          device_id: device.id,
          hostname: device.hostname,
          command_sent: '-',
          output: '',
          error: err.error?.detail || 'Error de conexión',
        });
      },
    });
  }

  private emptyForm() {
    return { hostname: '', ip_address: '', device_type: 'switch', vendor: '', model: '', snmp_community: '', ssh_username: '', ssh_password: '', ssh_port: 22, is_critical: false, location_id: null as string | null, parent_device_id: null as string | null };
  }
}
