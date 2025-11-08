import { Node, Edge } from '@xyflow/react';

export type AgentType = 'intake' | 'processing' | 'response';

export interface AgentData extends Record<string, unknown> {
  id: string;
  name: string;
  type: AgentType;
  instructions: string;
  status?: 'idle' | 'active' | 'completed';
}

export type AgentNode = Node<AgentData, 'agentNode'>;
export type AgentEdge = Edge;

export interface ExecutionResult {
  agentId: string;
  agentName: string;
  input: string;
  output: string;
  timestamp: number;
}

export interface WorkflowExecution {
  input: string;
  results: ExecutionResult[];
  status: 'running' | 'completed' | 'error';
}
