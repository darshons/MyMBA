'use client';

import { useState, useEffect } from 'react';
import { useToolStore } from '@/store/useToolStore';

export default function ToolModal() {
  const { isModalOpen, closeModal, editingTool, addTool, updateTool } = useToolStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [authType, setAuthType] = useState<'none' | 'bearer' | 'apikey'>('none');
  const [authValue, setAuthValue] = useState('');

  useEffect(() => {
    if (editingTool) {
      setName(editingTool.name);
      setDescription(editingTool.description);
      setEndpoint(editingTool.endpoint);
      setAuthType(editingTool.authType || 'none');
      setAuthValue(editingTool.authValue || '');
    } else {
      setName('');
      setDescription('');
      setEndpoint('');
      setAuthType('none');
      setAuthValue('');
    }
  }, [editingTool, isModalOpen]);

  if (!isModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !endpoint.trim()) {
      alert('Name and endpoint are required');
      return;
    }

    const toolData = {
      name: name.trim(),
      description: description.trim(),
      endpoint: endpoint.trim(),
      authType,
      authValue: authType !== 'none' ? authValue.trim() : undefined,
    };

    if (editingTool) {
      updateTool(editingTool.id, toolData);
    } else {
      addTool(toolData);
    }

    closeModal();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="bg-[#CC785C] text-white px-6 py-4">
          <h2 className="text-2xl font-bold">
            {editingTool ? 'Edit Tool' : 'Add Custom Tool'}
          </h2>
          <p className="text-white/90 text-sm mt-1">
            Configure a custom webhook tool for your agents to use
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Tool Name */}
          <div>
            <label className="block text-sm font-semibold text-[#141413] mb-2">
              Tool Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Web Search, Database Query, Send Email"
              className="w-full px-3 py-2 border border-[#828179] rounded-lg focus:ring-2 focus:ring-[#CC785C] focus:border-transparent text-[#141413]"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-[#141413] mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this tool do? How should agents use it?"
              className="w-full px-3 py-2 border border-[#828179] rounded-lg focus:ring-2 focus:ring-[#CC785C] focus:border-transparent text-[#141413] h-20 resize-none"
            />
          </div>

          {/* Endpoint URL */}
          <div>
            <label className="block text-sm font-semibold text-[#141413] mb-2">
              Endpoint URL *
            </label>
            <input
              type="url"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              placeholder="https://api.example.com/tool"
              className="w-full px-3 py-2 border border-[#828179] rounded-lg focus:ring-2 focus:ring-[#CC785C] focus:border-transparent text-[#141413] font-mono text-sm"
              required
            />
          </div>

          {/* Authentication */}
          <div>
            <label className="block text-sm font-semibold text-[#141413] mb-2">
              Authentication
            </label>
            <select
              value={authType}
              onChange={(e) => setAuthType(e.target.value as 'none' | 'bearer' | 'apikey')}
              className="w-full px-3 py-2 border border-[#828179] rounded-lg focus:ring-2 focus:ring-[#CC785C] focus:border-transparent text-[#141413] mb-2"
            >
              <option value="none">None</option>
              <option value="bearer">Bearer Token</option>
              <option value="apikey">API Key</option>
            </select>

            {authType !== 'none' && (
              <input
                type="password"
                value={authValue}
                onChange={(e) => setAuthValue(e.target.value)}
                placeholder={authType === 'bearer' ? 'Bearer token' : 'API key'}
                className="w-full px-3 py-2 border border-[#828179] rounded-lg focus:ring-2 focus:ring-[#CC785C] focus:border-transparent text-[#141413] font-mono text-sm"
              />
            )}
          </div>

          {/* Info Box */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <p className="text-xs text-indigo-900">
              <strong>Note:</strong> This tool will be available to all agents when they have "Tools Enabled".
              The endpoint should accept POST requests with JSON data and return JSON responses.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 bg-[#CC785C] text-white px-4 py-3 rounded-lg hover:bg-[#b86a4f] transition font-semibold"
            >
              {editingTool ? 'Update Tool' : 'Add Tool'}
            </button>
            <button
              type="button"
              onClick={closeModal}
              className="flex-1 bg-[#F0EFEA] text-[#141413] px-4 py-3 rounded-lg hover:bg-[#e5e4df] transition font-semibold border border-[#828179]"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
