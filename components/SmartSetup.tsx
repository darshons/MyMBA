'use client';

import { useState } from 'react';
import { useFlowStore } from '@/store/useFlowStore';

function extractDepartmentName(description: string): string {
  // Simple extraction: look for patterns like "marketing department", "customer support", etc.
  const lowerDesc = description.toLowerCase();

  if (lowerDesc.includes('marketing')) return 'Marketing Department';
  if (lowerDesc.includes('customer support') || lowerDesc.includes('support')) return 'Customer Support Department';
  if (lowerDesc.includes('sales')) return 'Sales Department';
  if (lowerDesc.includes('content') || lowerDesc.includes('writing')) return 'Content Creation Department';
  if (lowerDesc.includes('research')) return 'Research Department';
  if (lowerDesc.includes('hr') || lowerDesc.includes('human resource')) return 'HR Department';

  // Default: capitalize first word + "Department"
  const words = description.trim().split(' ');
  const firstWord = words[0].charAt(0).toUpperCase() + words[0].slice(1).toLowerCase();
  return `${firstWord} Department`;
}

export default function SmartSetup() {
  const [description, setDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const { generateWorkflowFromAI, setWorkflowName } = useFlowStore();

  const handleGenerate = async () => {
    if (!description.trim()) return;

    setIsGenerating(true);
    setError('');

    try {
      const response = await fetch('/api/generate-workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate workflow');
      }

      const data = await response.json();

      if (data.agents && data.connections) {
        // Extract department name from description
        const departmentName = extractDepartmentName(description);
        setWorkflowName(departmentName);

        generateWorkflowFromAI(data.agents, data.connections);
        setDescription('');
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Generation error:', err);
      setError('Failed to generate workflow. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white/95 backdrop-blur rounded-xl shadow-2xl p-5 space-y-3 border border-gray-200 max-w-md">
      <div className="border-b border-gray-200 pb-3">
        <h2 className="text-lg font-semibold text-gray-900">Create Department</h2>
        <p className="text-xs text-gray-600 mt-1">Describe your department in plain English</p>
      </div>

      <div className="space-y-3">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g., I want to create a marketing department that gets data from reddit..."
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900 min-h-[100px] resize-none text-sm"
          disabled={isGenerating}
        />

        <button
          onClick={handleGenerate}
          disabled={isGenerating || !description.trim()}
          className="w-full bg-gray-900 text-white px-4 py-2.5 rounded-lg hover:bg-gray-800 transition-all font-medium disabled:bg-gray-300 disabled:cursor-not-allowed shadow-sm text-sm"
        >
          {isGenerating ? 'Creating...' : 'Create Department'}
        </button>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
            {error}
          </p>
        )}

        <div className="pt-2 border-t border-gray-200">
          <p className="text-xs font-medium text-gray-500 mb-2">EXAMPLES</p>
          <div className="space-y-1.5">
            <button
              onClick={() => setDescription('I want to create a marketing department that gets data from reddit')}
              className="w-full text-left text-xs text-gray-700 hover:text-gray-900 hover:bg-gray-50 p-2 rounded transition"
              disabled={isGenerating}
            >
              Marketing data from Reddit
            </button>
            <button
              onClick={() => setDescription('Create a customer support system that triages tickets and provides solutions')}
              className="w-full text-left text-xs text-gray-700 hover:text-gray-900 hover:bg-gray-50 p-2 rounded transition"
              disabled={isGenerating}
            >
              Customer support triage system
            </button>
            <button
              onClick={() => setDescription('Build a content creation workflow that researches topics, writes articles, and edits them')}
              className="w-full text-left text-xs text-gray-700 hover:text-gray-900 hover:bg-gray-50 p-2 rounded transition"
              disabled={isGenerating}
            >
              Content creation pipeline
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
