import { create } from 'zustand';
import { addEdge, applyNodeChanges, applyEdgeChanges, Connection, EdgeChange, NodeChange } from '@xyflow/react';
import { AgentNode, AgentEdge, AgentData, WorkflowExecution, ExecutionResult } from '@/types';
import { saveExecution } from '@/lib/storage';
import { getNextColorIndex } from '@/lib/colors';

interface FlowState {
  nodes: AgentNode[];
  edges: AgentEdge[];
  execution: WorkflowExecution | null;
  isModalOpen: boolean;
  editingAgent: AgentData | null;
  currentWorkflowId: string | null;
  currentWorkflowName: string;

  // Node/Edge operations
  onNodesChange: (changes: NodeChange<AgentNode>[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  addAgent: (agent: Omit<AgentData, 'id'>) => void;
  updateAgent: (id: string, data: Partial<AgentData>) => void;
  deleteAgent: (id: string) => void;

  // Sticky Note operations
  addStickyNote: (text?: string, color?: string) => void;
  updateStickyNote: (id: string, data: { text?: string; color?: string }) => void;
  deleteStickyNote: (id: string) => void;

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

  // AI workflow generation
  generateWorkflowFromAI: (agents: any[], connections: any[]) => void;

  // Workflow management
  setWorkflowName: (name: string) => void;
  saveCurrentWorkflow: () => void;
}

export const useFlowStore = create<FlowState>((set, get) => ({
  nodes: [],
  edges: [],
  execution: null,
  isModalOpen: false,
  editingAgent: null,
  currentWorkflowId: null,
  currentWorkflowName: 'My Workflow',

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
      position: { x: Math.random() * 800 + 100, y: Math.random() * 600 + 100 },
      data: {
        ...agent,
        id,
        status: 'idle',
        colorIndex: getNextColorIndex(),
      } as AgentData,
    };

    set({ nodes: [...get().nodes, newNode] });
  },

  updateAgent: (id, data) => {
    set({
      nodes: get().nodes.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, ...data } } as AgentNode : node
      ),
    });
  },

  deleteAgent: (id) => {
    set({
      nodes: get().nodes.filter((node) => node.id !== id),
      edges: get().edges.filter((edge) => edge.source !== id && edge.target !== id),
    });
  },

  addStickyNote: (text = '', color = '#FEF08A') => {
    const id = `sticky-${Date.now()}`;
    const newNode = {
      id,
      type: 'stickyNote',
      position: { x: Math.random() * 400 + 200, y: Math.random() * 400 + 100 },
      data: {
        id,
        text,
        color,
      },
    };

    set({ nodes: [...get().nodes, newNode as any] });
  },

  updateStickyNote: (id, data) => {
    set({
      nodes: get().nodes.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, ...data } } : node
      ),
    });

    // Update company knowledge base with sticky note content
    if (data.text && data.text.trim()) {
      fetch('/api/knowledge/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'add_note',
          data: data.text,
        }),
      }).catch(error => {
        console.error('Failed to update knowledge base with sticky note:', error);
      });
    }
  },

  deleteStickyNote: (id) => {
    set({
      nodes: get().nodes.filter((node) => node.id !== id),
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
    const { currentWorkflowId, currentWorkflowName } = get();

    if (currentExecution) {
      const completedExecution = {
        ...currentExecution,
        status: 'completed' as const,
      };

      set({ execution: completedExecution });

      // Save to localStorage
      saveExecution({
        id: `exec-${Date.now()}`,
        workflowId: currentWorkflowId || 'default',
        workflowName: currentWorkflowName,
        input: completedExecution.input,
        results: completedExecution.results,
        status: completedExecution.status,
        createdAt: Date.now(),
      });

      // Update knowledge base with completed work
      completedExecution.results.forEach((result) => {
        const date = new Date().toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
        const truncatedInput = result.input.length > 50
          ? result.input.substring(0, 50) + '...'
          : result.input;
        const truncatedOutput = result.output.length > 200
          ? result.output.substring(0, 200) + '...'
          : result.output;

        const workEntry = `[${date}] ${truncatedInput}: ${truncatedOutput}`;

        // Update knowledge base for this agent's department
        fetch('/api/knowledge/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'add_learning',
            departmentName: result.agentName,
            data: workEntry,
          }),
        }).catch((error) => {
          console.error('Failed to update knowledge base with work history:', error);
        });
      });
    }
  },

  setExecution: (execution) => {
    set({ execution });
  },

  updateNodeStatus: (nodeId, status) => {
    set({
      nodes: get().nodes.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, status } } as AgentNode : node
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
          instructions: 'You analyze customer inquiries and categorize them as billing, technical, or general. Respond with the category and a brief summary.',
          status: 'idle',
          colorIndex: getNextColorIndex(),
        },
      };

      const processingNode: AgentNode = {
        id: 'processing-1',
        type: 'agentNode',
        position: { x: 400, y: 200 },
        data: {
          id: 'processing-1',
          name: 'Technical Support Agent',
          instructions: 'You solve technical issues and provide step-by-step solutions. Be detailed and helpful.',
          status: 'idle',
          colorIndex: getNextColorIndex(),
        },
      };

      const responseNode: AgentNode = {
        id: 'response-1',
        type: 'agentNode',
        position: { x: 700, y: 200 },
        data: {
          id: 'response-1',
          name: 'Response Agent',
          instructions: 'You format the solution into a friendly customer response. Be empathetic and clear.',
          status: 'idle',
          colorIndex: getNextColorIndex(),
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
    } else if (templateName === 'lead-qualification') {
      // Lead Qualification Pipeline - Real business use case
      const intakeAgent: AgentNode = {
        id: 'lead-intake',
        type: 'agentNode',
        position: { x: 100, y: 150 },
        data: {
          id: 'lead-intake',
          name: 'Lead Intake Specialist',
          instructions: 'You receive inbound lead data and extract key information: company name, contact name, email, phone, industry, company size, and initial request. Parse the input and structure it clearly for the next agent.',
          status: 'idle',
          toolsEnabled: false,
          colorIndex: getNextColorIndex(),
        },
      };

      const researchAgent: AgentNode = {
        id: 'lead-research',
        type: 'agentNode',
        position: { x: 100, y: 350 },
        data: {
          id: 'lead-research',
          name: 'Company Research Analyst',
          instructions: 'You enrich lead data using web search. Search for the company online and gather: recent news, funding status, key products/services, company size validation, and potential pain points. Provide a concise summary of findings.',
          status: 'idle',
          toolsEnabled: true,
          colorIndex: getNextColorIndex(),
        },
      };

      const scoringAgent: AgentNode = {
        id: 'lead-scoring',
        type: 'agentNode',
        position: { x: 400, y: 250 },
        data: {
          id: 'lead-scoring',
          name: 'Lead Scoring Analyst',
          instructions: 'You score leads from 0-100 based on: company size (25 pts), industry fit (25 pts), budget indicators (25 pts), and urgency signals (25 pts). Provide the score with a brief justification. Categorize as Hot (80+), Warm (50-79), or Cold (<50).',
          status: 'idle',
          toolsEnabled: false,
          colorIndex: getNextColorIndex(),
        },
      };

      const outreachAgent: AgentNode = {
        id: 'lead-outreach',
        type: 'agentNode',
        position: { x: 700, y: 150 },
        data: {
          id: 'lead-outreach',
          name: 'Outreach Specialist',
          instructions: 'You draft a personalized outreach email based on the lead score and research. For Hot leads: schedule a call immediately. For Warm leads: educational content offer. For Cold leads: nurture sequence. Keep it concise and value-focused.',
          status: 'idle',
          toolsEnabled: false,
          colorIndex: getNextColorIndex(),
        },
      };

      const crmAgent: AgentNode = {
        id: 'lead-crm',
        type: 'agentNode',
        position: { x: 700, y: 350 },
        data: {
          id: 'lead-crm',
          name: 'CRM Integration Specialist',
          instructions: 'You post a summary to the #sales Slack channel with: lead name, company, score, category (Hot/Warm/Cold), key findings, and recommended next action. Format it clearly with emojis for visual scanning.',
          status: 'idle',
          toolsEnabled: true,
          colorIndex: getNextColorIndex(),
        },
      };

      const edges: AgentEdge[] = [
        {
          id: 'e-intake-research',
          source: 'lead-intake',
          target: 'lead-research',
          animated: true,
        },
        {
          id: 'e-research-scoring',
          source: 'lead-research',
          target: 'lead-scoring',
          animated: true,
        },
        {
          id: 'e-scoring-outreach',
          source: 'lead-scoring',
          target: 'lead-outreach',
          animated: true,
        },
        {
          id: 'e-scoring-crm',
          source: 'lead-scoring',
          target: 'lead-crm',
          animated: true,
        },
      ];

      set({
        nodes: [intakeAgent, researchAgent, scoringAgent, outreachAgent, crmAgent],
        edges: edges,
      });
    }
  },

  generateWorkflowFromAI: (agents, connections) => {
    const nodeMap = new Map<string, string>();
    const newNodes: AgentNode[] = [];
    const newEdges: AgentEdge[] = [];

    // Create nodes from agents
    agents.forEach((agent, index) => {
      const id = `agent-${Date.now()}-${index}`;
      nodeMap.set(agent.name, id);

      const node: AgentNode = {
        id,
        type: 'agentNode',
        position: {
          x: 150 + (index * 300),
          y: 200 + (Math.floor(index / 3) * 150)
        },
        data: {
          id,
          name: agent.name,
          instructions: agent.instructions,
          status: 'idle',
          toolsEnabled: true,
          colorIndex: getNextColorIndex(),
        } as AgentData,
      };

      newNodes.push(node);
    });

    // Create edges from connections
    connections.forEach((connection, index) => {
      const sourceId = nodeMap.get(connection.from);
      const targetId = nodeMap.get(connection.to);

      if (sourceId && targetId) {
        newEdges.push({
          id: `edge-${Date.now()}-${index}`,
          source: sourceId,
          target: targetId,
          animated: true,
        });
      }
    });

    set({ nodes: newNodes, edges: newEdges });
  },

  setWorkflowName: (name) => {
    set({ currentWorkflowName: name });
  },

  saveCurrentWorkflow: () => {
    // This will be used to save workflow to LocalStorage if needed
    // For now, workflows are auto-generated, so we might not need manual saving
  },
}));
