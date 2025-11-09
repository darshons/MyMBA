'use client';

import { useState } from 'react';
import FlowCanvas from '@/components/FlowCanvas';
import CEOChat from '@/components/CEOChat';
import { ProposedCompany } from '@/types/company';
import { useFlowStore } from '@/store/useFlowStore';

export default function Home() {
  const [showChat, setShowChat] = useState(false);
  const [proposedCompany, setProposedCompany] = useState<ProposedCompany | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { addAgent } = useFlowStore();

  const handleCompanyCreationRequest = async (industry: string, description: string) => {
    setIsGenerating(true);

    try {
      const response = await fetch('/api/generate-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ industry, description }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate company');
      }

      const data = await response.json();
      setProposedCompany({
        name: data.companyName,
        industry,
        departments: data.departments,
        reasoning: data.reasoning,
      });
    } catch (error) {
      console.error('Company generation error:', error);
      alert('Failed to generate company structure. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApproveCompany = async () => {
    if (!proposedCompany) return;

    try {
      // First, reset the company.md file to clean slate
      await fetch('/api/knowledge/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      // Clear all localStorage data from previous company
      if (typeof window !== 'undefined') {
        localStorage.removeItem('agentflow_executions');
        localStorage.removeItem('agentflow_workflows');
        localStorage.removeItem('agentflow_current_workflow');
        localStorage.removeItem('agentflow_goals');
        localStorage.removeItem('agentflow_proposed_actions');
        localStorage.removeItem('agentflow_events');
        localStorage.removeItem('agentflow_company');
        console.log('Cleared all localStorage data for new company');
      }

      // Create all agents as standalone nodes - use for loop with small delay to avoid race conditions
      for (let index = 0; index < proposedCompany.departments.length; index++) {
        const proposedDept = proposedCompany.departments[index];

        addAgent({
          name: proposedDept.suggestedAgent.name,
          instructions: `You are ${proposedDept.suggestedAgent.name}, ${proposedDept.suggestedAgent.role}. Your responsibilities: ${proposedDept.suggestedAgent.responsibilities}`,
          toolsEnabled: true,
        });

        // Small delay to ensure state updates complete
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      // Update company overview in knowledge base
      await fetch('/api/knowledge/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'company_overview',
          data: {
            industry: proposedCompany.industry,
            mission: `Build an innovative ${proposedCompany.industry} company`,
            goals: ['Establish company structure', 'Build effective team'],
            problems: [],
          },
        }),
      });

      setProposedCompany(null);
    } catch (error) {
      console.error('Failed to create company:', error);
    }
  };

  const handleRejectCompany = () => {
    setProposedCompany(null);
  };

  const handleAgentCreationRequest = async (description: string) => {
    setIsGenerating(true);

    try {
      // Call workflow generation API to get agent structure
      const response = await fetch('/api/generate-workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate agent');
      }

      const data = await response.json();

      // Create standalone agent using the store
      addAgent({
        name: data.agent.name,
        instructions: data.agent.instructions,
        toolsEnabled: true,
      });

      alert(`Agent "${data.agent.name}" created successfully!`);
    } catch (error) {
      console.error('Agent creation error:', error);
      alert('Failed to create agent. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full">
      {/* Proposed Company Modal */}
      {proposedCompany && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-2 text-[#141413]">{proposedCompany.name}</h2>
            <p className="text-sm text-[#828179] mb-4">{proposedCompany.industry}</p>

            {proposedCompany.reasoning && (
              <div className="mb-4 p-3 bg-[#F0EFEA] border border-[#828179] rounded-lg">
                <p className="text-sm text-[#141413]">{proposedCompany.reasoning}</p>
              </div>
            )}

            <h3 className="font-semibold text-[#141413] mb-3">Proposed Team ({proposedCompany.departments.length} Agents):</h3>

            <div className="space-y-3 mb-6">
              {proposedCompany.departments.map((dept, idx) => (
                <div key={idx} className="border border-[#828179] rounded-lg p-4 bg-[#F0EFEA]">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-[#CC785C] rounded-full mt-2"></div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-[#141413] text-base">{dept.suggestedAgent.name}</h4>
                      <p className="text-xs text-[#828179] font-medium mt-0.5">{dept.suggestedAgent.role}</p>
                      <p className="text-sm text-[#141413] mt-2">{dept.suggestedAgent.responsibilities}</p>
                      <p className="text-xs text-[#828179] mt-2 italic">Focus area: {dept.name}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleApproveCompany}
                className="flex-1 bg-[#CC785C] text-white px-4 py-3 rounded-lg hover:bg-[#b86a4f] transition font-semibold"
              >
                Approve & Create Team
              </button>
              <button
                onClick={handleRejectCompany}
                className="flex-1 bg-[#F0EFEA] text-[#141413] px-4 py-3 rounded-lg hover:bg-[#e5e4df] transition font-semibold border border-[#828179]"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading overlay during generation */}
      {isGenerating && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-40">
          <div className="bg-white rounded-lg p-6 text-center">
            <div className="animate-spin w-12 h-12 border-4 border-[#CC785C] border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-[#141413] font-medium">Generating your team...</p>
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <FlowCanvas />
      </div>

      {/* Hover trigger zone on left edge */}
      <div
        onMouseEnter={() => setShowChat(true)}
        className="fixed left-0 top-0 bottom-0 w-4 z-50 cursor-pointer"
        style={{ pointerEvents: showChat ? 'none' : 'auto' }}
      />

      {/* Command Center - Left Sidebar */}
      <div
        onMouseLeave={() => setShowChat(false)}
        className={`fixed left-0 top-0 bottom-0 w-96 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-40 ${
          showChat ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <CEOChat
          onCompanyCreationRequest={handleCompanyCreationRequest}
          onAgentCreationRequest={handleAgentCreationRequest}
        />
      </div>
    </div>
  );
}
