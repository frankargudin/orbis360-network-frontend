import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap, of } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { DevicesActions } from './devices.actions';

@Injectable()
export class DevicesEffects {
  private actions$ = inject(Actions);
  private api = inject(ApiService);

  loadDevices$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DevicesActions.loadDevices),
      mergeMap(() =>
        this.api.getDevices().pipe(
          map((devices) => DevicesActions.loadDevicesSuccess({ devices })),
          catchError((err) => of(DevicesActions.loadDevicesFailure({ error: err.message })))
        )
      )
    )
  );

  loadSummary$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DevicesActions.loadSummary),
      mergeMap(() =>
        this.api.getDeviceSummary().pipe(
          map((summary) => DevicesActions.loadSummarySuccess({ summary })),
          catchError(() => of()) // Silent fail for summary
        )
      )
    )
  );
}
