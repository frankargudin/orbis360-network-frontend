import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Incident } from '../../shared/models/network.models';

export const IncidentsActions = createActionGroup({
  source: 'Incidents',
  events: {
    'Load Incidents': emptyProps(),
    'Load Incidents Success': props<{ incidents: Incident[] }>(),
    'Load Incidents Failure': props<{ error: string }>(),
    'Add Incident': props<{ incident: Incident }>(),
  },
});
