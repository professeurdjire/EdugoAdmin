import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideApi } from './api/provide-api';
import { environment } from '../environments/environment';

import { routes } from './app.routes';
import { AuthInterceptor } from './core/interceptors/auth.interceptor';
import { AppInitService } from './core/services/app-init.service';

export function initializeApp(appInitService: AppInitService) {
  return () => appInitService.init();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),

    // HttpClient + intercepteurs DI activés
    provideHttpClient(withInterceptorsFromDi()),

    // OpenAPI
    provideApi({ 
      basePath: environment.apiUrl,
      credentials: {
        bearerAuth: 'dummy-token-for-development'
      }
    }),

    // Enregistrer l’intercepteur
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },

    AppInitService,
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [AppInitService],
      multi: true
    }
  ]
};
