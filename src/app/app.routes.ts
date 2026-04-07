import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { ShellComponent } from './shared/components/layout/shell.component';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/dashboard/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'topology',
        loadComponent: () =>
          import('./features/topology/topology.component').then((m) => m.TopologyComponent),
      },
      {
        path: 'devices',
        loadComponent: () =>
          import('./features/devices/devices.component').then((m) => m.DevicesComponent),
      },
      {
        path: 'devices/:id',
        loadComponent: () =>
          import('./features/device-detail/device-detail.component').then((m) => m.DeviceDetailComponent),
      },
      {
        path: 'incidents',
        loadComponent: () =>
          import('./features/incidents/incidents.component').then((m) => m.IncidentsComponent),
      },
      {
        path: 'links',
        loadComponent: () =>
          import('./features/links/links.component').then((m) => m.LinksComponent),
      },
      {
        path: 'locations',
        loadComponent: () =>
          import('./features/locations/locations.component').then((m) => m.LocationsComponent),
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('./features/reports/reports.component').then((m) => m.ReportsComponent),
      },
      {
        path: 'audit',
        loadComponent: () =>
          import('./features/audit/audit.component').then((m) => m.AuditComponent),
      },
      {
        path: 'discovery',
        loadComponent: () =>
          import('./features/discovery/discovery.component').then((m) => m.DiscoveryComponent),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
