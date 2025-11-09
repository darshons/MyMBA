export interface KnowledgeSection {
  departmentId?: string;
  departmentName: string;
  content: string;
  lastUpdated: string;
}

export interface CompanyKnowledge {
  companyName: string;
  overview: string;
  sections: KnowledgeSection[];
  lastUpdated: string;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'in_progress' | 'completed' | 'blocked';
  assignedDepartments: string[]; // department IDs
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  blockers?: string[];
}

export interface ProposedAction {
  id: string;
  goalId?: string;
  departmentId: string;
  departmentName: string;
  agentId: string;
  agentName: string;
  action: string;
  reasoning: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNotes?: string;
}

export interface KnowledgeEvent {
  id: string;
  type: 'goal_created' | 'goal_updated' | 'knowledge_updated' | 'action_proposed' | 'action_approved' | 'action_rejected' | 'execution_completed';
  data: any;
  triggeredBy: 'user' | 'agent' | 'system';
  timestamp: string;
  handled: boolean;
}
