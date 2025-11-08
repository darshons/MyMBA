import { create } from 'zustand';
import { addEdge, applyNodeChanges, applyEdgeChanges, Connection, EdgeChange, NodeChange } from '@xyflow/react';
import { AgentNode, AgentEdge, AgentData, WorkflowExecution, ExecutionResult } from '@/types';

interface FlowState {
  nodes: AgentNode[];
  edges: AgentEdge[];
  execution: WorkflowExecution | null;
  isModalOpen: boolean;
  editingAgent: AgentData | null;

  // Node/Edge operations
  onNodesChange: (changes: NodeChange<AgentNode>[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  addAgent: (agent: Omit<AgentData, 'id'>) => void;
  updateAgent: (id: string, data: Partial<AgentData>) => void;
  deleteAgent: (id: string) => void;

  // Modal operations
  openModal: (agent?: AgentData) => void;
  closeModal: () => void;

  // Workflow execution
  startExecution: (input: string) => void;
  addExecutionResult: (result: ExecutionResult) => void;
  completeExecution: () => void;
  setExecution: (execution: WorkflowExecution | null) => void;
  updateNodeStatus: (nodeId: string, status: 'idle' | 'active' | 'completed') => void;

  // Template loading
  loadTemplate: (templateName: string) => void;
}

export const useFlowStore = create<FlowState>((set, get) => ({
  nodes: [],
  edges: [],
  execution: null,
  isModalOpen: false,
  editingAgent: null,

  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes) as AgentNode[],
    });
  },

  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },

  onConnect: (connection) => {
    set({
      edges: addEdge(connection, get().edges),
    });
  },

  addAgent: (agent) => {
    const id = `agent-${Date.now()}`;
    const newNode: AgentNode = {
      id,
      type: 'agentNode',
      position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
      data: {
        ...agent,
        id,
        status: 'idle',
      } as AgentData,
    };
    set({ nodes: [...get().nodes, newNode] });
  },

  updateAgent: (id, data) => {
    set({
      nodes: get().nodes.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, ...data } } : node
      ),
    });
  },

  deleteAgent: (id) => {
    set({
      nodes: get().nodes.filter((node) => node.id !== id),
      edges: get().edges.filter((edge) => edge.source !== id && edge.target !== id),
    });
  },

  openModal: (agent) => {
    set({ isModalOpen: true, editingAgent: agent || null });
  },

  closeModal: () => {
    set({ isModalOpen: false, editingAgent: null });
  },

  startExecution: (input) => {
    // Reset all node statuses
    set({
      nodes: get().nodes.map((node) => ({
        ...node,
        data: { ...node.data, status: 'idle' },
      })),
      execution: {
        input,
        results: [],
        status: 'running',
      },
    });
  },

  addExecutionResult: (result) => {
    const currentExecution = get().execution;
    if (currentExecution) {
      set({
        execution: {
          ...currentExecution,
          results: [...currentExecution.results, result],
        },
      });
    }
  },

  completeExecution: () => {
    const currentExecution = get().execution;
    if (currentExecution) {
      set({
        execution: {
          ...currentExecution,
          status: 'completed',
        },
      });
    }
  },

  setExecution: (execution) => {
    set({ execution });
  },

  updateNodeStatus: (nodeId, status) => {
    set({
      nodes: get().nodes.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, status } } : node
      ),
    });
  },

  loadTemplate: (templateName) => {
    if (templateName === 'customer-support') {
      const intakeNode: AgentNode = {
        id: 'intake-1',
        type: 'agentNode',
        position: { x: 100, y: 200 },
        data: {
          id: 'intake-1',
          name: 'Intake Agent',
          type: 'intake',
          instructions: 'You analyze customer inquiries and categorize them as billing, technical, or general. Respond with the category and a brief summary.',
          status: 'idle',
        },
      };

      const processingNode: AgentNode = {
        id: 'processing-1',
        type: 'agentNode',
        position: { x: 400, y: 200 },
        data: {
          id: 'processing-1',
          name: 'Technical Support Agent',
          type: 'processing',
          instructions: 'You solve technical issues and provide step-by-step solutions. Be detailed and helpful.',
          status: 'idle',
        },
      };

      const responseNode: AgentNode = {
        id: 'response-1',
        type: 'agentNode',
        position: { x: 700, y: 200 },
        data: {
          id: 'response-1',
          name: 'Response Agent',
          type: 'response',
          instructions: 'You format the solution into a friendly customer response. Be empathetic and clear.',
          status: 'idle',
        },
      };

      const edge1: AgentEdge = {
        id: 'e-intake-processing',
        source: 'intake-1',
        target: 'processing-1',
        animated: true,
      };

      const edge2: AgentEdge = {
        id: 'e-processing-response',
        source: 'processing-1',
        target: 'response-1',
        animated: true,
      };

      set({
        nodes: [intakeNode, processingNode, responseNode],
        edges: [edge1, edge2],
      });
    }
  },
}));
