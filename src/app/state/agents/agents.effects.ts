import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap, of, timer } from 'rxjs';

import { AGENT_IDS } from '../../core/models/agent.model';
import { AgentApiService } from '../../core/services/agent-api.service';
import { AgentActions } from './agents.actions';

const HEALTH_POLL_INTERVAL_MS = 15000;

@Injectable()
export class AgentsEffects {
  private readonly actions$ = inject(Actions);
  private readonly api = inject(AgentApiService);

  sendQuery$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AgentActions.sendQuery),
      mergeMap(({ agentId, query }) => {
        const start = performance.now();
        return this.api.queryAgent(agentId, query).pipe(
          map(response =>
            AgentActions.sendQuerySuccess({
              agentId,
              query,
              response,
              clientMs: Math.round(performance.now() - start),
            }),
          ),
          catchError((err: HttpErrorResponse) =>
            of(
              AgentActions.sendQueryFailure({
                agentId,
                query,
                error: describeError(err),
              }),
            ),
          ),
        );
      }),
    ),
  );

  pollHealth$ = createEffect(() =>
    timer(0, HEALTH_POLL_INTERVAL_MS).pipe(
      mergeMap(() => AGENT_IDS.map(agentId => AgentActions.checkHealth({ agentId }))),
    ),
  );

  checkHealth$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AgentActions.checkHealth),
      mergeMap(({ agentId }) =>
        this.api.checkHealth(agentId).pipe(
          map(() => AgentActions.healthResult({ agentId, status: 'online' as const })),
          catchError(() => of(AgentActions.healthResult({ agentId, status: 'offline' as const }))),
        ),
      ),
    ),
  );
}

function describeError(err: HttpErrorResponse): string {
  if (err.status === 0) return 'Cannot reach the agent — is it running?';
  const detail = (err.error && (err.error.detail || err.error.message)) as string | undefined;
  return detail || err.message || `Request failed (${err.status})`;
}
