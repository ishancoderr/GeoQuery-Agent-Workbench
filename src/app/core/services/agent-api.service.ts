import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { AgentId } from '../models/agent.model';
import { AgentQueryResponse } from '../models/agent-response.model';
import { LlmList } from '../models/llm.model';

export interface HealthResponse {
  status: string;
  agent: string;
}

@Injectable({ providedIn: 'root' })
export class AgentApiService {
  private readonly http = inject(HttpClient);

  /** `llm`: a model id from listLlms(); null lets the agent use its default. */
  queryAgent(agentId: AgentId, query: string, llm: string | null): Observable<AgentQueryResponse> {
    return this.http.post<AgentQueryResponse>(`/api/${agentId}/query`, llm ? { query, llm } : { query });
  }

  /** The language models the agent can answer with, and its default. */
  listLlms(agentId: AgentId): Observable<LlmList> {
    return this.http.get<LlmList>(`/api/${agentId}/llms`);
  }

  checkHealth(agentId: AgentId): Observable<HealthResponse> {
    return this.http.get<HealthResponse>(`/api/${agentId}/health`);
  }
}
