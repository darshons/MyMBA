'use client';

import { useState } from 'react';
import { useFlowStore } from '@/store/useFlowStore';
import { getAllExecutions, SavedExecution } from '@/lib/storage';
import { getCurrentCompany, getDepartment } from '@/lib/companyStorage';
import FeedbackModal from './FeedbackModal';

export default function ExecutionPanel() {
  const { nodes, edges, execution, startExecution, currentWorkflowName, updateDepartmentNodeStatus } = useFlowStore();
  const [input, setInput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [currentExecution, setCurrentExecution] = useState<SavedExecution | null>(null);
  const [routingInfo, setRoutingInfo] = useState<string>('');
  const [exportCopied, setExportCopied] = useState(false);

  console.log('ExecutionPanel render - execution:', execution);

  const handleCopyResults = async () => {
    if (!execution || !execution.results) return;

    const resultsText = execution.results
      .map((r) => `[${r.agentName}]\n${r.output}\n`)
      .join('\n---\n\n');

    try {
      await navigator.clipboard.writeText(resultsText);
      setExportCopied(true);
      setTimeout(() => setExportCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownloadJSON = () => {
    if (!execution) return;

    const data = {
      input: execution.input,
      workflowName: currentWorkflowName,
      results: execution.results,
      completedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workflow-results-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadCSV = () => {
    if (!execution || !execution.results) return;

    const headers = ['Agent', 'Output', 'Timestamp'];
    const rows = execution.results.map((r) => [
      r.agentName,
      r.output.replace(/"/g, '""'), // Escape quotes
      new Date(r.timestamp).toISOString(),
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workflow-results-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExecute = async () => {
    if (!input.trim() || nodes.length === 0) return;

    console.log('Starting execution with input:', input);
    setIsExecuting(true);
    setRoutingInfo('');
    startExecution(input);

    try {
      // Check if we're in company view (departments) or department view (employees)
      const company = getCurrentCompany();
      const isCompanyView = nodes.length > 0 && nodes[0]?.type === 'departmentNode';

      let executionNodes = nodes;
      let executionEdges = edges;
      let departmentId: string | null = null;

      // If in company view, route to appropriate department first
      if (isCompanyView && company) {
        console.log('Company view detected, routing task to department...');
        setRoutingInfo('Analyzing task and routing to appropriate department...');

        const routeResponse = await fetch('/api/route-task', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            task: input,
            company,
          }),
        });

        if (!routeResponse.ok) {
          throw new Error('Failed to route task');
        }

        const routeResult = await routeResponse.json();
        console.log('Routing result:', routeResult);

        if (!routeResult.departmentId) {
          alert('No suitable department found for this task. Please create a relevant department first.');
          setIsExecuting(false);
          return;
        }

        departmentId = routeResult.departmentId;
        setRoutingInfo(`Routed to ${routeResult.departmentName} department`);

        // Update department node status to active
        if (departmentId) {
          updateDepartmentNodeStatus(departmentId, 'active');
        }

        // Load the department's agent for execution
        const department = departmentId ? getDepartment(departmentId) : null;
        if (!department || !department.agent) {
          alert(`${routeResult.departmentName} department has no agent. Please add an agent first.`);
          if (departmentId) {
            updateDepartmentNodeStatus(departmentId, 'idle');
          }
          setIsExecuting(false);
          return;
        }

        // For single agent execution, we don't need nodes/edges arrays
        executionNodes = [department.agent];
        executionEdges = [];
        console.log('Executing with department agent:', department.agent.data.name);
      }

      console.log('Calling API with', executionNodes.length, 'nodes');

      // Get past executions for this workflow to provide feedback context
      const pastExecutions = getAllExecutions().filter(
        (exec) => exec.workflowName === currentWorkflowName
      );

      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input,
          agent: executionNodes[0], // Single agent
          workflowName: currentWorkflowName,
          pastExecutions,
        }),
      });

      console.log('API response status:', response.status);
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
              console.log('Received data:', data);

              if (data.type === 'result') {
                console.log('Adding result:', data.result);
                useFlowStore.getState().addExecutionResult(data.result);
                useFlowStore.getState().updateNodeStatus(data.result.agentId, 'completed');
              } else if (data.type === 'active') {
                console.log('Agent active:', data.agentId);
                useFlowStore.getState().updateNodeStatus(data.agentId, 'active');
              } else if (data.type === 'complete') {
                console.log('Workflow complete');
                useFlowStore.getState().completeExecution();
                // Mark department as completed if we routed to one
                if (departmentId) {
                  updateDepartmentNodeStatus(departmentId, 'completed');
                }
              } else if (data.type === 'error') {
                console.error('Agent error:', data.error);
                alert(`Error in agent ${data.agentId}: ${data.error}`);
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

  const handleReview = () => {
    if (execution) {
      // Get the latest execution from storage
      const executions = getAllExecutions();
      const latest = executions[0]; // Most recent
      setCurrentExecution(latest);
      setShowFeedback(true);
    }
  };

  return (
    <>
      {showFeedback && (
        <FeedbackModal
          execution={currentExecution}
          onClose={() => {
            setShowFeedback(false);
            setCurrentExecution(null);
          }}
        />
      )}
    <div className="w-full md:w-96 bg-white border-l border-gray-300 flex flex-col h-full">
      <div className="p-5 border-b border-gray-200 bg-gray-50">
        <h2 className="text-xl font-semibold text-gray-900 mb-1">Run Workflow</h2>
        <p className="text-sm text-gray-600">Execute automated business processes</p>
      </div>

      <div className="p-5 space-y-4">
        <div>
          <label htmlFor="input" className="block text-sm font-semibold text-gray-700 mb-2">
            INPUT QUERY
          </label>
          <textarea
            id="input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900 min-h-[100px] resize-none"
            placeholder="e.g., My app keeps crashing on startup..."
            disabled={isExecuting}
          />
        </div>

        <button
          onClick={handleExecute}
          disabled={isExecuting || !input.trim() || nodes.length === 0}
          className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg hover:bg-gray-800 transition-all font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed shadow-sm"
        >
          {isExecuting ? 'Working...' : 'Assign Task'}
        </button>

        {nodes.length === 0 && (
          <p className="text-sm text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200">
            Create a department first to assign work!
          </p>
        )}

        {routingInfo && (
          <div className="text-sm text-indigo-700 bg-indigo-50 p-3 rounded-lg border border-indigo-200 font-medium">
            📍 {routingInfo}
          </div>
        )}
      </div>

      {execution && execution.results.length > 0 && (
        <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-gray-50">
          <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">Results ({execution.results.length})</h3>
          {execution.results.map((result, idx) => (
            <div key={idx} className="bg-white rounded-lg p-4 space-y-2 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-900 rounded-full"></div>
                <span className="font-semibold text-sm text-gray-900">
                  {result.agentName}
                </span>
              </div>
              <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {result.output}
              </div>
              <div className="text-xs text-gray-500 font-medium">
                {new Date(result.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))}

          {execution.status === 'completed' && (
            <>
              <div className="bg-gray-900 text-white rounded-lg p-3 text-sm font-medium text-center">
                Workflow completed successfully
              </div>
              <button
                onClick={handleReview}
                className="w-full bg-white border-2 border-gray-900 text-gray-900 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition font-semibold text-sm"
              >
                Review This Work
              </button>

              <div className="pt-3 border-t border-gray-200">
                <p className="text-xs font-medium text-gray-500 mb-2">EXPORT RESULTS</p>
                <div className="space-y-2">
                  <button
                    onClick={handleCopyResults}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-2 rounded-lg transition-all font-medium text-xs border border-gray-300"
                  >
                    {exportCopied ? '✓ Copied to Clipboard!' : '📋 Copy to Clipboard'}
                  </button>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleDownloadJSON}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-2 rounded-lg transition-all font-medium text-xs border border-gray-300"
                    >
                      ⬇ JSON
                    </button>
                    <button
                      onClick={handleDownloadCSV}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-2 rounded-lg transition-all font-medium text-xs border border-gray-300"
                    >
                      ⬇ CSV
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
    </>
  );
}
