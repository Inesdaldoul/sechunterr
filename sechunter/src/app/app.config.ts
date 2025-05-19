import { ApplicationConfig, inject } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideClientHydration } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app.routes';
import { JwtHelperService, JWT_OPTIONS } from '@auth0/angular-jwt';
import { PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { authInterceptor } from './core/interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding()),
    // provideClientHydration() is now in app.config.server.ts to avoid duplication
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimations(),
    {
      provide: JWT_OPTIONS,
      useValue: {
        tokenGetter: () => {
          const platformId = inject(PLATFORM_ID);
          if (isPlatformBrowser(platformId)) {
            // Try to get the token from both possible storage keys
            return localStorage.getItem('access_token') || localStorage.getItem('token');
          }
          return null;
        },
        allowedDomains: ['localhost:4200', 'localhost:5000', 'localhost:60128', 'localhost:64745'],
        disallowedRoutes: []
      }
    },
    JwtHelperService
  ]
};