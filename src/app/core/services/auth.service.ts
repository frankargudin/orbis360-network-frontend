import { Injectable, signal, computed } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly role = signal<string>(this.getRoleFromToken());

  get isAdmin(): boolean { return this.role() === 'admin'; }
  get isOperator(): boolean { return this.role() === 'admin' || this.role() === 'operator'; }
  get isViewer(): boolean { return true; }

  updateFromToken(): void {
    this.role.set(this.getRoleFromToken());
  }

  private getRoleFromToken(): string {
    const token = localStorage.getItem('orbis360_token');
    if (!token) return 'viewer';
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.role || 'viewer';
    } catch {
      return 'viewer';
    }
  }
}
