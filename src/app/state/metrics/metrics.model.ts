import { AgentId } from '../../core/models/agent.model';

export interface MetricsEntry {
  time: string;
  agentId: AgentId;
  query: string;
  status: string;
  totalMs: number;
  tokens: number;
  kqmlTurns: number | null;
  recordCount: number;
  completenessPct: number | null;
}
