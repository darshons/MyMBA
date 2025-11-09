// Proposed team structure from AI (before approval)
export interface ProposedCompany {
  name: string;
  industry: string;
  departments: ProposedAgent[]; // Still called "departments" for API compatibility
  reasoning?: string;
}

export interface ProposedAgent {
  name: string; // Focus area/specialty
  description: string;
  suggestedAgent: {
    name: string;
    role: string;
    responsibilities: string;
  };
}
