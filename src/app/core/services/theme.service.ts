import { Injectable, signal, effect } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly mode = signal<'light' | 'dark'>(this.getInitialMode());

  constructor() {
    this.applyTheme(this.mode());

    effect(() => {
      const m = this.mode();
      this.applyTheme(m);
      localStorage.setItem('orbis360_theme', m);
    });
  }

  toggle(): void {
    this.mode.update(m => m === 'light' ? 'dark' : 'light');
  }

  private applyTheme(m: 'light' | 'dark'): void {
    const html = document.documentElement;
    const body = document.body;

    if (m === 'dark') {
      html.classList.add('dark');
      body.style.backgroundColor = '#111B21';
      body.style.color = '#E9EDEF';
    } else {
      html.classList.remove('dark');
      body.style.backgroundColor = '#F0F2F5';
      body.style.color = '#111B21';
    }
  }

  private getInitialMode(): 'light' | 'dark' {
    const stored = localStorage.getItem('orbis360_theme');
    if (stored === 'dark' || stored === 'light') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
}
