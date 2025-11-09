'use client';

import { useState } from 'react';
import FlowCanvas from '@/components/FlowCanvas';
import CEOChat from '@/components/CEOChat';
import KnowledgeViewer from '@/components/KnowledgeViewer';
import { ProposedCompany } from '@/types/company';
import { createCompany, addDepartment } from '@/lib/companyStorage';
import { AgentNode } from '@/types';

export default function Home() {
  const [showChat, setShowChat] = useState(false);
  const [chatMinimized, setChatMinimized] = useState(false);
  const [proposedCompany, setProposedCompany] = useState<ProposedCompany | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [companyRefreshKey, setCompanyRefreshKey] = useState(0);

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
      // Create the company
      const company = createCompany(proposedCompany.name, proposedCompany.industry);

      // Build department map for resolving parent relationships
      const deptMap = new Map<string, string>();

      // Create all departments with their single agent
      for (const proposedDept of proposedCompany.departments) {
        // Create single agent for the department
        const agentId = `agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const agent: AgentNode = {
          id: agentId,
          type: 'agentNode',
          position: {
            x: 200,
            y: 200,
          },
          data: {
            id: agentId,
            name: proposedDept.suggestedAgent.name,
            instructions: `You are ${proposedDept.suggestedAgent.name}, ${proposedDept.suggestedAgent.role}. Your responsibilities: ${proposedDept.suggestedAgent.responsibilities}`,
            status: 'idle',
            toolsEnabled: true,
          },
        };

        // Resolve parent ID
        let parentId: string | undefined;
        if (proposedDept.parentName) {
          parentId = deptMap.get(proposedDept.parentName);
        }

        // Create department with single agent
        const dept = addDepartment({
          name: proposedDept.name,
          description: proposedDept.description,
          parentId,
          agent,
        });

        deptMap.set(proposedDept.name, dept.id);

        // Add department section to knowledge base
        await fetch('/api/knowledge/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'add_department',
            departmentName: proposedDept.name,
          }),
        });
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
            goals: ['Establish company structure', 'Build effective departments'],
            problems: [],
          },
        }),
      });

      setProposedCompany(null);
      setCompanyRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Failed to create company:', error);
      alert('Failed to create company. Please try again.');
    }
  };

  const handleRejectCompany = () => {
    setProposedCompany(null);
  };

  const handleDepartmentCreationRequest = async (description: string) => {
    setIsGenerating(true);

    try {
      // Call workflow generation API to get employee structure
      const response = await fetch('/api/generate-workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate department');
      }

      const data = await response.json();

      // Extract department name from description (simple approach)
      const extractDepartmentName = (desc: string): string => {
        const keywords = ['marketing', 'sales', 'hr', 'human resources', 'finance', 'engineering', 'support', 'customer service', 'operations', 'legal', 'product', 'design', 'analytics', 'data'];
        const lowerDesc = desc.toLowerCase();

        for (const keyword of keywords) {
          if (lowerDesc.includes(keyword)) {
            return keyword.charAt(0).toUpperCase() + keyword.slice(1) + ' Department';
          }
        }

        return 'New Department';
      };

      const departmentName = extractDepartmentName(description);

      // Create single agent from AI-generated data
      const agentId = `agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const agent: AgentNode = {
        id: agentId,
        type: 'agentNode',
        position: {
          x: 200,
          y: 200,
        },
        data: {
          id: agentId,
          name: data.agent.name,
          instructions: data.agent.instructions,
          status: 'idle',
          toolsEnabled: true,
        },
      };

      // Add department to company with single agent
      addDepartment({
        name: departmentName,
        description: description,
        agent,
      });

      // Add department section to knowledge base
      await fetch('/api/knowledge/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'add_department',
          departmentName,
        }),
      });

      // Refresh the canvas to show the new department
      setCompanyRefreshKey(prev => prev + 1);

      alert(`${departmentName} created successfully!`);
    } catch (error) {
      console.error('Department creation error:', error);
      alert('Failed to create department. Please try again.');
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

            <h3 className="font-semibold text-[#141413] mb-3">Proposed Departments:</h3>

            <div className="space-y-3 mb-6">
              {proposedCompany.departments.map((dept, idx) => (
                <div key={idx} className="border border-[#828179] rounded-lg p-4 bg-[#F0EFEA]">
                  <div className="flex items-start gap-2 mb-2">
                    <div className="w-2 h-2 bg-[#CC785C] rounded-full mt-2"></div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-[#141413]">{dept.name}</h4>
                      {dept.parentName && (
                        <p className="text-xs text-[#828179]">Subdepartment of {dept.parentName}</p>
                      )}
                      <p className="text-sm text-[#141413] mt-1">{dept.description}</p>

                      <div className="mt-3 space-y-2">
                        <p className="text-xs font-semibold text-[#828179]">AGENT:</p>
                        <div className="text-xs text-[#141413] pl-3 border-l-2 border-[#CC785C]">
                          <span className="font-medium">{dept.suggestedAgent.name}</span> - {dept.suggestedAgent.role}
                          <p className="text-[#828179]">{dept.suggestedAgent.responsibilities}</p>
                        </div>
                      </div>
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
                Approve & Create Company
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
            <p className="text-[#141413] font-medium">Generating your company structure...</p>
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <FlowCanvas key={companyRefreshKey} />
      </div>

      {/* Command Center */}
      <div className={`transition-all ${showChat ? 'h-[600px]' : 'h-0'} border-t border-[#828179]`}>
        {showChat && (
          <CEOChat
            onCompanyCreationRequest={handleCompanyCreationRequest}
            onDepartmentCreationRequest={handleDepartmentCreationRequest}
          />
        )}
      </div>

      {/* Command Center Toggle Button */}
      <button
        onClick={() => setShowChat(!showChat)}
        className="fixed bottom-4 left-4 bg-[#CC785C] text-white px-6 py-3 rounded-full shadow-lg hover:bg-[#b86a4f] transition font-semibold text-sm z-50"
      >
        {showChat ? 'Close Command Center' : 'Open Command Center'}
      </button>

      {/* Knowledge Base Viewer */}
      <KnowledgeViewer />
    </div>
  );
}
