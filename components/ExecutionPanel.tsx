'use client';

import { useState } from 'react';
import { useFlowStore } from '@/store/useFlowStore';

export default function ExecutionPanel() {
  const { nodes, edges, execution, startExecution } = useFlowStore();
  const [input, setInput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);

  const handleExecute = async () => {
    if (!input.trim() || nodes.length === 0) return;

    setIsExecuting(true);
    startExecution(input);

    try {
      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input,
          nodes,
          edges,
        }),
      });

      if (!response.ok) {
        throw new Error('Execution failed');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter((line) => line.trim());

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = JSON.parse(line.slice(6));

              if (data.type === 'result') {
                useFlowStore.getState().addExecutionResult(data.result);
                useFlowStore.getState().updateNodeStatus(data.result.agentId, 'completed');
              } else if (data.type === 'active') {
                useFlowStore.getState().updateNodeStatus(data.agentId, 'active');
              } else if (data.type === 'complete') {
                useFlowStore.getState().completeExecution();
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Execution error:', error);
      alert('Failed to execute workflow. Make sure your Claude API key is configured.');
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="w-full md:w-96 bg-white border-l border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-bold text-gray-900 mb-2">Workflow Execution</h2>
        <p className="text-sm text-gray-600">Test your agent workflow</p>
      </div>

      <div className="p-4 space-y-4">
        <div>
          <label htmlFor="input" className="block text-sm font-medium text-gray-700 mb-2">
            Input Query
          </label>
          <textarea
            id="input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 min-h-[100px]"
            placeholder="e.g., My app keeps crashing on startup..."
            disabled={isExecuting}
          />
        </div>

        <button
          onClick={handleExecute}
          disabled={isExecuting || !input.trim() || nodes.length === 0}
          className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isExecuting ? '⚙️ Running...' : '▶️ Run Workflow'}
        </button>

        {nodes.length === 0 && (
          <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-md">
            Create some agents first to run a workflow!
          </p>
        )}
      </div>

      {execution && execution.results.length > 0 && (
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <h3 className="font-semibold text-gray-900">Results:</h3>
          {execution.results.map((result, idx) => (
            <div key={idx} className="bg-gray-50 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="font-medium text-sm text-gray-900">
                  {result.agentName}
                </span>
              </div>
              <div className="text-sm text-gray-700 whitespace-pre-wrap">
                {result.output}
              </div>
              <div className="text-xs text-gray-500">
                {new Date(result.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))}

          {execution.status === 'completed' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
              ✅ Workflow completed successfully!
            </div>
          )}
        </div>
      )}
    </div>
  );
}
