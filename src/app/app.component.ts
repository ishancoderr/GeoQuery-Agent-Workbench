import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Store } from '@ngrx/store';

import { AGENT_META } from './core/models/agent.model';
import { AgentConsoleComponent } from './features/agent-console/agent-console.component';
import { EvaluationComponent } from './features/evaluation/evaluation.component';
import { StatCardsComponent } from './features/evaluation-log/stat-cards.component';
import { MetricsTableComponent } from './features/evaluation-log/metrics-table.component';
import { GeoMapComponent } from './features/geo-panel/geo-map.component';
import { WktPanelComponent } from './features/geo-panel/wkt-panel.component';
import { LoginComponent } from './features/login/login.component';
import { selectAgent1, selectAgent2 } from './state/agents/agents.selectors';
import { AuthActions } from './state/auth/auth.actions';
import { selectStatus, selectUser } from './state/auth/auth.reducer';

type Tab = 'workbench' | 'evaluation';
const TAB_KEY = 'geoquery.tab';

function readTab(): Tab {
  try {
    return localStorage.getItem(TAB_KEY) === 'evaluation' ? 'evaluation' : 'workbench';
  } catch {
    return 'workbench';
  }
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    AgentConsoleComponent,
    GeoMapComponent,
    WktPanelComponent,
    StatCardsComponent,
    MetricsTableComponent,
    LoginComponent,
    EvaluationComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  private readonly store = inject(Store);

  authStatus = this.store.selectSignal(selectStatus);
  user = this.store.selectSignal(selectUser);

  readonly AGENT_META = AGENT_META;

  /** Which page shows; remembered in this browser only. */
  tab = signal<Tab>(readTab());

  agent1Health = this.store.selectSignal(selectAgent1);
  agent2Health = this.store.selectSignal(selectAgent2);

  ngOnInit(): void {
    this.store.dispatch(AuthActions.checkSession());
  }

  setTab(tab: Tab): void {
    this.tab.set(tab);
    try {
      localStorage.setItem(TAB_KEY, tab);
    } catch {
      /* private window: the tab just isn't remembered */
    }
  }

  logOut(): void {
    this.store.dispatch(AuthActions.logOut());
  }
}
