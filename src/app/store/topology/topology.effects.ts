import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap, of } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { TopologyActions } from './topology.actions';

@Injectable()
export class TopologyEffects {
  private actions$ = inject(Actions);
  private api = inject(ApiService);

  loadTopology$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TopologyActions.loadTopology),
      mergeMap(() =>
        this.api.getTopology().pipe(
          map((topology) => TopologyActions.loadTopologySuccess({ topology })),
          catchError((err) => of(TopologyActions.loadTopologyFailure({ error: err.message })))
        )
      )
    )
  );

  runRCA$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TopologyActions.runRCA),
      mergeMap(() =>
        this.api.runRCA().pipe(
          map((results) => TopologyActions.runRCASuccess({ results })),
          catchError((err) => of(TopologyActions.runRCAFailure({ error: err.message })))
        )
      )
    )
  );
}
