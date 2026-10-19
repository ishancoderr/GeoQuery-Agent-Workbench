/**
 * What each column of a per-model CSV means — one entry per column of
 * Agent-001/evaluator/metrics.py MODEL_FILE_COLUMNS, grouped by topic.
 * A column added there needs its entry here too.
 * How each value is measured is in evaluator/scoring.py and metrics.py.
 */

export interface ColumnDefinition {
  column: string;
  meaning: string;
}

export interface ColumnGroup {
  group: string;
  columns: ColumnDefinition[];
}

export const CSV_COLUMN_GROUPS: ColumnGroup[] = [
  {
    group: 'run and question',
    columns: [
      { column: 'run_id', meaning: 'Number of the evaluation run this ask belongs to.' },
      { column: 'run_label', meaning: 'The name the run was given when it was started.' },
      { column: 'model', meaning: 'The LLM the agent used for this ask (its id from step 1).' },
      { column: 'qid', meaning: 'Question id, made from the question text — the same question keeps the same id in every run.' },
      { column: 'question', meaning: 'The question that was asked.' },
      {
        column: 'agent_name',
        meaning: 'Which agent answered: Agent-1 (asked every repeat) or Agent-2 (asked once, for the symmetry check).',
      },
      { column: 'rep', meaning: 'Repeat number of this ask: 1 up to the repeats set in step 1 (always 1 for Agent-2).' },
    ],
  },
  {
    group: 'category and extraction — blank for your own questions (they need an answer key)',
    columns: [
      { column: 'expected_category', meaning: 'The category the answer key expects for this question.' },
      { column: 'category_got', meaning: 'The category the agent chose, e.g. DIRECT_LOOKUP or SPATIAL_RELATIONSHIP_BUFFER.' },
      { column: 'category_ok', meaning: '1 = category_got equals expected_category, 0 = it does not.' },
      {
        column: 'extract_ok',
        meaning: '1 = the extracted details (places, years, attributes, …) match the answer key, 0 = they do not. Only checked when the category is right.',
      },
      { column: 'extract_diff', meaning: 'Every field where the extraction differs from the answer key.' },
    ],
  },
  {
    group: 'SQL',
    columns: [
      { column: 'sql_steps', meaning: 'How many SQL steps the agent ran for this question (0 = none; the other SQL columns are then blank).' },
      { column: 'sql_attempts', meaning: 'SQL queries written over all steps, retries included.' },
      { column: 'sql_first_try_ok', meaning: '1 = every SQL step worked on its first attempt, 0 = at least one needed the retry.' },
      { column: 'sql_passed_check', meaning: '1 = every SQL step passed the safety check (at most one retry), 0 = not.' },
      { column: 'sql_ran', meaning: '1 = every SQL step ran on the database without an error (at most one retry), 0 = not.' },
      { column: 'sql_errors', meaning: 'The SQL error messages, separated by " | ". Blank when there were none.' },
    ],
  },
  {
    group: 'answer',
    columns: [
      { column: 'answer_status', meaning: 'Status the agent returned: complete, partial-complete, not-found, rejected or error.' },
      { column: 'answer_summary', meaning: 'A short readable summary of the answer.' },
      {
        column: 'answer_verdict',
        meaning: 'correct or wrong — your ✓ / ✗ from the review, applied to every ask that gave the same answer. A failed request is wrong. Blank = not reviewed yet.',
      },
      {
        column: 'verdict_source',
        meaning: 'confirmed = you judged this answer · automatic = marked wrong because the request failed · unreviewed = not judged yet.',
      },
      { column: 'suggestion', meaning: 'For an unreviewed answer: "differs from the confirmed answer" or "no confirmed answer yet".' },
      {
        column: 'answer_view',
        meaning: 'The answer as it is compared (JSON), without timings, tokens, request ids or which agent supplied a row.',
      },
    ],
  },
  {
    group: 'consistency and symmetry — the same on every row of one question',
    columns: [
      {
        column: 'question_consistency',
        meaning: "Share of this question's repeats on Agent-1 that gave its most common answer (1 = always the same answer).",
      },
      { column: 'question_distinct_answers', meaning: 'How many different answers the repeats gave.' },
      {
        column: 'question_symmetric',
        meaning: "1 = Agent-2 gave the same answer as Agent-1's first answer, 0 = a different one. Blank when symmetry was off.",
      },
    ],
  },
  {
    group: 'tokens and cost',
    columns: [
      { column: 'tokens_in', meaning: 'Input (prompt) tokens of all the LLM calls on the asked agent.' },
      { column: 'tokens_out', meaning: 'Output tokens of all the LLM calls on the asked agent.' },
      { column: 'peer_tokens', meaning: "Tokens the other agent spent answering this agent's KQML asks." },
      { column: 'tokens_total', meaning: 'tokens_in + tokens_out + peer_tokens.' },
      {
        column: 'cost_usd',
        meaning: "Estimated cost in US dollars, from the model's prices in evaluator/settings.yaml. Blank when the model has no price.",
      },
    ],
  },
  {
    group: 'time (milliseconds)',
    columns: [
      { column: 'wall_ms', meaning: 'Whole time for the question as the evaluator saw it, network included.' },
      { column: 'ms_agent', meaning: "The agent's own total processing time." },
      { column: 'ms_classify', meaning: 'Time of the LLM call that chose the category.' },
      { column: 'ms_extract', meaning: 'Time of the LLM call that extracted the details.' },
      { column: 'ms_sql', meaning: 'Time of the LLM calls that wrote the SQL.' },
      { column: 'ms_kqml', meaning: 'Time of the KQML round trips to the other agent.' },
      { column: 'kqml_turns', meaning: 'How many KQML exchanges with the other agent the question needed (0 = answered alone).' },
      { column: 'llm_calls', meaning: 'How many LLM calls the agent made (category, extraction, SQL writing, …).' },
    ],
  },
  {
    group: 'question size',
    columns: [
      { column: 'n_places', meaning: 'Places the question names (states, cities, reference places).' },
      { column: 'n_years', meaning: 'Years the question asks for.' },
      { column: 'n_attributes', meaning: 'Attributes the question asks for (population, marriages, live births, …).' },
    ],
  },
  {
    group: 'request',
    columns: [
      {
        column: 'fingerprint',
        meaning: 'A short code for the answer: two asks with the same fingerprint gave the same answer. error-… = the request failed.',
      },
      { column: 'status', meaning: 'ok = the agent answered (HTTP 200) · error = the request failed.' },
      { column: 'http_status', meaning: "HTTP status code of the agent's reply (200 = OK)." },
      { column: 'error', meaning: 'The error message when the request failed.' },
      { column: 'started_at', meaning: 'When the ask was sent (UTC, e.g. 2026-10-18T09:15:02+00:00).' },
      { column: 'finished_at', meaning: 'When the answer came back (UTC).' },
    ],
  },
];
