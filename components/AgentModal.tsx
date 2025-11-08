import { useState, useEffect } from 'react';
import { useFlowStore } from '@/store/useFlowStore';
import { AgentType } from '@/types';

export default function AgentModal() {
  const { isModalOpen, closeModal, addAgent, updateAgent, editingAgent } = useFlowStore();

  const [name, setName] = useState('');
  const [type, setType] = useState<AgentType>('intake');
  const [instructions, setInstructions] = useState('');

  useEffect(() => {
    if (editingAgent) {
      setName(editingAgent.name);
      setType(editingAgent.type);
      setInstructions(editingAgent.instructions);
    } else {
      setName('');
      setType('intake');
      setInstructions('');
    }
  }, [editingAgent, isModalOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingAgent) {
      updateAgent(editingAgent.id, { name, type, instructions });
    } else {
      addAgent({ name, type, instructions });
    }

    closeModal();
  };

  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full m-4">
        <h2 className="text-2xl font-bold mb-4 text-gray-900">
          {editingAgent ? 'Edit Agent' : 'Create New Agent'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Agent Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              placeholder="e.g., Customer Intake Agent"
              required
            />
          </div>

          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
              Agent Type
            </label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value as AgentType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            >
              <option value="intake">Intake - Receives initial requests</option>
              <option value="processing">Processing - Performs main task</option>
              <option value="response">Response - Delivers output</option>
            </select>
          </div>

          <div>
            <label htmlFor="instructions" className="block text-sm font-medium text-gray-700 mb-1">
              Agent Instructions
            </label>
            <textarea
              id="instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 min-h-[100px]"
              placeholder="Describe what this agent should do..."
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              These instructions will be used as the system prompt for this agent.
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition font-medium"
            >
              {editingAgent ? 'Update Agent' : 'Create Agent'}
            </button>
            <button
              type="button"
              onClick={closeModal}
              className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
