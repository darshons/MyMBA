import { AgentNode } from './index';

// Department node in the hierarchy canvas
export interface Department {
  id: string;
  name: string;
  description: string;
  parentId?: string; // For subdepartments

  // Single agent that handles all tasks for this department
  agent: AgentNode;

  // Visual position in hierarchy canvas
  position?: { x: number; y: number };

  // Metadata
  createdAt: number;
  taskCount?: number;
  avgRating?: number;
}

// Company structure
export interface Company {
  id: string;
  name: string;
  industry: string;
  description?: string;

  // All departments (flat array, use parentId for hierarchy)
  departments: Department[];

  // Metadata
  createdAt: number;
  lastModified: number;
}

// Proposed department structure from AI (before approval)
export interface ProposedCompany {
  name: string;
  industry: string;
  departments: ProposedDepartment[];
  reasoning?: string; // Why these departments
}

export interface ProposedDepartment {
  name: string;
  description: string;
  parentName?: string; // For subdepartments
  suggestedAgent: {
    name: string;
    role: string;
    responsibilities: string;
  };
}

// Department node type for React Flow
export interface DepartmentNodeData extends Record<string, unknown> {
  departmentId: string;
  name: string;
  description: string;
  agentName: string;
  subdepartmentCount: number;
  status?: 'idle' | 'active' | 'completed';
}

export type DepartmentNode = {
  id: string;
  type: 'departmentNode';
  position: { x: number; y: number };
  data: DepartmentNodeData;
};
