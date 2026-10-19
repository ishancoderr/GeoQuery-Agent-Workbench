import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { AGENT_META, AgentId, peerOf } from '../../../core/models/agent.model';
import { AgentQueryResponse, ProvenanceInfo, getKqmlTurns, isDataGroupsResponse } from '../../../core/models/agent-response.model';

@Component({
  selector: 'app-performance-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './performance-panel.component.html',
  styleUrl: './performance-panel.component.scss',
})
export class PerformancePanelComponent {
  response = input.required<AgentQueryResponse>();
  agentId = input.required<AgentId>();

  // The backend reports tokens/records as local (the agent that answered) vs
  // peer (the agent it asked over KQML), so the labels follow whichever agent this is.
  localLabel = computed(() => AGENT_META[this.agentId()].label.toLowerCase());
  peerLabel = computed(() => AGENT_META[peerOf(this.agentId())].label.toLowerCase());

  provenance = computed<ProvenanceInfo | null>(() => {
    const r = this.response();
    return isDataGroupsResponse(r) ? r.provenance : null;
  });

  /** KQML turns for shapes that report them but have no provenance block (the verdict shape). */
  verdictTurns = computed<number | null>(() => (this.provenance() ? null : getKqmlTurns(this.response())));
}
