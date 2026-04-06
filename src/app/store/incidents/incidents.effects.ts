import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap, of } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { IncidentsActions } from './incidents.actions';

@Injectable()
export class IncidentsEffects {
  private actions$ = inject(Actions);
  private api = inject(ApiService);

  loadIncidents$ = createEffect(() =>
    this.actions$.pipe(
      ofType(IncidentsActions.loadIncidents),
      mergeMap(() =>
        this.api.getIncidents().pipe(
          map((incidents) => IncidentsActions.loadIncidentsSuccess({ incidents })),
          catchError((err) => of(IncidentsActions.loadIncidentsFailure({ error: err.message })))
        )
      )
    )
  );
}
