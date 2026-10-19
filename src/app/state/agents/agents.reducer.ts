import { createFeature, createReducer, on } from '@ngrx/store';

import { AgentId, HealthStatus, RequestStatus } from '../../core/models/agent.model';
import { AgentQueryResponse } from '../../core/models/agent-response.model';
import { LlmOption } from '../../core/models/llm.model';
import { AgentActions } from './agents.actions';
import { AuthActions } from '../auth/auth.actions';

export interface SingleAgentState {
  queryText: string;
  status: RequestStatus;
  response: AgentQueryResponse | null;
  error: string | null;
  health: HealthStatus;
  updatedAt: number;
  /** The models this agent can answer with (GET /llms); empty until loaded. */
  llms: LlmOption[];
  /** The model chosen for the next query (the agent's default until changed). */
  llm: string | null;
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
    llms: [],
    llm: null,
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
    on(AgentActions.loadLlmsSuccess, (state, { agentId, list }) => {
      // keep the user's choice if the agent still offers it, else its default
      const kept = list.models.some(m => m.id === state[agentId].llm && m.available);
      return patchAgent(state, agentId, { llms: list.models, llm: kept ? state[agentId].llm : list.default });
    }),
    on(AgentActions.setLlm, (state, { agentId, llm }) => patchAgent(state, agentId, { llm })),
    // A new login (maybe another user) starts with fresh consoles and model lists.
    on(AuthActions.loggedOut, AuthActions.sessionEnded, state => ({
      agent1: { ...initialAgentsState.agent1, health: state.agent1.health },
      agent2: { ...initialAgentsState.agent2, health: state.agent2.health },
    })),
  ),
});

export const {
  name: agentsFeatureKey,
  reducer: agentsReducer,
  selectAgent1,
  selectAgent2,
} = agentsFeature;
