import { Injectable } from '@angular/core';

declare global {
  interface Window {
    OneSignalDeferred?: any[];
  }
}

@Injectable({ providedIn: 'root' })
export class OneSignalService {
  initialize(): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push(async (OneSignal: any) => {
        try {
          if (OneSignal && OneSignal.Notifications && OneSignal.Notifications.requestPermission) {
            await OneSignal.Notifications.requestPermission();
          }
        } catch (err) {
          console.error('Erreur lors de l\'initialisation OneSignal dans le service Angular:', err);
        }
      });
    } catch (err) {
      console.error('Erreur globale OneSignal:', err);
    }
  }
}
