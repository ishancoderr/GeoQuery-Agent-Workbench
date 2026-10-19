import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, filter, map, mergeMap, of, timer, withLatestFrom } from 'rxjs';

import { AGENT_IDS } from '../../core/models/agent.model';
import { AgentApiService } from '../../core/services/agent-api.service';
import { AgentActions } from './agents.actions';
import { agentsFeature } from './agents.reducer';
import { AuthActions } from '../auth/auth.actions';
import { selectStatus } from '../auth/auth.reducer';

const HEALTH_POLL_INTERVAL_MS = 15000;

@Injectable()
export class AgentsEffects {
  private readonly actions$ = inject(Actions);
  private readonly api = inject(AgentApiService);
  private readonly store = inject(Store);

  sendQuery$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AgentActions.sendQuery),
      mergeMap(({ agentId, query, llm }) => {
        const start = performance.now();
        return this.api.queryAgent(agentId, query, llm).pipe(
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
                llm,
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

  // Once logged in and an agent is online, fetch the models it offers (until that succeeds).
  loadLlmsWhenOnline$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AgentActions.healthResult),
      filter(({ status }) => status === 'online'),
      withLatestFrom(this.store.select(agentsFeature.selectAgentsState), this.store.select(selectStatus)),
      filter(([{ agentId }, agents, auth]) => auth === 'authenticated' && agents[agentId].llms.length === 0),
      map(([{ agentId }]) => AgentActions.loadLlms({ agentId })),
    ),
  );

  // Right after logging in (or finding a session on load), load both agents' models.
  loadLlmsAfterLogin$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.logInSuccess, AuthActions.sessionFound),
      mergeMap(() => AGENT_IDS.map(agentId => AgentActions.loadLlms({ agentId }))),
    ),
  );

  loadLlms$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AgentActions.loadLlms),
      mergeMap(({ agentId }) =>
        this.api.listLlms(agentId).pipe(
          map(list => AgentActions.loadLlmsSuccess({ agentId, list })),
          catchError(() => of(AgentActions.loadLlmsFailure({ agentId }))),
        ),
      ),
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
