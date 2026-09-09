import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';

import { AGENT_META } from './core/models/agent.model';
import { AgentConsoleComponent } from './features/agent-console/agent-console.component';
import { StatCardsComponent } from './features/evaluation-log/stat-cards.component';
import { MetricsTableComponent } from './features/evaluation-log/metrics-table.component';
import { GeoMapComponent } from './features/geo-panel/geo-map.component';
import { WktPanelComponent } from './features/geo-panel/wkt-panel.component';
import { selectAgent1, selectAgent2 } from './state/agents/agents.selectors';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    AgentConsoleComponent,
    GeoMapComponent,
    WktPanelComponent,
    StatCardsComponent,
    MetricsTableComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  private readonly store = inject(Store);

  readonly AGENT_META = AGENT_META;

  agent1Health = this.store.selectSignal(selectAgent1);
  agent2Health = this.store.selectSignal(selectAgent2);
}
