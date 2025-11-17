import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription, timer } from 'rxjs';
import { ToastMessage, ToastService } from './toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast-container.html',
  styleUrls: ['./toast-container.css']
})
export class ToastContainer implements OnDestroy {
  toasts: ToastMessage[] = [];
  private sub: Subscription;

  constructor(private toast: ToastService) {
    this.sub = this.toast.stream$.subscribe(msg => {
      this.toasts.push(msg);
      const d = msg.duration ?? 3000;
      timer(d).subscribe(() => this.dismiss(msg.id));
    });
  }

  dismiss(id: number) {
    this.toasts = this.toasts.filter(t => t.id !== id);
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
