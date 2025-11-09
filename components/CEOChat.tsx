'use client';

import { useState, useEffect } from 'react';
import { getAllExecutions } from '@/lib/storage';
import { getCurrentCompany, getDepartment } from '@/lib/companyStorage';
import { useFlowStore } from '@/store/useFlowStore';
import { getPendingActions, approveAction, rejectAction } from '@/lib/knowledgeStorage';
import { ProposedAction } from '@/types/knowledge';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  executionResults?: ExecutionResult[];
  departmentName?: string;
  proposedTasks?: ProposedAction[];
}

interface ExecutionResult {
  agentName: string;
  output: string;
  timestamp: number;
}

interface CEOChatProps {
  onCompanyCreationRequest?: (industry: string, description: string) => void;
  onDepartmentCreationRequest?: (description: string) => void;
}

export default function CEOChat({ onCompanyCreationRequest, onDepartmentCreationRequest }: CEOChatProps) {
  const { openModal } = useFlowStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Welcome to Command Center! I can help you:\n\n• Create automated workflows by describing your needs\n• Generate AI-powered departments for your business\n• Check on workflow execution and results\n• Manage your automation infrastructure\n\nHow can I automate your business today?',
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingTasks, setIsGeneratingTasks] = useState(false);
  const [pendingTasks, setPendingTasks] = useState<ProposedAction[]>([]);

  // Load pending tasks on mount
  useEffect(() => {
    setPendingTasks(getPendingActions());
  }, []);

  const executeTask = async (task: string) => {
    try {
      const company = getCurrentCompany();
      if (!company) return;

      // Show routing message
      const routingMessage: Message = {
        role: 'system',
        content: '📍 Analyzing task and routing to appropriate department...',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, routingMessage]);

      // Route task to department
      const routeResponse = await fetch('/api/route-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task, company }),
      });

      if (!routeResponse.ok) {
        throw new Error('Failed to route task');
      }

      const routeResult = await routeResponse.json();

      if (!routeResult.departmentId) {
        const errorMsg: Message = {
          role: 'system',
          content: '⚠️ No suitable department found for this task. Please create a relevant department first.',
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, errorMsg]);
        return;
      }

      // Update routing message
      setMessages(prev => prev.map(msg =>
        msg === routingMessage
          ? { ...msg, content: `📍 Routed to ${routeResult.departmentName} department` }
          : msg
      ));

      // Get department agent
      const department = getDepartment(routeResult.departmentId);
      if (!department || !department.agent) {
        const errorMsg: Message = {
          role: 'system',
          content: `⚠️ ${routeResult.departmentName} department has no agent. Please add an agent first.`,
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, errorMsg]);
        return;
      }

      // Show execution started message
      const execMessage: Message = {
        role: 'system',
        content: `⚙️ ${routeResult.departmentName} is working on this task...`,
        timestamp: Date.now(),
        departmentName: routeResult.departmentName,
        executionResults: [],
      };
      setMessages(prev => [...prev, execMessage]);

      // Execute the workflow with single agent
      const executeResponse = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: task,
          agent: department.agent,
          workflowName: routeResult.departmentName,
          pastExecutions: [],
        }),
      });

      const reader = executeResponse.body?.getReader();
      const decoder = new TextDecoder();
      const results: ExecutionResult[] = [];

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(line => line.trim());

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const eventData = JSON.parse(line.slice(6));

              if (eventData.type === 'result') {
                results.push({
                  agentName: eventData.result.agentName,
                  output: eventData.result.output,
                  timestamp: eventData.result.timestamp,
                });

                // Update execution message with results
                setMessages(prev => prev.map(msg =>
                  msg === execMessage
                    ? { ...msg, executionResults: [...results] }
                    : msg
                ));
              } else if (eventData.type === 'complete') {
                // Update to completed status
                setMessages(prev => prev.map(msg =>
                  msg === execMessage
                    ? { ...msg, content: `✅ ${routeResult.departmentName} completed the task!` }
                    : msg
                ));

                // Update company.md with the results
                if (results.length > 0) {
                  const lastResult = results[results.length - 1];
                  await fetch('/api/knowledge/update', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      type: 'add_learning',
                      departmentName: routeResult.departmentName,
                      data: `[${new Date().toLocaleDateString()}] ${task.substring(0, 50)}${task.length > 50 ? '...' : ''}: ${lastResult.output.substring(0, 100)}${lastResult.output.length > 100 ? '...' : ''}`,
                    }),
                  }).catch(err => console.error('Failed to update knowledge base:', err));
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Task execution error:', error);
      const errorMessage: Message = {
        role: 'system',
        content: '❌ Failed to execute task. Please try again.',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const company = getCurrentCompany();

      const response = await fetch('/api/ceo-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: input,
          executions: getAllExecutions(),
          company,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      // Handle company creation request
      if (data.type === 'company_creation') {
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.response,
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, assistantMessage]);

        // Trigger company generation
        if (onCompanyCreationRequest) {
          onCompanyCreationRequest(data.industry, data.description);
        }
      } else if (data.type === 'department_creation') {
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.response,
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, assistantMessage]);

        // Trigger department generation
        if (onDepartmentCreationRequest) {
          onDepartmentCreationRequest(data.description);
        }
      } else if (data.type === 'task_execution_smart') {
        // AI-parsed tasks with intelligent routing
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.response,
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, assistantMessage]);

        // Execute each parsed task to its designated department
        for (let i = 0; i < data.parsedTasks.length; i++) {
          const parsedTask = data.parsedTasks[i];

          const taskMessage: Message = {
            role: 'system',
            content: `📍 Task ${i + 1}/${data.parsedTasks.length}: Routing to ${parsedTask.department}\n"${parsedTask.task}"`,
            timestamp: Date.now(),
          };
          setMessages(prev => [...prev, taskMessage]);

          // Execute only the parsed task (not full message)
          await executeTask(parsedTask.task);

          // Small delay between tasks
          if (i < data.parsedTasks.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }

        const completeMessage: Message = {
          role: 'system',
          content: `✅ All ${data.parsedTasks.length} tasks completed!`,
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, completeMessage]);
      } else if (data.type === 'task_execution') {
        // Single task execution
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.response,
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, assistantMessage]);

        // Execute the task
        await executeTask(data.task);
      } else if (data.type === 'task_execution_multiple') {
        // Multiple tasks execution
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.response,
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, assistantMessage]);

        // Execute each task sequentially
        for (let i = 0; i < data.tasks.length; i++) {
          const taskMessage: Message = {
            role: 'system',
            content: `📋 Task ${i + 1}/${data.tasks.length}: ${data.tasks[i]}`,
            timestamp: Date.now(),
          };
          setMessages(prev => [...prev, taskMessage]);

          await executeTask(data.tasks[i]);

          // Small delay between tasks
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        const completeMessage: Message = {
          role: 'system',
          content: `✅ All ${data.tasks.length} tasks completed!`,
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, completeMessage]);
      } else {
        // Normal response
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.response,
          timestamp: Date.now(),
        };

        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('CEO chat error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleGenerateTasks = async () => {
    setIsGeneratingTasks(true);

    const generatingMessage: Message = {
      role: 'system',
      content: '🤖 Analyzing company document and generating tasks for all departments...',
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, generatingMessage]);

    try {
      const company = getCurrentCompany();

      if (!company) {
        throw new Error('No company found');
      }

      const response = await fetch('/api/generate-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate tasks');
      }

      const data = await response.json();

      // Save proposed actions to localStorage
      const { getProposedActions, saveProposedActions } = await import('@/lib/knowledgeStorage');
      const currentActions = getProposedActions();
      const newActions = [...data.proposedActions, ...currentActions];
      saveProposedActions(newActions);

      // Update pending tasks
      setPendingTasks(getPendingActions());

      const tasksMessage: Message = {
        role: 'system',
        content: `✅ Generated ${data.count} task${data.count !== 1 ? 's' : ''} from ${data.proposedActions.length} department${data.proposedActions.length !== 1 ? 's' : ''}`,
        timestamp: Date.now(),
        proposedTasks: data.proposedActions,
      };
      setMessages(prev => [...prev, tasksMessage]);
    } catch (error) {
      console.error('Error generating tasks:', error);
      const errorMessage: Message = {
        role: 'system',
        content: '❌ Failed to generate tasks. Please try again.',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsGeneratingTasks(false);
    }
  };

  const handleApproveTask = async (task: ProposedAction) => {
    // Approve the task
    approveAction(task.id);
    setPendingTasks(getPendingActions());

    // Show approval message
    const approvalMessage: Message = {
      role: 'system',
      content: `✅ Approved task from ${task.departmentName}`,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, approvalMessage]);

    // Execute the task
    await executeTask(task.action);
  };

  const handleRejectTask = (task: ProposedAction) => {
    // Reject the task
    rejectAction(task.id);
    setPendingTasks(getPendingActions());

    const rejectMessage: Message = {
      role: 'system',
      content: `❌ Rejected task from ${task.departmentName}`,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, rejectMessage]);
  };

  return (
    <div className="flex h-full bg-[#F0EFEA]">
      {/* Left Sidebar - AgentFlow Branding & Controls */}
      <div className="w-80 bg-white border-r border-[#828179] p-5 space-y-4 overflow-y-auto">
        {/* Branding */}
        <div className="border-b border-[#828179] pb-4">
          <h1 className="text-2xl font-semibold text-[#141413]">AgentFlow</h1>
          <p className="text-sm text-[#828179] mt-1">Business Automation. No Code Required.</p>
        </div>

        {/* Quick Actions */}
        <div className="space-y-2">
          <button
            onClick={() => openModal()}
            className="w-full bg-[#CC785C] text-white px-4 py-2.5 rounded-lg hover:bg-[#b86a4f] transition-all font-medium text-sm shadow-sm"
          >
            + Add Agent
          </button>
          <button
            onClick={handleGenerateTasks}
            disabled={isGeneratingTasks}
            className="w-full bg-indigo-600 text-white px-4 py-2.5 rounded-lg hover:bg-indigo-700 transition-all font-medium text-sm shadow-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isGeneratingTasks ? '⏳ Generating...' : '🤖 Generate Tasks'}
          </button>
        </div>

        {/* Pending Tasks Counter */}
        {pendingTasks.length > 0 && (
          <div className="pt-2 border-t border-[#828179]">
            <div className="bg-amber-50 border border-amber-300 rounded-lg p-3">
              <p className="text-xs font-semibold text-amber-800">
                📋 {pendingTasks.length} Pending Task{pendingTasks.length !== 1 ? 's' : ''}
              </p>
              <p className="text-xs text-amber-700 mt-1">
                Review and approve tasks in the chat
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Right Side - Command Center Chat */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Header */}
        <div className="p-4 border-b border-[#828179] bg-[#F0EFEA]">
          <h3 className="font-semibold text-[#141413]">Command Center</h3>
          <p className="text-xs text-[#828179] mt-0.5">Manage workflows and automation</p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] px-4 py-2.5 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-[#CC785C] text-white'
                    : msg.role === 'system'
                    ? 'bg-indigo-50 text-indigo-900 border border-indigo-200'
                    : 'bg-[#F0EFEA] text-[#141413] border border-[#828179]'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>

                {/* Show execution results if present */}
                {msg.executionResults && msg.executionResults.length > 0 && (
                  <div className="mt-3 space-y-2 border-t border-indigo-200 pt-3">
                    <p className="text-xs font-semibold text-indigo-700">RESULTS:</p>
                    {msg.executionResults.map((result, resultIdx) => (
                      <div key={resultIdx} className="bg-white border border-indigo-100 rounded p-2">
                        <p className="text-xs font-semibold text-indigo-900">{result.agentName}</p>
                        <p className="text-xs text-gray-700 mt-1">{result.output}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Show proposed tasks if present */}
                {msg.proposedTasks && msg.proposedTasks.length > 0 && (
                  <div className="mt-3 space-y-2 border-t border-indigo-200 pt-3">
                    <p className="text-xs font-semibold text-indigo-700">PROPOSED TASKS:</p>
                    {msg.proposedTasks.filter(task => {
                      // Only show tasks that are still pending
                      const currentTask = pendingTasks.find(t => t.id === task.id);
                      return currentTask && currentTask.status === 'pending';
                    }).map((task) => (
                      <div key={task.id} className="bg-white border-2 border-indigo-300 rounded-lg p-3">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <p className="text-xs font-semibold text-indigo-900">{task.departmentName}</p>
                            <p className="text-xs text-gray-500">{task.agentName}</p>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleApproveTask(task)}
                              className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 transition font-medium"
                            >
                              ✓ Approve
                            </button>
                            <button
                              onClick={() => handleRejectTask(task)}
                              className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition font-medium"
                            >
                              ✗ Reject
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-gray-800 font-medium mb-1">{task.action}</p>
                        <p className="text-xs text-gray-600 italic">{task.reasoning}</p>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-xs opacity-60 mt-1">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-[#F0EFEA] text-[#141413] border border-[#828179] px-4 py-2.5 rounded-lg">
                <p className="text-sm">Thinking...</p>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-[#828179]">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about your departments..."
              className="flex-1 px-3 py-2 border border-[#828179] rounded-lg focus:ring-2 focus:ring-[#CC785C] focus:border-transparent text-[#141413] text-sm"
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="px-4 py-2 bg-[#CC785C] text-white rounded-lg hover:bg-[#b86a4f] transition font-medium disabled:bg-[#828179] disabled:cursor-not-allowed text-sm"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
