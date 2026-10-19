import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import {
  EvalResults,
  EvalRun,
  EvalSetup,
  Estimate,
  EvaluatorStatus,
  ReviewItem,
  RunPlan,
  Verdict,
} from '../models/evaluation.model';

/**
 * The evaluator (Agent-001 repo, `python -m evaluator`, :8002), proxied as
 * /api/eval. It accepts the same session cookie as the agents.
 */
const EVAL = '/api/eval';

/** Agent-001 starts the evaluator (agent1/evaluation/evaluator_launcher.py). */
const LAUNCHER = '/api/agent1/evaluator';

function runsParam(runIds: number[]): HttpParams {
  return new HttpParams().set('runs', runIds.join(','));
}

@Injectable({ providedIn: 'root' })
export class EvaluationApiService {
  private readonly http = inject(HttpClient);

  evaluatorStatus(): Observable<EvaluatorStatus> {
    return this.http.get<EvaluatorStatus>(`${LAUNCHER}/status`);
  }

  startEvaluator(): Observable<EvaluatorStatus> {
    return this.http.post<EvaluatorStatus>(`${LAUNCHER}/start`, {});
  }

  stopEvaluator(): Observable<unknown> {
    return this.http.post(`${EVAL}/shutdown`, {});
  }

  setup(): Observable<EvalSetup> {
    return this.http.get<EvalSetup>(`${EVAL}/setup`);
  }

  estimate(plan: RunPlan): Observable<Estimate> {
    return this.http.post<Estimate>(`${EVAL}/estimate`, plan);
  }

  startRun(plan: RunPlan): Observable<EvalRun> {
    return this.http.post<EvalRun>(`${EVAL}/runs`, plan);
  }

  runs(): Observable<EvalRun[]> {
    return this.http.get<EvalRun[]>(`${EVAL}/runs`);
  }

  run(id: number): Observable<EvalRun> {
    return this.http.get<EvalRun>(`${EVAL}/runs/${id}`);
  }

  control(id: number, action: 'pause' | 'resume' | 'cancel'): Observable<EvalRun> {
    return this.http.post<EvalRun>(`${EVAL}/runs/${id}/${action}`, {});
  }

  results(runIds: number[]): Observable<EvalResults> {
    return this.http.get<EvalResults>(`${EVAL}/results`, { params: runsParam(runIds) });
  }

  review(runIds: number[], onlyOpen: boolean): Observable<ReviewItem[]> {
    return this.http.get<ReviewItem[]>(`${EVAL}/review`, {
      params: runsParam(runIds).set('only_open', String(onlyOpen)),
    });
  }

  setVerdict(qid: string, fingerprint: string, verdict: Verdict | null, note: string | null): Observable<unknown> {
    return this.http.put(`${EVAL}/verdicts`, { qid, fingerprint, verdict, note });
  }

  /** One model's CSV: every ask of that model. A plain link — the browser
   *  downloads it with the session cookie. */
  modelCsvUrl(model: string, runIds: number[]): string {
    return `${EVAL}/export/model/${encodeURIComponent(model)}.csv?runs=${runIds.join(',')}`;
  }

  /** Every model's CSV (and the summary) in one zip. */
  perModelZipUrl(runIds: number[]): string {
    return `${EVAL}/export/per-model.zip?runs=${runIds.join(',')}`;
  }
}
