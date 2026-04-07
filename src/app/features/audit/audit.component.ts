import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-audit',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-3 md:p-6 max-w-5xl mx-auto space-y-4">
      <h2 class="text-lg md:text-xl font-bold text-wa-light-text dark:text-wa-dark-text">Registro de Auditoría</h2>

      <div class="rounded-xl bg-wa-light-surface dark:bg-wa-dark-surface border border-wa-light-border dark:border-wa-dark-border overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-wa-light-border dark:border-wa-dark-border">
                <th class="px-3 md:px-4 py-2 text-left text-xs font-semibold text-wa-light-muted dark:text-wa-dark-muted">Fecha</th>
                <th class="px-3 md:px-4 py-2 text-left text-xs font-semibold text-wa-light-muted dark:text-wa-dark-muted">Acción</th>
                <th class="px-3 md:px-4 py-2 text-left text-xs font-semibold text-wa-light-muted dark:text-wa-dark-muted">Entidad</th>
                <th class="px-3 md:px-4 py-2 text-left text-xs font-semibold text-wa-light-muted dark:text-wa-dark-muted hidden sm:table-cell">Nombre</th>
                <th class="px-3 md:px-4 py-2 text-left text-xs font-semibold text-wa-light-muted dark:text-wa-dark-muted hidden md:table-cell">Detalles</th>
                <th class="px-3 md:px-4 py-2 text-left text-xs font-semibold text-wa-light-muted dark:text-wa-dark-muted hidden md:table-cell">Usuario</th>
              </tr>
            </thead>
            <tbody>
              @for (entry of entries(); track entry.id) {
                <tr class="border-b border-wa-light-border/50 dark:border-wa-dark-border/50 hover:bg-wa-light-bg/30 dark:hover:bg-wa-dark-border/30">
                  <td class="px-3 md:px-4 py-2 text-xs text-wa-light-muted dark:text-wa-dark-muted whitespace-nowrap">{{ entry.created_at | date:'short' }}</td>
                  <td class="px-3 md:px-4 py-2">
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                      [class]="entry.action === 'create' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                        : entry.action === 'delete' ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
                        : entry.action === 'reboot' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400'">
                      {{ actionLabel(entry.action) }}
                    </span>
                  </td>
                  <td class="px-3 md:px-4 py-2 text-xs text-wa-light-text dark:text-wa-dark-text capitalize">{{ entry.entity_type }}</td>
                  <td class="px-3 md:px-4 py-2 text-xs font-medium text-wa-light-text dark:text-wa-dark-text hidden sm:table-cell">{{ entry.entity_name || '-' }}</td>
                  <td class="px-3 md:px-4 py-2 text-[11px] text-wa-light-muted dark:text-wa-dark-muted hidden md:table-cell truncate max-w-[200px]">{{ entry.details || '-' }}</td>
                  <td class="px-3 md:px-4 py-2 text-[11px] text-wa-light-muted dark:text-wa-dark-muted font-mono hidden md:table-cell">{{ entry.user_id?.slice(0, 8) || '-' }}</td>
                </tr>
              }
              @if (entries().length === 0) {
                <tr><td colspan="6" class="px-4 py-8 text-center text-sm text-wa-light-muted dark:text-wa-dark-muted">Sin registros de auditoría</td></tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
})
export class AuditComponent implements OnInit {
  private api = inject(ApiService);
  entries = signal<any[]>([]);

  ngOnInit(): void {
    this.api.getAuditLog(100).subscribe(e => this.entries.set(e));
  }

  actionLabel(a: string): string {
    return ({ create: 'Crear', update: 'Editar', delete: 'Eliminar', reboot: 'Reiniciar', login: 'Login' } as Record<string, string>)[a] || a;
  }
}
