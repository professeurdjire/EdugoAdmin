import { Injectable } from '@angular/core';
import {MatSnackBar} from '@angular/material/snack-bar';

export interface NotificationConfig {
  duration?: number;
  verticalPosition?: 'top' | 'bottom';
  horizontalPosition?: 'start' | 'center' | 'end';
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  constructor(private snackBar: MatSnackBar) {}

  showSuccess(message: string, action: string = 'Fermer', config?: NotificationConfig): void {
    this.snackBar.open(message, action, {
      duration: config?.duration || 5000,
      verticalPosition: config?.verticalPosition || 'top',
      horizontalPosition: config?.horizontalPosition || 'end',
      panelClass: ['success-snackbar']
    });
  }

  showError(message: string, action: string = 'Fermer', config?: NotificationConfig): void {
    this.snackBar.open(message, action, {
      duration: config?.duration || 7000,
      verticalPosition: config?.verticalPosition || 'top',
      horizontalPosition: config?.horizontalPosition || 'end',
      panelClass: ['error-snackbar']
    });
  }

  showWarning(message: string, action: string = 'Fermer', config?: NotificationConfig): void {
    this.snackBar.open(message, action, {
      duration: config?.duration || 6000,
      verticalPosition: config?.verticalPosition || 'top',
      horizontalPosition: config?.horizontalPosition || 'end',
      panelClass: ['warning-snackbar']
    });
  }

  showInfo(message: string, action: string = 'Fermer', config?: NotificationConfig): void {
    this.snackBar.open(message, action, {
      duration: config?.duration || 4000,
      verticalPosition: config?.verticalPosition || 'top',
      horizontalPosition: config?.horizontalPosition || 'end',
      panelClass: ['info-snackbar']
    });
  }
}
