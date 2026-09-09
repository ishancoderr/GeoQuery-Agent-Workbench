import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';

import { AGENT_META, AgentId } from '../../core/models/agent.model';
import { AgentActions } from '../../state/agents/agents.actions';
import { selectAgent1, selectAgent2 } from '../../state/agents/agents.selectors';
import { ResponseViewerComponent } from '../response-viewer/response-viewer.component';
import { EXAMPLE_QUERIES } from './example-queries';

@Component({
  selector: 'app-agent-console',
  standalone: true,
  imports: [FormsModule, ResponseViewerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './agent-console.component.html',
  styleUrl: './agent-console.component.scss',
})
export class AgentConsoleComponent {
  private readonly store = inject(Store);

  agentId = input.required<AgentId>();

  meta = computed(() => AGENT_META[this.agentId()]);
  examples = computed(() => EXAMPLE_QUERIES[this.agentId()]);

  private readonly agent1 = this.store.selectSignal(selectAgent1);
  private readonly agent2 = this.store.selectSignal(selectAgent2);

  state = computed(() => (this.agentId() === 'agent1' ? this.agent1() : this.agent2()));

  setQueryText(text: string): void {
    this.store.dispatch(AgentActions.setQueryText({ agentId: this.agentId(), text }));
  }

  fillExample(text: string): void {
    this.setQueryText(text);
  }

  send(): void {
    const query = this.state().queryText.trim();
    if (!query) return;
    this.store.dispatch(AgentActions.sendQuery({ agentId: this.agentId(), query }));
  }
}
