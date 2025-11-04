import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { HTTP_INTERCEPTORS, provideHttpClient } from '@angular/common/http';
import { provideApi } from './api/provide-api';
import { environment } from '../environments/environment';

import { routes } from './app.routes';
import { AuthInterceptor } from './core/interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
  provideRouter(routes),
  // provide HttpClient to the application (required for generated client and AuthService)
  provideHttpClient(),
    // configure generated OpenAPI client with base path and bearer token resolver
    provideApi({ basePath: environment.apiUrl, credentials: { bearerAuth: () => localStorage.getItem('auth_token') } }),
    // register auth interceptor to attach Bearer token
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ]
};
