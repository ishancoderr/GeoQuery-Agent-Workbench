import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, isDevMode, provideZoneChangeDetection } from '@angular/core';
import { provideEffects } from '@ngrx/effects';
import { provideStore } from '@ngrx/store';
import { provideStoreDevtools } from '@ngrx/store-devtools';

import { authInterceptor } from './core/interceptors/auth.interceptor';
import { agentsFeature } from './state/agents/agents.reducer';
import { AgentsEffects } from './state/agents/agents.effects';
import { authFeature } from './state/auth/auth.reducer';
import { AuthEffects } from './state/auth/auth.effects';
import { metricsFeature } from './state/metrics/metrics.reducer';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideStore({
      [agentsFeature.name]: agentsFeature.reducer,
      [metricsFeature.name]: metricsFeature.reducer,
      [authFeature.name]: authFeature.reducer,
    }),
    provideEffects([AgentsEffects, AuthEffects]),
    provideStoreDevtools({ maxAge: 50, logOnly: !isDevMode(), connectInZone: true }),
  ],
};
