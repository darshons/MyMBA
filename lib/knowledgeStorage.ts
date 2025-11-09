import { Goal, ProposedAction, KnowledgeEvent } from '@/types/knowledge';

// LocalStorage keys
const GOALS_KEY = 'agentflow_goals';
const ACTIONS_KEY = 'agentflow_proposed_actions';
const EVENTS_KEY = 'agentflow_events';

// ============ GOALS ============

export function getGoals(): Goal[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(GOALS_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function saveGoals(goals: Goal[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
}

export function createGoal(
  title: string,
  description: string,
  priority: Goal['priority'],
  assignedDepartments: string[]
): Goal {
  const goal: Goal = {
    id: `goal-${Date.now()}`,
    title,
    description,
    priority,
    status: 'active',
    assignedDepartments,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const goals = getGoals();
  goals.unshift(goal);
  saveGoals(goals);

  // Trigger event
  addEvent({
    type: 'goal_created',
    data: goal,
    triggeredBy: 'user',
  });

  return goal;
}

export function updateGoal(goalId: string, updates: Partial<Goal>): Goal | null {
  const goals = getGoals();
  const index = goals.findIndex((g) => g.id === goalId);

  if (index === -1) return null;

  goals[index] = {
    ...goals[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  saveGoals(goals);

  // Trigger event
  addEvent({
    type: 'goal_updated',
    data: goals[index],
    triggeredBy: 'user',
  });

  return goals[index];
}

export function getActiveGoals(): Goal[] {
  return getGoals().filter((g) => g.status === 'active' || g.status === 'in_progress');
}

export function getGoalsByDepartment(departmentId: string): Goal[] {
  return getGoals().filter((g) => g.assignedDepartments.includes(departmentId));
}

// ============ PROPOSED ACTIONS ============

export function getProposedActions(): ProposedAction[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(ACTIONS_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function saveProposedActions(actions: ProposedAction[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACTIONS_KEY, JSON.stringify(actions));
}

export function proposeAction(
  departmentId: string,
  departmentName: string,
  agentId: string,
  agentName: string,
  action: string,
  reasoning: string,
  goalId?: string
): ProposedAction {
  const proposedAction: ProposedAction = {
    id: `action-${Date.now()}`,
    goalId,
    departmentId,
    departmentName,
    agentId,
    agentName,
    action,
    reasoning,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  const actions = getProposedActions();
  actions.unshift(proposedAction);
  saveProposedActions(actions);

  // Trigger event
  addEvent({
    type: 'action_proposed',
    data: proposedAction,
    triggeredBy: 'agent',
  });

  return proposedAction;
}

export function approveAction(actionId: string, reviewNotes?: string): ProposedAction | null {
  const actions = getProposedActions();
  const index = actions.findIndex((a) => a.id === actionId);

  if (index === -1) return null;

  actions[index] = {
    ...actions[index],
    status: 'approved',
    reviewedAt: new Date().toISOString(),
    reviewedBy: 'user',
    reviewNotes,
  };

  saveProposedActions(actions);

  // Trigger event
  addEvent({
    type: 'action_approved',
    data: actions[index],
    triggeredBy: 'user',
  });

  return actions[index];
}

export function rejectAction(actionId: string, reviewNotes?: string): ProposedAction | null {
  const actions = getProposedActions();
  const index = actions.findIndex((a) => a.id === actionId);

  if (index === -1) return null;

  actions[index] = {
    ...actions[index],
    status: 'rejected',
    reviewedAt: new Date().toISOString(),
    reviewedBy: 'user',
    reviewNotes,
  };

  saveProposedActions(actions);

  // Trigger event
  addEvent({
    type: 'action_rejected',
    data: actions[index],
    triggeredBy: 'user',
  });

  return actions[index];
}

export function getPendingActions(): ProposedAction[] {
  return getProposedActions().filter((a) => a.status === 'pending');
}

// ============ EVENTS ============

export function getEvents(): KnowledgeEvent[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(EVENTS_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function saveEvents(events: KnowledgeEvent[]): void {
  if (typeof window === 'undefined') return;
  // Keep only last 500 events
  const trimmed = events.slice(0, 500);
  localStorage.setItem(EVENTS_KEY, JSON.stringify(trimmed));
}

export function addEvent(event: Omit<KnowledgeEvent, 'id' | 'timestamp' | 'handled'>): KnowledgeEvent {
  const newEvent: KnowledgeEvent = {
    ...event,
    id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    handled: false,
  };

  const events = getEvents();
  events.unshift(newEvent);
  saveEvents(events);

  return newEvent;
}

export function markEventHandled(eventId: string): void {
  const events = getEvents();
  const index = events.findIndex((e) => e.id === eventId);

  if (index !== -1) {
    events[index].handled = true;
    saveEvents(events);
  }
}

export function getUnhandledEvents(): KnowledgeEvent[] {
  return getEvents().filter((e) => !e.handled);
}
