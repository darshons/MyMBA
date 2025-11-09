// LocalStorage utilities for persistence

export interface SavedWorkflow {
  id: string;
  name: string;
  description?: string;
  nodes: any[];
  edges: any[];
  createdAt: number;
}

export interface SavedExecution {
  id: string;
  workflowId: string;
  workflowName: string;
  input: string;
  results: any[];
  status: string;
  feedback?: {
    rating: number;
    comment: string;
  };
  createdAt: number;
}

const WORKFLOWS_KEY = 'agentflow_workflows';
const EXECUTIONS_KEY = 'agentflow_executions';
const CURRENT_WORKFLOW_KEY = 'agentflow_current_workflow';

// Workflows
export function saveWorkflow(workflow: SavedWorkflow): void {
  const workflows = getAllWorkflows();
  const existing = workflows.findIndex(w => w.id === workflow.id);

  if (existing >= 0) {
    workflows[existing] = workflow;
  } else {
    workflows.push(workflow);
  }

  localStorage.setItem(WORKFLOWS_KEY, JSON.stringify(workflows));
}

export function getAllWorkflows(): SavedWorkflow[] {
  const data = localStorage.getItem(WORKFLOWS_KEY);
  return data ? JSON.parse(data) : [];
}

export function getWorkflow(id: string): SavedWorkflow | null {
  const workflows = getAllWorkflows();
  return workflows.find(w => w.id === id) || null;
}

export function deleteWorkflow(id: string): void {
  const workflows = getAllWorkflows().filter(w => w.id !== id);
  localStorage.setItem(WORKFLOWS_KEY, JSON.stringify(workflows));
}

// Current Workflow
export function saveCurrentWorkflow(workflow: SavedWorkflow): void {
  localStorage.setItem(CURRENT_WORKFLOW_KEY, JSON.stringify(workflow));
}

export function getCurrentWorkflow(): SavedWorkflow | null {
  const data = localStorage.getItem(CURRENT_WORKFLOW_KEY);
  return data ? JSON.parse(data) : null;
}

// Executions
export function saveExecution(execution: SavedExecution): void {
  const executions = getAllExecutions();
  const existing = executions.findIndex(e => e.id === execution.id);

  if (existing >= 0) {
    executions[existing] = execution;
  } else {
    executions.unshift(execution); // Add to beginning
  }

  // Keep only last 100 executions
  const trimmed = executions.slice(0, 100);
  localStorage.setItem(EXECUTIONS_KEY, JSON.stringify(trimmed));
}

export function getAllExecutions(): SavedExecution[] {
  const data = localStorage.getItem(EXECUTIONS_KEY);
  return data ? JSON.parse(data) : [];
}

export function getExecutionsByWorkflow(workflowId: string): SavedExecution[] {
  return getAllExecutions().filter(e => e.workflowId === workflowId);
}

export function getExecution(id: string): SavedExecution | null {
  const executions = getAllExecutions();
  return executions.find(e => e.id === id) || null;
}

export function updateExecutionFeedback(id: string, feedback: { rating: number; comment: string }): void {
  const executions = getAllExecutions();
  const execution = executions.find(e => e.id === id);

  if (execution) {
    execution.feedback = feedback;
    localStorage.setItem(EXECUTIONS_KEY, JSON.stringify(executions));
  }
}
