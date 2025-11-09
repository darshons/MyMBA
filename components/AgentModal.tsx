'use client';

import { useState, useEffect } from 'react';
import { useFlowStore } from '@/store/useFlowStore';

interface AgentModalProps {
  departmentId?: string;
}

export default function AgentModal({ departmentId }: AgentModalProps = {}) {
  const { isModalOpen, closeModal, addAgent, updateAgent, editingAgent } = useFlowStore();

  const [name, setName] = useState('');
  const [instructions, setInstructions] = useState('');
  const [toolsEnabled, setToolsEnabled] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [webhookCopied, setWebhookCopied] = useState(false);

  useEffect(() => {
    if (editingAgent) {
      setName(editingAgent.name);
      setInstructions(editingAgent.instructions);
      setToolsEnabled(editingAgent.toolsEnabled || false);
      setIsEditing(false); // Start in view mode when editing existing agent
    } else {
      setName('');
      setInstructions('');
      setToolsEnabled(false);
      setIsEditing(true); // Start in edit mode when creating new agent
    }
  }, [editingAgent, isModalOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingAgent) {
      updateAgent(editingAgent.id, { name, instructions, toolsEnabled });
      setIsEditing(false);
    } else {
      addAgent({ name, instructions, toolsEnabled }, departmentId);
      closeModal();
    }
  };

  const handleCancelEdit = () => {
    if (editingAgent) {
      setName(editingAgent.name);
      setInstructions(editingAgent.instructions);
      setToolsEnabled(editingAgent.toolsEnabled || false);
    }
    setIsEditing(false);
  };

  const handleCopyWebhook = async () => {
    if (!editingAgent?.id) return;

    const webhookUrl = `${window.location.origin}/api/webhooks/agent/${editingAgent.id}`;
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setWebhookCopied(true);
      setTimeout(() => setWebhookCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!isModalOpen) return null;

  // For creating new agent, show simple form
  if (!editingAgent) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
          <h2 className="text-2xl font-bold mb-4 text-[#141413]">Create New Agent</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-[#828179] mb-1">
                Agent Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-[#828179] rounded-md focus:ring-2 focus:ring-[#CC785C] focus:border-transparent text-[#141413]"
                placeholder="e.g., Customer Support Agent"
                required
              />
            </div>

            <div>
              <label htmlFor="instructions" className="block text-sm font-medium text-[#828179] mb-1">
                Agent Instructions
              </label>
              <textarea
                id="instructions"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                className="w-full px-3 py-2 border border-[#828179] rounded-md focus:ring-2 focus:ring-[#CC785C] focus:border-transparent text-[#141413] min-h-[100px]"
                placeholder="Describe what this agent should do..."
                required
              />
              <p className="text-xs text-[#828179] mt-1">
                These instructions will be used as the system prompt for this agent.
              </p>
            </div>

            <div className="flex items-start gap-3 p-4 bg-[#F0EFEA] rounded-lg border border-[#828179]">
              <input
                id="tools"
                type="checkbox"
                checked={toolsEnabled}
                onChange={(e) => setToolsEnabled(e.target.checked)}
                className="mt-1 w-4 h-4 text-[#CC785C] border-[#828179] rounded focus:ring-2 focus:ring-[#CC785C]"
              />
              <div className="flex-1">
                <label htmlFor="tools" className="block text-sm font-medium text-[#141413] cursor-pointer">
                  Enable Business Tools
                </label>
                <p className="text-xs text-[#828179] mt-1">
                  Give this agent access to web search, email formatting, data processing, and more.
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 bg-[#CC785C] text-white px-4 py-2 rounded-md hover:bg-[#b86a4f] transition font-medium"
              >
                Create Agent
              </button>
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 bg-[#F0EFEA] text-[#141413] px-4 py-2 rounded-md hover:bg-[#e5e4df] transition font-medium border border-[#828179]"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // For editing existing agent, show department-style modal
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-[#CC785C] text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{name}</h2>
          </div>
          <button
            onClick={closeModal}
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
              <h3 className="text-lg font-semibold text-[#141413]">Agent Configuration</h3>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
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
                  <p className="text-[#141413] font-medium">{name}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#828179] mb-1">INSTRUCTIONS</p>
                  <p className="text-[#141413] text-sm whitespace-pre-wrap">{instructions}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#828179] mb-1">TOOLS</p>
                  <p className="text-[#141413] text-sm">
                    {toolsEnabled ? '✓ Enabled (web search, email, data processing)' : '✗ Disabled'}
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-[#828179] mb-1 block">NAME</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-[#828179] rounded-lg focus:ring-2 focus:ring-[#CC785C] focus:border-transparent text-[#141413] text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#828179] mb-1 block">INSTRUCTIONS</label>
                  <textarea
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    rows={8}
                    className="w-full px-3 py-2 border border-[#828179] rounded-lg focus:ring-2 focus:ring-[#CC785C] focus:border-transparent text-[#141413] text-sm"
                    required
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="toolsEnabled"
                    checked={toolsEnabled}
                    onChange={(e) => setToolsEnabled(e.target.checked)}
                    className="w-4 h-4 text-[#CC785C] rounded focus:ring-[#CC785C]"
                  />
                  <label htmlFor="toolsEnabled" className="text-sm text-[#141413]">
                    Enable tools (web search, email formatting, data processing)
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
              Use this URL to trigger this agent from external systems
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/api/webhooks/agent/${editingAgent.id}`}
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
