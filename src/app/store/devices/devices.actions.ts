import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Device, DeviceSummary, DeviceStatus } from '../../shared/models/network.models';

export const DevicesActions = createActionGroup({
  source: 'Devices',
  events: {
    'Load Devices': emptyProps(),
    'Load Devices Success': props<{ devices: Device[] }>(),
    'Load Devices Failure': props<{ error: string }>(),
    'Load Summary': emptyProps(),
    'Load Summary Success': props<{ summary: DeviceSummary }>(),
    'Select Device': props<{ deviceId: string | null }>(),
    'Update Device Status': props<{ deviceId: string; status: DeviceStatus }>(),
  },
});
