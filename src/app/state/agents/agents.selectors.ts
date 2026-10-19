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

/** That agent's own current result (or null before it has one) — drives its own map/WKT panel. */
export function selectAgentResult(agentId: AgentId) {
  const base = agentId === 'agent1' ? selectAgent1 : selectAgent2;
  return createSelector(base, (state): ActiveResult | null =>
    state.response ? { agentId, queryText: state.queryText, response: state.response } : null,
  );
}
