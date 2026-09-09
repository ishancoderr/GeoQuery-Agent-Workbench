import { createSelector } from '@ngrx/store';

import { AgentId } from '../../core/models/agent.model';
import { AgentQueryResponse } from '../../core/models/agent-response.model';
import { agentsFeature } from './agents.reducer';

export const { selectAgent1, selectAgent2 } = agentsFeature;

export interface ActiveResult {
  agentId: AgentId;
  queryText: string;
  response: AgentQueryResponse;
}

/** Whichever agent produced the most recent successful response drives the shared map/WKT panel. */
export const selectLastActiveResult = createSelector(
  selectAgent1,
  selectAgent2,
  (agent1, agent2): ActiveResult | null => {
    const candidates: { agentId: AgentId; state: typeof agent1 }[] = [
      { agentId: 'agent1', state: agent1 },
      { agentId: 'agent2', state: agent2 },
    ];
    const withResponses = candidates.filter(c => c.state.response !== null);
    if (withResponses.length === 0) return null;
    const latest = withResponses.reduce((a, b) => (a.state.updatedAt >= b.state.updatedAt ? a : b));
    return {
      agentId: latest.agentId,
      queryText: latest.state.queryText,
      response: latest.state.response as AgentQueryResponse,
    };
  },
);
