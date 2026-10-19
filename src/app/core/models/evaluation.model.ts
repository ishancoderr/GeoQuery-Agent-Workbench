/** The evaluator's API (Agent-001 repo, evaluator/api.py), behind /api/eval. */

export interface EvalModel {
  id: string;
  label: string;
  provider: string;
  available: boolean;        // configured on the primary agent
  available_peer: boolean;   // configured on the peer (needed for symmetry)
  peer_online: boolean;      // the peer answered; if not, available_peer is unknown
  default_repeats: number;
  priced: boolean;
}

export interface EvalSetup {
  agents: { primary: string; peer: string };
  models: EvalModel[];
  symmetry: boolean;
  /** The answer key's questions, for "load the test set". */
  test_set: { id: string; question: string }[];
}

/**
 * One entry of the question set (step 2). `model`: an id or label, a list,
 * or missing / "all" = every model ticked in step 1. `category` and
 * `extract` (optional) are the expected labels, as in finetune/questions_vN.yaml.
 */
export interface QuestionItem {
  question: string;
}

export interface RunPlan {
  label: string;
  models: { id: string; repeats: number }[];
  items: QuestionItem[];
  symmetry: boolean;
}

/** A run's plan as listed: the question set reduced to its size. */
export interface RunPlanSummary {
  label: string;
  models: { id: string; repeats: number }[];
  questions: number;
  symmetry: boolean;
}

export interface Estimate {
  asks: number;
  questions: number;
  cost_usd: number;
  seconds: number;
  models: { model: string; asks: number; tokens: number; cost_usd: number | null; seconds: number; basis: string }[];
}

export type RunStatus = 'queued' | 'running' | 'paused' | 'done' | 'cancelled';

export interface EvalRun {
  id: number;
  label: string;
  status: RunStatus;
  note: string | null;
  created_by: string;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
  plan: RunPlanSummary;
  asks_total: number;
  asks_done: number | null;
  asks_failed: number | null;
  asks_skipped: number | null;
  ms_spent: number | null;
  cost_usd: number | null;
  eta_s?: number | null;
  current?: { model: string; qid: string; question: string; agent_name: string; rep: number; since: number } | null;
}

/** The measures shared by the per-model, per-category and per-question rows. */
export interface Measures {
  asks: number;
  http_errors: number;
  category_accuracy: number | null;
  extraction_accuracy: number | null;
  sql_first_try_rate: number | null;
  sql_ok_rate: number | null;
  answers_reviewed: number;
  answers_unreviewed: number;
  answer_accuracy: number | null;
  tokens_total_mean: number | null;
  cost_usd_sum: number | null;
  wall_ms_mean: number | null;
  wall_ms_median: number | null;
  wall_ms_p95: number | null;
}

export interface ModelResult extends Measures {
  model: string;
  expected_category?: string;
  questions: number;
  consistency_mean: number | null;
  fully_consistent_share: number | null;
  questions_repeated: number;
  symmetry_rate: number | null;
  symmetry_compared: number;
  peer_answer_accuracy: number | null;
}

export interface QuestionResult extends Measures {
  model: string;
  qid: string;
  question: string;
  expected_category: string;
  distinct_answers: number;
  consistency: number | null;
  most_common_answer: string | null;
  first_answer_verdict: Verdict | null;
  symmetric: number | null;
  peer_answer: string | null;
}

export interface EvalResults {
  models: ModelResult[];
  categories: ModelResult[];
  questions: QuestionResult[];
}

export type Verdict = 'correct' | 'wrong';

/** One distinct answer to one question, to confirm by hand. */
export interface ReviewItem {
  qid: string;
  question: string;
  expected_category: string;
  fingerprint: string;
  summary: string;
  view: unknown;
  asks: number;
  ask_ids: number[];
  models: string[];
  agents: string[];
  verdict: Verdict | null;
  note: string | null;
  by_user: string | null;
  suggestion: string | null;
  diff_to_confirmed: string | null;
}

/** Whether the evaluator runs (asked of Agent-001, which can start it). */
export interface EvaluatorStatus {
  installed: boolean;
  running: boolean;
  agent: string;
  pid?: number | null;
  log?: string;
}
