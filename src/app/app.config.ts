import { provideHttpClient } from '@angular/common/http';
import { ApplicationConfig, isDevMode, provideZoneChangeDetection } from '@angular/core';
import { provideEffects } from '@ngrx/effects';
import { provideStore } from '@ngrx/store';
import { provideStoreDevtools } from '@ngrx/store-devtools';

import { agentsFeature } from './state/agents/agents.reducer';
import { AgentsEffects } from './state/agents/agents.effects';
import { metricsFeature } from './state/metrics/metrics.reducer';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(),
    provideStore({
      [agentsFeature.name]: agentsFeature.reducer,
      [metricsFeature.name]: metricsFeature.reducer,
    }),
    provideEffects([AgentsEffects]),
    provideStoreDevtools({ maxAge: 50, logOnly: !isDevMode(), connectInZone: true }),
  ],
};
