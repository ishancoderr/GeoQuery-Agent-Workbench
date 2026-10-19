/**
 * The language models an agent can answer with — GET /llms on the agent
 * (Agent-001/config/settings.yaml, llm.models). `available` is false when the
 * agent's .env lacks that provider's credentials (OpenAI / Anthropic key, or
 * the openweight-llm host and key for the Qwen models).
 */
export interface LlmOption {
  id: string;
  label: string;
  provider: 'openai' | 'anthropic' | 'openweight';
  available: boolean;
}

export interface LlmList {
  default: string;
  models: LlmOption[];
}

/** The model that answered a /query — the agent adds it to every response. */
export interface AnsweredBy {
  id: string;
  label: string;
}
