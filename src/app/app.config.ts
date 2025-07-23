import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';

// JWT
import { JwtModule } from '@auth0/angular-jwt';

// Intercepteurs
import { authInterceptor } from './core/interceptors/auth.interceptor';

// Routes
import { routes } from './app.routes';

// Constants
import { APP_CONSTANTS } from './core/constants/app-constants';

// Configuration JWT
export function tokenGetter() {
  return localStorage.getItem(APP_CONSTANTS.JWT.TOKEN_KEY);
}

export const appConfig: ApplicationConfig = {
  providers: [
    // Router
    provideRouter(routes),
    
    // HTTP Client avec intercepteurs
    provideHttpClient(
      withInterceptors([authInterceptor])
    ),
    
    // Animations
    provideAnimations(),
    
    // JWT Module
    importProvidersFrom(
      JwtModule.forRoot({
        config: {
          tokenGetter: tokenGetter,
          allowedDomains: [APP_CONSTANTS.API.BASE_URL.replace(/^https?:\/\//, '')],
          disallowedRoutes: [
            `${APP_CONSTANTS.API.BASE_URL}/auth/connexion`,
            `${APP_CONSTANTS.API.BASE_URL}/health`
          ],
          skipWhenExpired: true
        }
      })
    )
  ]
};