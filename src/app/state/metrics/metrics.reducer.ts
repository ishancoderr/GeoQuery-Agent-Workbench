import { createFeature, createReducer, on } from '@ngrx/store';

import { getCompletenessPct, getKqmlTurns, getRecordCount } from '../../core/models/agent-response.model';
import { nowStamp } from '../../core/utils/format.util';
import { AgentActions } from '../agents/agents.actions';
import { MetricsEntry } from './metrics.model';

export interface MetricsState {
  history: MetricsEntry[];
}

export const initialMetricsState: MetricsState = {
  history: [],
};

export const metricsFeature = createFeature({
  name: 'metrics',
  reducer: createReducer(
    initialMetricsState,
    on(AgentActions.sendQuerySuccess, (state, { agentId, query, response }): MetricsState => {
      const entry: MetricsEntry = {
        time: nowStamp(),
        agentId,
        query,
        llm: response.llm?.label ?? 'default',
        status: response.status,
        totalMs: response.performance.total_ms,
        tokens: response.performance.tokens.total,
        kqmlTurns: getKqmlTurns(response),
        recordCount: getRecordCount(response),
        completenessPct: getCompletenessPct(response),
      };
      return { history: [...state.history, entry] };
    }),
    on(AgentActions.sendQueryFailure, (state, { agentId, query, llm }): MetricsState => {
      const entry: MetricsEntry = {
        time: nowStamp(),
        agentId,
        query,
        llm: llm ?? 'default',
        status: 'error',
        totalMs: 0,
        tokens: 0,
        kqmlTurns: null,
        recordCount: 0,
        completenessPct: null,
      };
      return { history: [...state.history, entry] };
    }),
  ),
});

export const { name: metricsFeatureKey, reducer: metricsReducer, selectHistory } = metricsFeature;
