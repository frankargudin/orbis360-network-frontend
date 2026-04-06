import { ApplicationConfig, provideBrowserGlobalErrorListeners, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { devicesFeature } from './store/devices/devices.state';
import { incidentsFeature } from './store/incidents/incidents.state';
import { topologyFeature } from './store/topology/topology.state';
import { DevicesEffects } from './store/devices/devices.effects';
import { IncidentsEffects } from './store/incidents/incidents.effects';
import { TopologyEffects } from './store/topology/topology.effects';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideStore({
      [devicesFeature.name]: devicesFeature.reducer,
      [incidentsFeature.name]: incidentsFeature.reducer,
      [topologyFeature.name]: topologyFeature.reducer,
    }),
    provideEffects(DevicesEffects, IncidentsEffects, TopologyEffects),
    provideStoreDevtools({ maxAge: 25, logOnly: !isDevMode() }),
  ],
};
