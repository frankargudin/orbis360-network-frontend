import { createFeature, createReducer, on } from '@ngrx/store';
import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { Incident } from '../../shared/models/network.models';
import { IncidentsActions } from './incidents.actions';

export const incidentsAdapter: EntityAdapter<Incident> = createEntityAdapter<Incident>({
  selectId: (i) => i.id,
  sortComparer: (a, b) => new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime(),
});

export interface IncidentsState extends EntityState<Incident> {
  loading: boolean;
  error: string | null;
}

const initialState: IncidentsState = incidentsAdapter.getInitialState({
  loading: false,
  error: null,
});

export const incidentsFeature = createFeature({
  name: 'incidents',
  reducer: createReducer(
    initialState,
    on(IncidentsActions.loadIncidents, (state) => ({ ...state, loading: true })),
    on(IncidentsActions.loadIncidentsSuccess, (state, { incidents }) =>
      incidentsAdapter.setAll(incidents, { ...state, loading: false })
    ),
    on(IncidentsActions.loadIncidentsFailure, (state, { error }) => ({
      ...state,
      loading: false,
      error,
    })),
    on(IncidentsActions.addIncident, (state, { incident }) =>
      incidentsAdapter.addOne(incident, state)
    ),
  ),
});

const { selectAll } = incidentsAdapter.getSelectors(incidentsFeature.selectIncidentsState);
export const selectAllIncidents = selectAll;
export const selectIncidentsLoading = incidentsFeature.selectLoading;
