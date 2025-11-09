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

  useEffect(() => {
    if (editingAgent) {
      setName(editingAgent.name);
      setInstructions(editingAgent.instructions);
      setToolsEnabled(editingAgent.toolsEnabled || false);
    } else {
      setName('');
      setInstructions('');
      setToolsEnabled(false);
    }
  }, [editingAgent, isModalOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingAgent) {
      updateAgent(editingAgent.id, { name, instructions, toolsEnabled });
    } else {
      addAgent({ name, instructions, toolsEnabled }, departmentId);
    }

    closeModal();
  };

  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full m-4">
        <h2 className="text-2xl font-bold mb-4 text-[#141413]">
          {editingAgent ? 'Edit Agent' : 'Create New Agent'}
        </h2>

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
                Give this agent access to Slack, web search, email formatting, data processing, and more.
              </p>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              className="flex-1 bg-[#CC785C] text-white px-4 py-2 rounded-md hover:bg-[#b86a4f] transition font-medium"
            >
              {editingAgent ? 'Update Agent' : 'Create Agent'}
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
