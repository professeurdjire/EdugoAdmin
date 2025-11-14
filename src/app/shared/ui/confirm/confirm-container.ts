import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ConfirmRequest, ConfirmService } from './confirm.service';

@Component({
  selector: 'app-confirm-container',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-container.html',
  styles: [`
    .confirm-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;z-index:10001}
    .confirm-modal{width:min(92vw,420px);background:#fff;border-radius:14px;padding:20px 18px;box-shadow:0 20px 50px rgba(0,0,0,.2);animation:pop .18s ease}
    .confirm-icon{font-size:28px;margin-bottom:8px}
    .confirm-title{margin:0 0 6px;font-size:18px;color:#111827}
    .confirm-message{margin:0 0 16px;font-size:14px;color:#4b5563}
    .confirm-actions{display:flex;gap:10px;justify-content:flex-end}
    .btn{border:none;cursor:pointer;border-radius:10px;padding:10px 14px;font-size:14px}
    .btn.cancel{background:#f3f4f6;color:#111827}
    .btn.cancel:hover{background:#e5e7eb}
    .btn.confirm{background:#dc2626;color:#fff}
    .btn.confirm:hover{background:#b91c1c}
    @keyframes pop{from{opacity:0;transform:translateY(6px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}
  `]
})
export class ConfirmContainer implements OnDestroy {
  active = false;
  title = 'Confirmation';
  message = 'Êtes-vous sûr ?';
  confirmText = 'Confirmer';
  cancelText = 'Annuler';
  private current?: ConfirmRequest;
  private sub: Subscription;

  constructor(private confirm: ConfirmService) {
    this.sub = this.confirm.stream$.subscribe((req) => {
      this.current = req;
      this.title = req.title || 'Confirmation';
      this.message = req.message || 'Êtes-vous sûr ?';
      this.confirmText = req.confirmText || 'Confirmer';
      this.cancelText = req.cancelText || 'Annuler';
      this.active = true;
    });
  }

  onConfirm() {
    if (this.current) this.current.resolve(true);
    this.reset();
  }

  onCancel() {
    if (this.current) this.current.resolve(false);
    this.reset();
  }

  reset() {
    this.active = false;
    this.current = undefined;
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
