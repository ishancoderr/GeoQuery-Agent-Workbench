import { createActionGroup, emptyProps, props } from '@ngrx/store';

import { AgentId, HealthStatus } from '../../core/models/agent.model';
import { AgentQueryResponse } from '../../core/models/agent-response.model';

export const AgentActions = createActionGroup({
  source: 'Agent',
  events: {
    'Set Query Text': props<{ agentId: AgentId; text: string }>(),
    'Send Query': props<{ agentId: AgentId; query: string }>(),
    'Send Query Success': props<{ agentId: AgentId; query: string; response: AgentQueryResponse; clientMs: number }>(),
    'Send Query Failure': props<{ agentId: AgentId; query: string; error: string }>(),

    'Poll Health': emptyProps(),
    'Check Health': props<{ agentId: AgentId }>(),
    'Health Result': props<{ agentId: AgentId; status: HealthStatus }>(),
  },
});
