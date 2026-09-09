import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideStore } from '@ngrx/store';

import { AppComponent } from './app.component';
import { agentsFeature } from './state/agents/agents.reducer';
import { metricsFeature } from './state/metrics/metrics.reducer';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideHttpClient(),
        provideStore({
          [agentsFeature.name]: agentsFeature.reducer,
          [metricsFeature.name]: metricsFeature.reducer,
        }),
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
