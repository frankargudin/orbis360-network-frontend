import { createFeature, createReducer, createSelector, on } from '@ngrx/store';
import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { Device, DeviceSummary } from '../../shared/models/network.models';
import { DevicesActions } from './devices.actions';

export interface DevicesState extends EntityState<Device> {
  loading: boolean;
  error: string | null;
  summary: DeviceSummary | null;
  selectedDeviceId: string | null;
}

export const devicesAdapter: EntityAdapter<Device> = createEntityAdapter<Device>({
  selectId: (device) => device.id,
  sortComparer: (a, b) => a.hostname.localeCompare(b.hostname),
});

const initialState: DevicesState = devicesAdapter.getInitialState({
  loading: false,
  error: null,
  summary: null,
  selectedDeviceId: null,
});

export const devicesFeature = createFeature({
  name: 'devices',
  reducer: createReducer(
    initialState,
    on(DevicesActions.loadDevices, (state) => ({ ...state, loading: true, error: null })),
    on(DevicesActions.loadDevicesSuccess, (state, { devices }) =>
      devicesAdapter.setAll(devices, { ...state, loading: false })
    ),
    on(DevicesActions.loadDevicesFailure, (state, { error }) => ({
      ...state,
      loading: false,
      error,
    })),
    on(DevicesActions.loadSummarySuccess, (state, { summary }) => ({
      ...state,
      summary,
    })),
    on(DevicesActions.selectDevice, (state, { deviceId }) => ({
      ...state,
      selectedDeviceId: deviceId,
    })),
    on(DevicesActions.updateDeviceStatus, (state, { deviceId, status }) =>
      devicesAdapter.updateOne({ id: deviceId, changes: { status } }, state)
    ),
  ),
});

// Selectors
const { selectAll, selectEntities } = devicesAdapter.getSelectors(devicesFeature.selectDevicesState);
export const selectAllDevices = selectAll;
export const selectDeviceEntities = selectEntities;
export const selectDevicesLoading = devicesFeature.selectLoading;
export const selectDevicesSummary = devicesFeature.selectSummary;
export const selectSelectedDeviceId = devicesFeature.selectSelectedDeviceId;

export const selectSelectedDevice = createSelector(
  selectEntities,
  selectSelectedDeviceId,
  (entities, id) => (id ? entities[id] ?? null : null)
);

export const selectDownDevices = createSelector(selectAll, (devices) =>
  devices.filter((d) => d.status === 'down')
);
