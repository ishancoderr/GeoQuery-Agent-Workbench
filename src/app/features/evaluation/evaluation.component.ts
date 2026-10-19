import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, interval } from 'rxjs';

import {
  EvalResults,
  EvalRun,
  EvalSetup,
  Estimate,
  EvaluatorStatus,
  QuestionItem,
  ReviewItem,
  RunPlan,
  Verdict,
} from '../../core/models/evaluation.model';
import { EvaluationApiService } from '../../core/services/evaluation-api.service';
import { fmtNum, truncate } from '../../core/utils/format.util';
import { CSV_COLUMN_GROUPS } from './column-definitions';

interface ModelChoice {
  id: string;
  label: string;
  available: boolean;
  availablePeer: boolean;
  peerOnline: boolean;
  priced: boolean;
  chosen: boolean;
  repeats: number;
}

const ACTIVE = new Set(['running', 'queued', 'paused']);

interface ParsedSet {
  items: QuestionItem[];
  error: string | null;
}

/** Step 2's text: a JSON list of {"question": "..."} — nothing else. */
function parseSet(text: string): ParsedSet {
  if (!text.trim()) return { items: [], error: null };
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch (e) {
    return { items: [], error: `not valid JSON — ${(e as Error).message}` };
  }
  if (!Array.isArray(data))
    return { items: [], error: 'must be a list in [ ] — e.g. [{"question": "..."}]' };
  const items: QuestionItem[] = [];
  for (let i = 0; i < data.length; i++) {
    const it = data[i] as Record<string, unknown> | null;
    if (!it || typeof it !== 'object' || Array.isArray(it))
      return { items: [], error: `item ${i + 1} is not like {"question": "..."}` };
    if (typeof it['question'] !== 'string' || !it['question'].trim())
      return { items: [], error: `item ${i + 1}: type the question` };
    // Only the question is kept: step 1's ticks decide the models, and any
    // other key in an uploaded file is dropped.
    items.push({ question: it['question'].trim() });
  }
  return { items, error: null };
}

/** What "Download template" saves. */
const QUESTION_SET_TEMPLATE: QuestionItem[] = [
  { question: 'What was the population of Hessen in 2019?' },
  { question: 'Which states border Bayern?' },
  { question: 'Which cities are within 30 km of Leipzig?' },
];

/** One question per line — the layout every step-2 action writes. */
function setToText(items: object[]): string {
  return '[\n' + items.map(q => '  ' + JSON.stringify(q)).join(',\n') + '\n]';
}

/**
 * The Evaluation tab: tick the models (step 1), give the question set as
 * JSON (step 2), run, follow it, confirm the answers by hand, and download
 * the results — one CSV per model.
 * The evaluator does the work (Agent-001 repo, evaluator/); this only drives it.
 */
@Component({
  selector: 'app-evaluation',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './evaluation.component.html',
  styleUrl: './evaluation.component.scss',
})
export class EvaluationComponent {
  private readonly api = inject(EvaluationApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly fmtNum = fmtNum;
  readonly truncate = truncate;
  readonly CSV_COLUMN_GROUPS = CSV_COLUMN_GROUPS;

  setup = signal<EvalSetup | null>(null);
  error = signal<string | null>(null);
  evaluator = signal<EvaluatorStatus | null>(null);
  evaluatorBusy = signal(false);
  models = signal<ModelChoice[]>([]);
  setText = signal('');
  symmetry = signal(true);
  label = signal('');
  estimate = signal<Estimate | null>(null);
  estimateError = signal<string | null>(null);
  starting = signal(false);

  runs = signal<EvalRun[]>([]);
  selected = signal<number[]>([]);
  results = signal<EvalResults | null>(null);
  questionModel = signal<string>('');

  review = signal<ReviewItem[]>([]);
  onlyOpen = signal(true);
  openView = signal<Record<string, boolean>>({});
  notes: Record<string, string | undefined> = {};

  private readonly planChanged = new Subject<void>();

  parsed = computed(() => parseSet(this.setText()));
  /** The question being typed into step 2's add field. */
  newQuestion = signal('');
  /** The JSON box holds text that doesn't parse — adding/removing would overwrite it. */
  setLocked = computed(() => !!this.parsed().error && !!this.setText().trim());
  /** What runs: the list, plus whatever is typed in the field — so one typed
   *  question can be run straight away, without pressing Add. */
  questions = computed<QuestionItem[]>(() => {
    const typed = this.newQuestion().trim();
    const items = this.parsed().items;
    return typed ? [...items, { question: typed }] : items;
  });
  ticked = computed(() => this.models().filter(m => m.chosen));

  plan = computed<RunPlan>(() => ({
    label: this.label(),
    models: this.ticked().map(m => ({ id: m.id, repeats: m.repeats })),
    items: this.questions(),
    symmetry: this.symmetry(),
  }));

  shownQuestions = computed(() => {
    const r = this.results();
    const model = this.questionModel();
    return r ? r.questions.filter(q => !model || q.model === model) : [];
  });

  resultModels = computed(() => [...new Set((this.results()?.questions ?? []).map(q => q.model))]);

  constructor() {
    this.checkEvaluator(true);
    this.planChanged
      .pipe(debounceTime(400), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.refreshEstimate());
    // Follow the runs while any is going.
    interval(5000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.evaluator()?.running && this.runs().some(r => ACTIVE.has(r.status))) this.loadRuns(false);
      });
  }

  // ── the evaluator itself ───────────────────────────────────────────────────

  /** Is the evaluator running? If so (and `load`), load the tab. */
  checkEvaluator(load: boolean): void {
    this.api.evaluatorStatus().subscribe({
      next: s => {
        this.evaluator.set(s);
        if (s.running && load) this.reload();
      },
      // An agent without the launcher: just try the evaluator directly.
      error: () => this.reload(),
    });
  }

  reload(): void {
    this.loadSetup();
    this.loadRuns(true);
  }

  startEvaluator(): void {
    this.evaluatorBusy.set(true);
    this.error.set(null);
    this.api.startEvaluator().subscribe({
      next: s => {
        this.evaluatorBusy.set(false);
        this.evaluator.set(s);
        this.reload();
      },
      error: e => {
        this.evaluatorBusy.set(false);
        this.error.set(this.describe(e));
      },
    });
  }

  stopEvaluator(): void {
    const going = this.runs().some(r => r.status === 'running');
    if (!confirm('Stop the evaluator?' + (going ? '\n\nThe run in progress stops too; it carries on where it was when you start the evaluator again.' : '')))
      return;
    this.evaluatorBusy.set(true);
    this.api.stopEvaluator().subscribe({
      next: () => setTimeout(() => {
        this.evaluatorBusy.set(false);
        this.setup.set(null);
        this.error.set(null);
        this.checkEvaluator(false);
      }, 1500),
      error: e => {
        this.evaluatorBusy.set(false);
        alert(this.describe(e));
      },
    });
  }

  // ── setup ──────────────────────────────────────────────────────────────────

  loadSetup(): void {
    this.api.setup().subscribe({
      next: s => {
        this.setup.set(s);
        this.symmetry.set(s.symmetry);
        this.models.set(
          s.models.map(m => ({
            id: m.id,
            label: m.label,
            available: m.available,
            availablePeer: m.available_peer,
            peerOnline: m.peer_online,
            priced: m.priced,
            chosen: false,
            repeats: m.default_repeats,
          })),
        );
        this.error.set(null);
      },
      error: e => this.error.set(this.describe(e)),
    });
  }

  toggleModel(id: string, chosen: boolean): void {
    this.models.update(ms => ms.map(m => (m.id === id ? { ...m, chosen } : m)));
    this.planChanged.next();
  }

  setRepeats(id: string, repeats: number): void {
    const r = Math.max(1, Math.min(20, Math.round(Number(repeats) || 1)));
    this.models.update(ms => ms.map(m => (m.id === id ? { ...m, repeats: r } : m)));
    this.planChanged.next();
  }

  // ── step 2: the question set ───────────────────────────────────────────────

  setSetText(text: string): void {
    this.setText.set(text);
    this.estimateError.set(null);
    this.planChanged.next();
  }

  /** Reads a chosen .json file into the box. */
  upload(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    file.text().then(text => {
      this.setSetText(text);
      input.value = '';
    });
  }

  /** Adds the typed question to the set. Text that isn't valid JSON is left
   *  alone (the button is disabled then) so nothing typed so far is lost. */
  addTypedQuestion(): void {
    const question = this.newQuestion().trim();
    if (!question || this.setLocked()) return;
    this.setSetText(setToText([...this.parsed().items, { question }]));
    this.setNewQuestion('');
  }

  /** The typed question is part of the plan, so typing re-estimates it too. */
  setNewQuestion(text: string): void {
    this.newQuestion.set(text);
    this.planChanged.next();
  }

  removeQuestion(index: number): void {
    const items = this.parsed().items.filter((_, i) => i !== index);
    this.setSetText(items.length ? setToText(items) : '');
  }

  /** A sample file in the question-set format, to fill in and upload. */
  downloadTemplate(): void {
    const blob = new Blob([setToText(QUESTION_SET_TEMPLATE) + '\n'], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'question-set-template.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  /** After starting an agent: ask both agents again. */
  checkAgain(): void {
    this.api.setup().subscribe({
      next: s => {
        const byId = new Map(s.models.map(m => [m.id, m]));
        this.models.update(ms => ms.map(m => {
          const fresh = byId.get(m.id);
          return fresh ? { ...m, available: fresh.available, availablePeer: fresh.available_peer, peerOnline: fresh.peer_online } : m;
        }));
        this.refreshEstimate();
      },
      error: e => this.error.set(this.describe(e)),
    });
  }

  setSymmetry(on: boolean): void {
    this.symmetry.set(on);
    this.planChanged.next();
  }

  canStart(): boolean {
    const p = this.plan();
    return !this.starting() && p.models.length > 0 && p.items.length > 0 && !this.planProblem() && !!this.estimate();
  }

  planProblem(): string | null {
    if (!this.ticked().length) return 'step 1: tick at least one model';
    // Whether the peer runs and has the model is checked live by the server
    // on every estimate (it may have been started since this tab loaded).
    for (const m of this.ticked()) {
      if (!m.available) return `${m.label} is not configured on ${this.setup()?.agents.primary}`;
    }
    if (this.parsed().error) return 'step 2: ' + this.parsed().error;
    if (!this.questions().length) return 'step 2: type a question (or upload a .json file)';
    return this.estimateError();
  }

  /** The server checks the plan live — the peer running and having the
   *  models, the set's models and ids — and estimates the run; its
   *  complaint is shown, with "check again". */
  refreshEstimate(): void {
    this.estimateError.set(null);
    const p = this.plan();
    if (this.planProblem()) {
      this.estimate.set(null);
      return;
    }
    this.api.estimate(p).subscribe({
      next: e => this.estimate.set(e),
      error: err => {
        this.estimate.set(null);
        this.estimateError.set(this.describe(err));
      },
    });
  }

  start(): void {
    if (!this.canStart()) return;
    const e = this.estimate();
    const msg =
      `Start this run?\n\n${e?.asks ?? '?'} asks · about $${e?.cost_usd ?? '?'} · about ` +
      `${this.duration(e?.seconds)}\n\nIt runs in the evaluator and keeps going if you close this page.`;
    if (!confirm(msg)) return;
    this.starting.set(true);
    this.api.startRun(this.plan()).subscribe({
      next: run => {
        this.starting.set(false);
        this.setNewQuestion('');
        this.selected.set([run.id]);
        this.loadRuns(true);
      },
      error: err => {
        this.starting.set(false);
        alert(this.describe(err));
      },
    });
  }

  // ── runs ───────────────────────────────────────────────────────────────────

  loadRuns(alsoResults: boolean): void {
    this.api.runs().subscribe({
      next: runs => {
        const before = new Map(this.runs().map(r => [r.id, r.asks_done]));
        this.runs.set(runs);
        if (!this.selected().length && runs.length) this.selected.set([runs[0].id]);
        const progressed = runs.some(r => this.selected().includes(r.id) && before.get(r.id) !== r.asks_done);
        if (alsoResults || progressed) this.loadResults();
        for (const r of runs.filter(x => x.status === 'running')) {
          this.api.run(r.id).subscribe(d => this.runs.update(rs => rs.map(x => (x.id === d.id ? d : x))));
        }
      },
      error: e => this.error.set(this.describe(e)),
    });
  }

  control(run: EvalRun, action: 'pause' | 'resume' | 'cancel'): void {
    if (action === 'cancel' && !confirm(`Cancel run ${run.id}? Its remaining asks are skipped (finished ones are kept).`))
      return;
    this.api.control(run.id, action).subscribe({ next: () => this.loadRuns(false), error: e => alert(this.describe(e)) });
  }

  toggleSelected(id: number, on: boolean): void {
    this.selected.update(s => (on ? [...new Set([...s, id])] : s.filter(x => x !== id)));
    this.loadResults();
  }

  isSelected(id: number): boolean {
    return this.selected().includes(id);
  }

  progress(r: EvalRun): number {
    return r.asks_total ? Math.round((100 * (r.asks_done ?? 0)) / r.asks_total) : 0;
  }

  // ── results and review ─────────────────────────────────────────────────────

  loadResults(): void {
    const ids = this.selected();
    if (!ids.length) {
      this.results.set(null);
      this.review.set([]);
      return;
    }
    this.api.results(ids).subscribe(r => this.results.set(r));
    this.loadReview();
  }

  loadReview(): void {
    const ids = this.selected();
    if (!ids.length) return;
    this.api.review(ids, this.onlyOpen()).subscribe(r => this.review.set(r));
  }

  setOnlyOpen(on: boolean): void {
    this.onlyOpen.set(on);
    this.loadReview();
  }

  judge(item: ReviewItem, verdict: Verdict | null): void {
    const note = this.notes[this.key(item)] ?? item.note ?? null;
    this.api.setVerdict(item.qid, item.fingerprint, verdict, note || null).subscribe({
      next: () => this.loadResults(),
      error: e => alert(this.describe(e)),
    });
  }

  key(item: ReviewItem): string {
    return item.qid + ':' + item.fingerprint;
  }

  toggleView(item: ReviewItem): void {
    const k = this.key(item);
    this.openView.update(v => ({ ...v, [k]: !v[k] }));
  }

  pretty(value: unknown): string {
    return JSON.stringify(value, null, 1);
  }

  modelCsvUrl(model: string): string {
    return this.api.modelCsvUrl(model, this.selected());
  }

  perModelZipUrl(): string {
    return this.api.perModelZipUrl(this.selected());
  }

  // ── formatting ─────────────────────────────────────────────────────────────

  pct(v: number | null | undefined): string {
    return v === null || v === undefined ? '—' : `${Math.round(v * 1000) / 10}%`;
  }

  secs(ms: number | null | undefined): string {
    return ms === null || ms === undefined ? '—' : `${(ms / 1000).toFixed(1)} s`;
  }

  usd(v: number | null | undefined): string {
    if (v === null || v === undefined) return '—';
    return v < 0.01 && v > 0 ? `$${v.toFixed(4)}` : `$${v.toFixed(2)}`;
  }

  duration(seconds: number | null | undefined): string {
    if (seconds === null || seconds === undefined) return '—';
    const h = Math.floor(seconds / 3600);
    const m = Math.round((seconds % 3600) / 60);
    return h ? `${h} h ${m} min` : `${m} min`;
  }

  modelLabel(id: string): string {
    return this.setup()?.models.find(m => m.id === id)?.label ?? id;
  }

  modelLabels(ids: string[]): string {
    return ids.map(id => this.modelLabel(id)).join(', ');
  }

  private describe(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      // 200 that is not JSON: the dev server answered with the app's own page,
      // i.e. it has no /api/eval proxy yet (proxy.conf.json is read at start).
      if (err.status === 200)
        return 'The workbench cannot reach the evaluator: /api/eval is not proxied. Stop and restart "npm start" ' +
          '(it reads proxy.conf.json only when it starts), and start the evaluator in D:\\Agent-001 with: python -m evaluator';
      if ([0, 502, 503, 504].includes(err.status) || (err.status === 500 && !err.error?.detail))
        return 'The evaluator is not reachable. Start it in D:\\Agent-001 with: python -m evaluator';
      return err.error?.detail ? String(err.error.detail) : `${err.status} ${err.statusText}`;
    }
    return String(err);
  }
}
