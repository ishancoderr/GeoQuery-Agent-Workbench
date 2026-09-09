import { createFeature, createReducer, on } from '@ngrx/store';

import { AgentId, HealthStatus, RequestStatus } from '../../core/models/agent.model';
import { AgentQueryResponse } from '../../core/models/agent-response.model';
import { AgentActions } from './agents.actions';

export interface SingleAgentState {
  queryText: string;
  status: RequestStatus;
  response: AgentQueryResponse | null;
  error: string | null;
  health: HealthStatus;
  updatedAt: number;
}

export interface AgentsState {
  agent1: SingleAgentState;
  agent2: SingleAgentState;
}

function initialSingleAgentState(): SingleAgentState {
  return {
    queryText: '',
    status: 'idle',
    response: null,
    error: null,
    health: 'unknown',
    updatedAt: 0,
  };
}

export const initialAgentsState: AgentsState = {
  agent1: initialSingleAgentState(),
  agent2: initialSingleAgentState(),
};

function patchAgent(
  state: AgentsState,
  agentId: AgentId,
  patch: Partial<SingleAgentState>,
): AgentsState {
  return { ...state, [agentId]: { ...state[agentId], ...patch } };
}

export const agentsFeature = createFeature({
  name: 'agents',
  reducer: createReducer(
    initialAgentsState,
    on(AgentActions.setQueryText, (state, { agentId, text }) =>
      patchAgent(state, agentId, { queryText: text }),
    ),
    on(AgentActions.sendQuery, (state, { agentId }) =>
      patchAgent(state, agentId, { status: 'loading', error: null }),
    ),
    on(AgentActions.sendQuerySuccess, (state, { agentId, response }) =>
      patchAgent(state, agentId, {
        status: 'success',
        response,
        error: null,
        updatedAt: Date.now(),
      }),
    ),
    on(AgentActions.sendQueryFailure, (state, { agentId, error }) =>
      patchAgent(state, agentId, {
        status: 'error',
        error,
        updatedAt: Date.now(),
      }),
    ),
    on(AgentActions.healthResult, (state, { agentId, status }) =>
      patchAgent(state, agentId, { health: status }),
    ),
  ),
});

export const {
  name: agentsFeatureKey,
  reducer: agentsReducer,
  selectAgent1,
  selectAgent2,
} = agentsFeature;
