export type AgentId = 'agent1' | 'agent2';

export const AGENT_IDS: AgentId[] = ['agent1', 'agent2'];

export interface AgentMeta {
  id: AgentId;
  label: string;
  port: number;
  color: 'agent1' | 'agent2';
}

export const AGENT_META: Record<AgentId, AgentMeta> = {
  agent1: { id: 'agent1', label: 'Agent-001', port: 8000, color: 'agent1' },
  agent2: { id: 'agent2', label: 'Agent-002', port: 8001, color: 'agent2' },
};

export function peerOf(agentId: AgentId): AgentId {
  return agentId === 'agent1' ? 'agent2' : 'agent1';
}

export type HealthStatus = 'unknown' | 'online' | 'offline';

export type RequestStatus = 'idle' | 'loading' | 'success' | 'error';
