import { Node, Edge } from '@xyflow/react';

export interface AgentData extends Record<string, unknown> {
  id: string;
  name: string;
  instructions: string;
  status?: 'idle' | 'active' | 'completed';
  toolsEnabled?: boolean;
  colorIndex?: number;
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
