import { Injectable, signal, computed } from '@angular/core';
import { environment } from '../../../environments/environment';
import { WSEvent } from '../../shared/models/network.models';

@Injectable({ providedIn: 'root' })
export class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 3000;

  readonly connected = signal(false);
  readonly lastEvent = signal<WSEvent | null>(null);
  readonly eventLog = signal<WSEvent[]>([]);
  readonly connectionStatus = computed(() => this.connected() ? 'Connected' : 'Disconnected');

  private eventHandlers = new Map<string, ((data: Record<string, unknown>) => void)[]>();

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    let wsUrl: string;

    if (environment.wsUrl) {
      // Production: connect directly to Railway backend
      const backendUrl = environment.wsUrl.replace(/^https?:\/\//, '');
      const protocol = environment.wsUrl.startsWith('https') ? 'wss:' : 'ws:';
      wsUrl = `${protocol}//${backendUrl}/api/v1/ws`;
    } else {
      // Development: use same host (proxy handles it)
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      wsUrl = `${protocol}//${window.location.host}/api/v1/ws`;
    }

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      this.connected.set(true);
      this.reconnectAttempts = 0;
      console.log('[WS] Connected to server');
    };

    this.ws.onmessage = (event) => {
      try {
        const wsEvent: WSEvent = JSON.parse(event.data);
        this.lastEvent.set(wsEvent);
        this.eventLog.update(log => [...log.slice(-99), wsEvent]);
        const handlers = this.eventHandlers.get(wsEvent.event) || [];
        handlers.forEach(handler => handler(wsEvent.data));
      } catch (err) {
        console.error('[WS] Failed to parse message:', err);
      }
    };

    this.ws.onclose = () => {
      this.connected.set(false);
      this.attemptReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('[WS] Error:', error);
    };
  }

  on(event: string, handler: (data: Record<string, unknown>) => void): () => void {
    const handlers = this.eventHandlers.get(event) || [];
    handlers.push(handler);
    this.eventHandlers.set(event, handlers);
    return () => {
      const current = this.eventHandlers.get(event) || [];
      this.eventHandlers.set(event, current.filter(h => h !== handler));
    };
  }

  disconnect(): void {
    this.maxReconnectAttempts = 0;
    this.ws?.close();
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.min(this.reconnectAttempts, 5);
    setTimeout(() => this.connect(), delay);
  }
}
