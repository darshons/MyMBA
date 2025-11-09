'use client';

import { useState, useEffect } from 'react';
import { useFlowStore } from '@/store/useFlowStore';

export default function KnowledgeViewer() {
  const [knowledge, setKnowledge] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadKnowledge = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/knowledge/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        const data = await response.json();
        setKnowledge(data.content);
      }
    } catch (error) {
      console.error('Failed to load knowledge:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadKnowledge();
    }
  }, [isOpen]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 left-4 bg-[#6B8E23] text-white px-6 py-3 rounded-full shadow-lg hover:bg-[#5a7a1e] transition font-semibold text-sm z-50"
      >
        Company Knowledge
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#6B8E23] text-white px-6 py-4 rounded-t-xl flex items-center justify-between">
          <h2 className="text-2xl font-bold">Company Knowledge Base</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="bg-white text-[#6B8E23] px-4 py-2 rounded-lg font-semibold hover:bg-[#F0EFEA] transition"
          >
            ✕ Close
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-12 h-12 border-4 border-[#6B8E23] border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800 leading-relaxed">
                {knowledge || 'No knowledge base found. Create a company to get started!'}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 rounded-b-xl">
          <div className="flex items-center justify-between text-sm">
            <p className="text-gray-600">
              This knowledge base auto-updates as you chat with CEO and as agents learn
            </p>
            <button
              onClick={loadKnowledge}
              disabled={loading}
              className="bg-[#6B8E23] text-white px-4 py-2 rounded-lg hover:bg-[#5a7a1e] transition font-medium disabled:opacity-50"
            >
              🔄 Refresh
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
