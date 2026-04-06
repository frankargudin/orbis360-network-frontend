// ─── Domain Models ──────────────────────────────────────────────────────────

export interface Device {
  id: string;
  hostname: string;
  ip_address: string;
  mac_address: string | null;
  device_type: DeviceType;
  status: DeviceStatus;
  vendor: string | null;
  model: string | null;
  firmware_version: string | null;
  snmp_community: string | null;
  ssh_username: string | null;
  ssh_password: string | null;
  ssh_port: number;
  is_critical: boolean;
  consecutive_failures: number;
  last_seen: string | null;
  location_id: string | null;
  parent_device_id: string | null;
  created_at: string;
  updated_at: string;
}

export type DeviceType = 'router' | 'switch' | 'access_point' | 'firewall' | 'server' | 'ups';
export type DeviceStatus = 'up' | 'down' | 'degraded' | 'unknown' | 'maintenance';

export interface Link {
  id: string;
  source_device_id: string;
  target_device_id: string;
  source_port: string | null;
  target_port: string | null;
  link_type: 'fiber' | 'copper' | 'wireless' | 'virtual';
  status: 'active' | 'down' | 'degraded';
  bandwidth_mbps: number | null;
  description: string | null;
}

export interface Location {
  id: string;
  name: string;
  building: string;
  floor: string | null;
  area: string | null;
}

export interface Incident {
  id: string;
  title: string;
  description: string | null;
  severity: 'critical' | 'major' | 'minor' | 'warning';
  status: 'open' | 'acknowledged' | 'resolved';
  device_id: string | null;
  root_cause_device_id: string | null;
  affected_device_ids: string[] | null;
  detected_at: string;
  acknowledged_at: string | null;
  resolved_at: string | null;
  resolution_notes: string | null;
}

export interface Metric {
  id: string;
  device_id: string;
  timestamp: string;
  latency_ms: number | null;
  packet_loss_pct: number | null;
  cpu_usage_pct: number | null;
  memory_usage_pct: number | null;
  uptime_seconds: number | null;
}

export interface DeviceSummary {
  total: number;
  up: number;
  down: number;
  degraded: number;
  unknown: number;
  maintenance: number;
}

export interface TopologyData {
  nodes: CytoscapeNode[];
  edges: CytoscapeEdge[];
}

export interface CytoscapeNode {
  data: {
    id: string;
    label: string;
    ip: string;
    type: DeviceType;
    status: DeviceStatus;
    is_critical: boolean;
    location_id: string | null;
  };
}

export interface CytoscapeEdge {
  data: {
    id: string;
    source: string;
    target: string;
    link_type: string;
    status: string;
    bandwidth: number | null;
  };
}

export interface RCAResult {
  root_cause_device_id: string;
  root_cause_hostname: string;
  confidence: number;
  affected_device_ids: string[];
  reasoning: string;
}

export interface RebootResponse {
  success: boolean;
  device_id: string;
  hostname: string;
  command_sent: string;
  output: string;
  error: string | null;
}

export interface WSEvent {
  event: string;
  data: Record<string, unknown>;
}
