import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Device,
  DeviceSummary,
  Incident,
  Link,
  Location,
  Metric,
  RCAResult,
  RebootResponse,
  TopologyData,
} from '../../shared/models/network.models';

const API = '/api/v1';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  // ─── Auth ──────────────────────────────────────────────────────────────────

  login(username: string, password: string): Observable<{ access_token: string }> {
    return this.http.post<{ access_token: string }>(`${API}/auth/login`, { username, password });
  }

  // ─── Devices ───────────────────────────────────────────────────────────────

  getDevices(params?: { status?: string; device_type?: string }): Observable<Device[]> {
    let httpParams = new HttpParams();
    if (params?.status) httpParams = httpParams.set('status', params.status);
    if (params?.device_type) httpParams = httpParams.set('device_type', params.device_type);
    return this.http.get<Device[]>(`${API}/devices`, { params: httpParams });
  }

  getDeviceSummary(): Observable<DeviceSummary> {
    return this.http.get<DeviceSummary>(`${API}/devices/summary`);
  }

  getDevice(id: string): Observable<Device> {
    return this.http.get<Device>(`${API}/devices/${id}`);
  }

  createDevice(device: Partial<Device>): Observable<Device> {
    return this.http.post<Device>(`${API}/devices`, device);
  }

  updateDevice(id: string, data: Partial<Device>): Observable<Device> {
    return this.http.patch<Device>(`${API}/devices/${id}`, data);
  }

  deleteDevice(id: string): Observable<void> {
    return this.http.delete<void>(`${API}/devices/${id}`);
  }

  rebootDevice(id: string): Observable<RebootResponse> {
    return this.http.post<RebootResponse>(`${API}/devices/${id}/reboot`, { confirm: true });
  }

  // ─── Links ─────────────────────────────────────────────────────────────────

  getLinks(): Observable<Link[]> {
    return this.http.get<Link[]>(`${API}/links`);
  }

  createLink(link: Partial<Link>): Observable<Link> {
    return this.http.post<Link>(`${API}/links`, link);
  }

  deleteLink(id: string): Observable<void> {
    return this.http.delete<void>(`${API}/links/${id}`);
  }

  // ─── Locations ─────────────────────────────────────────────────────────────

  createLocation(loc: Partial<Location>): Observable<Location> {
    return this.http.post<Location>(`${API}/locations`, loc);
  }

  deleteLocation(id: string): Observable<void> {
    return this.http.delete<void>(`${API}/locations/${id}`);
  }

  // ─── Locations ─────────────────────────────────────────────────────────────

  getLocations(): Observable<Location[]> {
    return this.http.get<Location[]>(`${API}/locations`);
  }

  // ─── Audit ────────────────────────────────────────────────────────────────

  getAuditLog(limit = 50): Observable<any[]> {
    return this.http.get<any[]>(`${API}/audit`, { params: new HttpParams().set('limit', limit) });
  }

  // ─── Services ─────────────────────────────────────────────────────────────

  getDeviceServices(deviceId: string): Observable<any[]> {
    return this.http.get<any[]>(`${API}/services/device/${deviceId}`);
  }

  createServiceCheck(data: any): Observable<any> {
    return this.http.post<any>(`${API}/services`, data);
  }

  deleteServiceCheck(id: string): Observable<void> {
    return this.http.delete<void>(`${API}/services/${id}`);
  }

  runServiceCheck(id: string): Observable<any> {
    return this.http.post<any>(`${API}/services/${id}/check`, {});
  }

  // ─── Reports ──────────────────────────────────────────────────────────────

  getAvailabilityReport(hours = 720): Observable<any> {
    return this.http.get<any>(`${API}/reports/availability`, { params: new HttpParams().set('hours', hours) });
  }

  // ─── Discovery ────────────────────────────────────────────────────────────

  discoverNetwork(network: string, community = 'public'): Observable<any> {
    return this.http.post<any>(`${API}/discovery`, { network, snmp_community: community });
  }

  // ─── Maintenance ──────────────────────────────────────────────────────────

  getMaintenanceWindows(deviceId?: string): Observable<any[]> {
    let params = new HttpParams();
    if (deviceId) params = params.set('device_id', deviceId);
    return this.http.get<any[]>(`${API}/maintenance`, { params });
  }

  createMaintenance(data: any): Observable<any> {
    return this.http.post<any>(`${API}/maintenance`, data);
  }

  deleteMaintenance(id: string): Observable<void> {
    return this.http.delete<void>(`${API}/maintenance/${id}`);
  }

  // ─── Thresholds ────────────────────────────────────────────────────────────

  getDeviceThresholds(deviceId: string): Observable<any[]> {
    return this.http.get<any[]>(`${API}/thresholds/device/${deviceId}`);
  }

  saveThreshold(data: any): Observable<any> {
    return this.http.post<any>(`${API}/thresholds`, data);
  }

  deleteThreshold(id: string): Observable<void> {
    return this.http.delete<void>(`${API}/thresholds/${id}`);
  }

  // ─── Topology ──────────────────────────────────────────────────────────────

  getTopology(): Observable<TopologyData> {
    return this.http.get<TopologyData>(`${API}/topology`);
  }

  runRCA(): Observable<RCAResult[]> {
    return this.http.post<RCAResult[]>(`${API}/topology/rca`, {});
  }

  // ─── Incidents ─────────────────────────────────────────────────────────────

  getIncidents(params?: { status?: string }): Observable<Incident[]> {
    let httpParams = new HttpParams();
    if (params?.status) httpParams = httpParams.set('status', params.status);
    return this.http.get<Incident[]>(`${API}/incidents`, { params: httpParams });
  }

  updateIncident(id: string, data: Partial<Incident>): Observable<Incident> {
    return this.http.patch<Incident>(`${API}/incidents/${id}`, data);
  }

  // ─── Metrics ───────────────────────────────────────────────────────────────

  getDeviceMetrics(deviceId: string, hours = 24): Observable<Metric[]> {
    return this.http.get<Metric[]>(`${API}/metrics/device/${deviceId}`, {
      params: new HttpParams().set('hours', hours),
    });
  }

  getDeviceAvgMetrics(deviceId: string, hours = 24): Observable<Record<string, unknown>> {
    return this.http.get<Record<string, unknown>>(`${API}/metrics/device/${deviceId}/avg`, {
      params: new HttpParams().set('hours', hours),
    });
  }
}
