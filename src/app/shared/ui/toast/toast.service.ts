import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: number;
  type: ToastType;
  text: string;
  duration?: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private counter = 0;
  private subject = new Subject<ToastMessage>();
  stream$ = this.subject.asObservable();

  show(type: ToastType, text: string, duration = 3000) {
    const id = ++this.counter;
    this.subject.next({ id, type, text, duration });
  }

  success(text: string, duration = 3000) { this.show('success', text, duration); }
  error(text: string, duration = 4000) { this.show('error', text, duration); }
  info(text: string, duration = 3000) { this.show('info', text, duration); }
  warning(text: string, duration = 3000) { this.show('warning', text, duration); }
}
