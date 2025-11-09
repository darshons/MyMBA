'use client';

import { useEffect, useState } from 'react';

import { useFlowStore } from '@/store/useFlowStore';
import { getDepartment, updateDepartment } from '@/lib/companyStorage';
import { Department } from '@/types/company';
import { AgentNode as AgentNodeType } from '@/types';

export default function DepartmentDetailModal() {
  const { departmentDetailId, closeDepartmentDetail } = useFlowStore();
  const [department, setDepartment] = useState<Department | null>(null);
  const [webhookCopied, setWebhookCopied] = useState(false);

  // Agent edit state
  const [isEditing, setIsEditing] = useState(false);
  const [agentName, setAgentName] = useState('');
  const [agentInstructions, setAgentInstructions] = useState('');
  const [agentToolsEnabled, setAgentToolsEnabled] = useState(true);

  // Load department data when modal opens
  useEffect(() => {
    if (departmentDetailId) {
      const dept = getDepartment(departmentDetailId);
      if (dept) {
        setDepartment(dept);
        if (dept.agent) {
          setAgentName(dept.agent.data.name);
          setAgentInstructions(dept.agent.data.instructions);
          setAgentToolsEnabled(dept.agent.data.toolsEnabled || true);
        }
      }
    } else {
      setDepartment(null);
    }
  }, [departmentDetailId]);

  const handleEditAgent = () => {
    setIsEditing(true);
  };

  const handleSaveAgent = (e: React.FormEvent) => {
    e.preventDefault();

    if (!department || !departmentDetailId) return;

    // Update the agent
    const updatedAgent: AgentNodeType = {
      ...department.agent,
      data: {
        ...department.agent.data,
        name: agentName,
        instructions: agentInstructions,
        toolsEnabled: agentToolsEnabled,
      },
    };

    updateDepartment(departmentDetailId, {
      agent: updatedAgent,
    });

    setDepartment({
      ...department,
      agent: updatedAgent,
    });

    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    if (department?.agent) {
      setAgentName(department.agent.data.name);
      setAgentInstructions(department.agent.data.instructions);
      setAgentToolsEnabled(department.agent.data.toolsEnabled || true);
    }
    setIsEditing(false);
  };

  const handleClose = () => {
    closeDepartmentDetail();
  };

  const handleCopyWebhook = async () => {
    if (!departmentDetailId) return;

    const webhookUrl = `${window.location.origin}/api/webhooks/${departmentDetailId}`;
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setWebhookCopied(true);
      setTimeout(() => setWebhookCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!departmentDetailId || !department) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-[#CC785C] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleClose}
              className="bg-white/20 hover:bg-white/40 text-white px-3 py-2 rounded-lg font-semibold transition flex items-center gap-2 border border-white/30"
              title="Return to company view"
            >
              ← Back
            </button>
            <div>
              <h2 className="text-2xl font-bold">{department.name}</h2>
              <p className="text-white/90 text-sm mt-1">{department.description}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="bg-white text-[#CC785C] px-5 py-2 rounded-lg font-semibold transition hover:bg-[#F0EFEA] shadow-md"
          >
            ✕ Close
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Agent Info */}
          <div className="border border-[#828179] rounded-lg p-5 bg-[#F0EFEA]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#141413]">Department Agent</h3>
              {!isEditing && (
                <button
                  onClick={handleEditAgent}
                  className="bg-[#CC785C] text-white px-4 py-2 rounded-lg hover:bg-[#b86a4f] transition font-medium text-sm"
                >
                  Edit Agent
                </button>
              )}
            </div>

            {!isEditing ? (
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold text-[#828179] mb-1">NAME</p>
                  <p className="text-[#141413] font-medium">{department.agent?.data.name || 'No agent'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#828179] mb-1">INSTRUCTIONS</p>
                  <p className="text-[#141413] text-sm whitespace-pre-wrap">{department.agent?.data.instructions || 'No instructions'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#828179] mb-1">TOOLS</p>
                  <p className="text-[#141413] text-sm">
                    {department.agent?.data.toolsEnabled ? '✓ Enabled' : '✗ Disabled'}
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveAgent} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-[#828179] mb-1 block">NAME</label>
                  <input
                    type="text"
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    className="w-full px-3 py-2 border border-[#828179] rounded-lg focus:ring-2 focus:ring-[#CC785C] focus:border-transparent text-[#141413] text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#828179] mb-1 block">INSTRUCTIONS</label>
                  <textarea
                    value={agentInstructions}
                    onChange={(e) => setAgentInstructions(e.target.value)}
                    rows={8}
                    className="w-full px-3 py-2 border border-[#828179] rounded-lg focus:ring-2 focus:ring-[#CC785C] focus:border-transparent text-[#141413] text-sm"
                    required
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="toolsEnabled"
                    checked={agentToolsEnabled}
                    onChange={(e) => setAgentToolsEnabled(e.target.checked)}
                    className="w-4 h-4 text-[#CC785C] rounded focus:ring-[#CC785C]"
                  />
                  <label htmlFor="toolsEnabled" className="text-sm text-[#141413]">
                    Enable tools (web search, calculator, etc.)
                  </label>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    className="flex-1 bg-[#CC785C] text-white px-4 py-2 rounded-lg hover:bg-[#b86a4f] transition font-medium"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="flex-1 bg-[#F0EFEA] text-[#141413] px-4 py-2 rounded-lg hover:bg-[#e5e4df] transition font-medium border border-[#828179]"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Webhook URL */}
          <div className="border border-[#828179] rounded-lg p-5 bg-white">
            <h3 className="text-sm font-semibold text-[#141413] mb-3">Webhook URL</h3>
            <p className="text-xs text-[#828179] mb-3">
              Use this URL to trigger this department from external systems
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/api/webhooks/${departmentDetailId}`}
                readOnly
                className="flex-1 px-3 py-2 border border-[#828179] rounded-lg bg-[#F0EFEA] text-[#141413] text-sm font-mono"
              />
              <button
                onClick={handleCopyWebhook}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                  webhookCopied
                    ? 'bg-green-500 text-white'
                    : 'bg-[#CC785C] text-white hover:bg-[#b86a4f]'
                }`}
              >
                {webhookCopied ? '✓ Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
