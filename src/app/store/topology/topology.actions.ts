import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { RCAResult, TopologyData } from '../../shared/models/network.models';

export const TopologyActions = createActionGroup({
  source: 'Topology',
  events: {
    'Load Topology': emptyProps(),
    'Load Topology Success': props<{ topology: TopologyData }>(),
    'Load Topology Failure': props<{ error: string }>(),
    'Run RCA': emptyProps(),
    'Run RCA Success': props<{ results: RCAResult[] }>(),
    'Run RCA Failure': props<{ error: string }>(),
  },
});
