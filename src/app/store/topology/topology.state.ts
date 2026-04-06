import { createFeature, createReducer, on } from '@ngrx/store';
import { RCAResult, TopologyData } from '../../shared/models/network.models';
import { TopologyActions } from './topology.actions';

export interface TopologyState {
  topology: TopologyData | null;
  rcaResults: RCAResult[];
  loading: boolean;
  rcaLoading: boolean;
  error: string | null;
}

const initialState: TopologyState = {
  topology: null,
  rcaResults: [],
  loading: false,
  rcaLoading: false,
  error: null,
};

export const topologyFeature = createFeature({
  name: 'topology',
  reducer: createReducer(
    initialState,
    on(TopologyActions.loadTopology, (state) => ({ ...state, loading: true })),
    on(TopologyActions.loadTopologySuccess, (state, { topology }) => ({
      ...state,
      topology,
      loading: false,
    })),
    on(TopologyActions.loadTopologyFailure, (state, { error }) => ({
      ...state,
      loading: false,
      error,
    })),
    on(TopologyActions.runRCA, (state) => ({ ...state, rcaLoading: true })),
    on(TopologyActions.runRCASuccess, (state, { results }) => ({
      ...state,
      rcaResults: results,
      rcaLoading: false,
    })),
    on(TopologyActions.runRCAFailure, (state, { error }) => ({
      ...state,
      rcaLoading: false,
      error,
    })),
  ),
});

export const selectTopologyData = topologyFeature.selectTopology;
export const selectRCAResults = topologyFeature.selectRcaResults;
export const selectTopologyLoading = topologyFeature.selectLoading;
