import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly role = signal<string>(this.getFromToken('role'));
  readonly username = signal<string>(this.getFromToken('username'));

  get isAdmin(): boolean { return this.role() === 'admin'; }
  get isOperator(): boolean { return this.role() === 'admin' || this.role() === 'operator'; }

  updateFromToken(): void {
    this.role.set(this.getFromToken('role'));
    this.username.set(this.getFromToken('username'));
  }

  private getFromToken(field: string): string {
    const token = localStorage.getItem('orbis360_token');
    if (!token) return '';
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload[field] || '';
    } catch {
      return '';
    }
  }
}
