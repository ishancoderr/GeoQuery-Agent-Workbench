import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { AgentId } from '../models/agent.model';
import { AgentQueryResponse } from '../models/agent-response.model';

export interface HealthResponse {
  status: string;
  agent: string;
}

@Injectable({ providedIn: 'root' })
export class AgentApiService {
  private readonly http = inject(HttpClient);

  queryAgent(agentId: AgentId, query: string): Observable<AgentQueryResponse> {
    return this.http.post<AgentQueryResponse>(`/api/${agentId}/query`, { query });
  }

  checkHealth(agentId: AgentId): Observable<HealthResponse> {
    return this.http.get<HealthResponse>(`/api/${agentId}/health`);
  }
}
