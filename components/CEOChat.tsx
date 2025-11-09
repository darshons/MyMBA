'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { getAllExecutions } from '@/lib/storage';
import { useFlowStore } from '@/store/useFlowStore';
import { useToolStore } from '@/store/useToolStore';
import { getPendingActions, approveAction, rejectAction } from '@/lib/knowledgeStorage';
import { ProposedAction } from '@/types/knowledge';
import ToolModal from './ToolModal';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getStoredCustomTools } from '@/lib/customToolStorage';

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
  onAgentCreationRequest?: (description: string) => void;
}

export default function CEOChat({ onCompanyCreationRequest, onAgentCreationRequest }: CEOChatProps) {
  const { nodes, openModal, addStickyNote } = useFlowStore();
  const { tools, loadTools, openModal: openToolModal, deleteTool } = useToolStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Welcome to Command Center! I can help you:\n\n• Create automated workflows by describing your needs\n• Generate AI-powered departments for your business\n• Check on workflow execution and results\n• Manage your automation infrastructure\n\nHow can I automate your business today?',
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingTasks, setPendingTasks] = useState<ProposedAction[]>([]);
  const [showTools, setShowTools] = useState(false);
  const [taskQueue, setTaskQueue] = useState<Array<{ task: string; department?: any }>>([]);
  const [isExecutingTask, setIsExecutingTask] = useState(false);
  const [showCommandsHelp, setShowCommandsHelp] = useState(false);

  // Load pending tasks and tools on mount
  useEffect(() => {
    setPendingTasks(getPendingActions());
    loadTools();
  }, [loadTools]);

  // Process task queue sequentially
  useEffect(() => {
    if (isExecutingTask || taskQueue.length === 0) return;

    const processQueue = async () => {
      setIsExecutingTask(true);
      const nextTask = taskQueue[0];
      const remainingCount = taskQueue.length;

      // Show queue status if multiple tasks
      if (remainingCount > 1) {
        const queueMessage: Message = {
          role: 'system',
          content: `📋 Processing task 1 of ${remainingCount} in queue...`,
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, queueMessage]);
      }

      setTaskQueue(prev => prev.slice(1));

      try {
        if (nextTask.department) {
          await executeTaskWithAgent(nextTask.task, nextTask.department);
        } else {
          await executeTaskInternal(nextTask.task);
        }
      } catch (error) {
        console.error('Error processing task from queue:', error);
        const errorMessage: Message = {
          role: 'system',
          content: `❌ Task failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsExecutingTask(false);
      }
    };

    processQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskQueue.length, isExecutingTask]);

  const executeTask = async (task: string) => {
    // Add task to queue for sequential execution
    setTaskQueue(prev => [...prev, { task }]);
  };

  const executeTaskInternal = async (task: string) => {
    try {
      // Build company object from canvas nodes
      const agentNodes = nodes.filter(node => node.type === 'agentNode');

      if (agentNodes.length === 0) {
        const errorMessage: Message = {
          role: 'system',
          content: '❌ No agents available. Please create some agents first.',
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, errorMessage]);
        return;
      }

      const company = {
        name: 'Company',
        industry: 'General',
        departments: agentNodes.map(node => ({
          id: node.id,
          name: node.data.name,
          description: node.data.instructions,
          agent: {
            id: node.id,
            data: {
              name: node.data.name,
              instructions: node.data.instructions,
              toolsEnabled: node.data.toolsEnabled || false,
            },
          },
        })),
      };

      // Route task to appropriate agent
      const routeResponse = await fetch('/api/route-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task, company }),
      });

      if (!routeResponse.ok) {
        throw new Error('Failed to route task');
      }

      const routeData = await routeResponse.json();
      const departmentId = routeData.departmentId || routeData.department_id;

      if (!departmentId) {
        // No suitable department found, use first available
        const firstDept = company.departments[0];
        const fallbackMessage: Message = {
          role: 'system',
          content: `⚠️ No specific agent found for task, using ${firstDept.agent.data.name}`,
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, fallbackMessage]);
        return executeTaskWithAgent(task, firstDept);
      }

      const department = company.departments.find(d => d.id === departmentId);

      if (!department) {
        // Department not found, use first available
        console.warn(`Department ${departmentId} not found, using first available agent`);
        const firstDept = company.departments[0];
        const fallbackMessage: Message = {
          role: 'system',
          content: `⚠️ Routing to ${firstDept.agent.data.name} (first available agent)`,
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, fallbackMessage]);
        return executeTaskWithAgent(task, firstDept);
      }

      return executeTaskWithAgent(task, department);
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

  const executeTaskWithAgent = async (task: string, department: any) => {
    try {
      // Build company object from canvas nodes for sub-agent creation
      const agentNodes = nodes.filter(node => node.type === 'agentNode');
      const company = {
        name: 'Company',
        industry: 'General',
        departments: agentNodes.map(node => ({
          id: node.id,
          name: node.data.name,
          description: node.data.instructions,
          agent: {
            id: node.id,
            data: {
              name: node.data.name,
              instructions: node.data.instructions,
            },
          },
        })),
      };

      // Analyze workflow approach before execution
      let workflowAnalysis = null;
      try {
        const workflowResponse = await fetch('/api/analyze-workflow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            task,
            agentName: department.agent.data.name,
            departmentName: department.name,
          }),
        });

        if (workflowResponse.ok) {
          const workflowData = await workflowResponse.json();
          if (workflowData.success) {
            workflowAnalysis = workflowData.analysis;

            // Show workflow approach to user
            const workflowMessage: Message = {
              role: 'system',
              content: `📋 Using ${workflowAnalysis.workflow.replace(/_/g, ' ')} workflow: ${workflowAnalysis.reasoning}`,
              timestamp: Date.now(),
            };
            setMessages(prev => [...prev, workflowMessage]);
          }
        }
      } catch (workflowError) {
        console.error('Workflow analysis failed:', workflowError);
        // Continue without workflow analysis
      }

      // Show execution started message
      const startMessage: Message = {
        role: 'system',
        content: `🤖 ${department.agent.data.name} is working on: "${task}"`,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, startMessage]);

      // Execute task
      const executeResponse = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: task,
          agent: department.agent,
          workflowName: department.name,
          workflowAnalysis,
          customTools: tools,
          company,
        }),
      });

      if (!executeResponse.ok) {
        throw new Error('Failed to execute task');
      }

      // Handle streaming response
      const reader = executeResponse.body?.getReader();
      const decoder = new TextDecoder();
      let result = null;

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'result') {
                result = data.result;
              }
            }
          }
        }
      }

      if (result) {
        // Show result
        const resultMessage: Message = {
          role: 'system',
          content: `✅ ${result.agentName} completed the task:\n\n${result.output}`,
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, resultMessage]);

        // Update knowledge base with learning
        await fetch('/api/knowledge/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'add_learning',
            departmentName: department.name,
            data: `[${new Date().toLocaleDateString()}] ${task.substring(0, 50)}...: ${result.output.substring(0, 100)}...`,
          }),
        });
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
      // Build company object from canvas nodes for knowledge base updates
      const agentNodes = nodes.filter(node => node.type === 'agentNode');
      const company = agentNodes.length > 0 ? {
        name: 'Company',
        departments: agentNodes.map(node => ({
          id: node.id,
          name: node.data.name,
          description: node.data.instructions,
        })),
      } : null;

      const response = await fetch('/api/ceo-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: input,
          executions: getAllExecutions(),
          company,
          customTools: getStoredCustomTools(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      // Handle company creation request
      if (data.type === 'company_creation') {
        // Clear chat history for fresh start with new company
        setMessages([{
          role: 'assistant',
          content: data.response,
          timestamp: Date.now(),
        }]);

        // Trigger company generation
        if (onCompanyCreationRequest) {
          onCompanyCreationRequest(data.industry, data.description);
        }
      } else if (data.type === 'agent_creation') {
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.response,
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, assistantMessage]);

        // Trigger agent generation
        if (onAgentCreationRequest) {
          onAgentCreationRequest(data.description);
        }
      } else if (data.type === 'task_generation') {
        // Generate tasks for employees
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.response,
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, assistantMessage]);

        const generatingMessage: Message = {
          role: 'system',
          content: '🤖 Analyzing company document and generating tasks for all departments...',
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, generatingMessage]);

        try {
          // Build company object from canvas nodes
          const agentNodes = nodes.filter(node => node.type === 'agentNode');

          const company = {
            name: 'Company',
            departments: agentNodes.map(node => ({
              id: node.id,
              name: node.data.name,
              description: node.data.instructions,
              agent: {
                id: node.id,
                data: {
                  name: node.data.name,
                  instructions: node.data.instructions,
                },
              },
            })),
          };

          const taskResponse = await fetch('/api/generate-tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ company }),
          });

          if (!taskResponse.ok) {
            throw new Error('Failed to generate tasks');
          }

          const taskData = await taskResponse.json();

          // Save proposed actions to localStorage
          const { getProposedActions, saveProposedActions } = await import('@/lib/knowledgeStorage');
          const currentActions = getProposedActions();
          const newActions = [...taskData.proposedActions, ...currentActions];
          saveProposedActions(newActions);

          // Update pending tasks
          setPendingTasks(getPendingActions());

          const tasksMessage: Message = {
            role: 'system',
            content: `✅ Generated ${taskData.count} task${taskData.count !== 1 ? 's' : ''} from ${taskData.proposedActions.length} department${taskData.proposedActions.length !== 1 ? 's' : ''}`,
            timestamp: Date.now(),
            proposedTasks: taskData.proposedActions,
          };
          setMessages(prev => [...prev, tasksMessage]);
        } catch (taskError) {
          console.error('Error generating tasks:', taskError);
          const errorMessage: Message = {
            role: 'system',
            content: '❌ Failed to generate tasks. Please try again.',
            timestamp: Date.now(),
          };
          setMessages(prev => [...prev, errorMessage]);
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
    <div className="flex flex-col h-full bg-white">
      {/* 1. Logo at top */}
      <div className="border-b border-[#828179] p-4 flex justify-center bg-white">
        <Image
          src="/mymba_logo.png?v=2"
          alt="MyMBA Logo"
          width={180}
          height={54}
          className="object-contain"
          priority
          unoptimized
        />
      </div>

      {/* 2. Quick Actions */}
      <div className="px-4 pt-4 pb-2 space-y-2 border-b border-[#828179] bg-white">
        <button
          onClick={() => openModal()}
          className="w-full bg-[#CC785C] text-white px-4 py-2.5 rounded-lg hover:bg-[#b86a4f] transition-all font-medium text-sm shadow-sm"
        >
          + Add Agent
        </button>
        <button
          onClick={() => openToolModal()}
          className="w-full bg-[#71816D] text-white px-4 py-2.5 rounded-lg hover:bg-[#5A6A56] transition-all font-medium text-sm shadow-sm"
        >
          + Add Tool
        </button>
        <button
          onClick={() => addStickyNote()}
          className="w-full bg-[#FEF08A] text-gray-800 px-4 py-2.5 rounded-lg hover:bg-[#FDE047] transition-all font-medium text-sm shadow-sm border border-yellow-300"
        >
          + Add Sticky Note
        </button>
      </div>

      {/* 3. Pending Tasks Counter (if any) */}
      {pendingTasks.length > 0 && (
        <div className="px-4 py-2 border-b border-[#828179] bg-white">
          <div className="bg-amber-50 border border-amber-300 rounded-lg p-3">
            <p className="text-xs font-semibold text-amber-800">
              📋 {pendingTasks.length} Pending Task{pendingTasks.length !== 1 ? 's' : ''}
            </p>
            <p className="text-xs text-amber-700 mt-1">
              Review and approve tasks below
            </p>
          </div>
        </div>
      )}

      {/* 3.5. Tools Section (collapsible) */}
      {tools.length > 0 && (
        <div className="px-4 py-2 border-b border-[#828179] bg-white">
          <button
            onClick={() => setShowTools(!showTools)}
            className="w-full flex items-center justify-between text-left"
          >
            <p className="text-xs font-semibold text-[#141413]">
              🔧 {tools.length} Custom Tool{tools.length !== 1 ? 's' : ''}
            </p>
            <span className="text-xs text-[#828179]">{showTools ? '▼' : '▶'}</span>
          </button>

          {showTools && (
            <div className="mt-2 space-y-2">
              {tools.map((tool) => (
                <div key={tool.id} className="bg-[#F0EFEA] border border-[#828179] rounded-lg p-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#141413] truncate">{tool.name}</p>
                      {tool.description && (
                        <p className="text-xs text-[#828179] mt-0.5 line-clamp-2">{tool.description}</p>
                      )}
                      <p className="text-xs text-[#828179] font-mono mt-1 truncate">{tool.endpoint}</p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openToolModal(tool)}
                        className="px-2 py-1 bg-[#71816D] text-white rounded text-xs hover:bg-[#5A6A56] transition"
                      >
                        ✎
                      </button>
                      <button
                        onClick={() => deleteTool(tool.id)}
                        className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. Command Center Header */}
      <div className="px-4 py-3 border-b border-[#828179] bg-[#F0EFEA] flex items-center justify-center gap-2">
        <h3 className="font-semibold text-[#141413] text-lg">Command Center</h3>
        <button
          onClick={() => setShowCommandsHelp(true)}
          className="w-6 h-6 rounded-full bg-[#71816D] text-white flex items-center justify-center text-xs hover:bg-[#5A6A56] transition-all"
          title="View available commands"
        >
          ?
        </button>
      </div>

      {/* Commands Help Modal */}
      {showCommandsHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-[#F0EFEA] px-6 py-4 border-b border-[#828179] flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#141413]">Command Center - Available Commands</h2>
              <button
                onClick={() => setShowCommandsHelp(false)}
                className="w-8 h-8 rounded-full bg-[#828179] text-white flex items-center justify-center hover:bg-[#141413] transition"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Company Commands */}
              <div>
                <h3 className="text-lg font-semibold text-[#CC785C] mb-3">🏢 Company Commands</h3>
                <div className="space-y-3 bg-[#F0EFEA] p-4 rounded-lg">
                  <div>
                    <p className="font-medium text-sm text-[#141413]">Create a new company:</p>
                    <code className="text-xs bg-white px-2 py-1 rounded border border-[#828179] mt-1 block">create a [industry] company</code>
                    <p className="text-xs text-[#828179] mt-1">Examples: "create a real estate company", "start a tech company"</p>
                  </div>
                  <div>
                    <p className="font-medium text-sm text-[#141413]">Update company info:</p>
                    <p className="text-xs text-[#828179] mt-1">Just tell me about goals, problems, or mission updates and I'll save them automatically!</p>
                    <p className="text-xs text-[#828179]">Example: "Our main goal is to increase revenue by 25%"</p>
                  </div>
                </div>
              </div>

              {/* Agent Commands */}
              <div>
                <h3 className="text-lg font-semibold text-[#CC785C] mb-3">🤖 Agent Commands</h3>
                <div className="space-y-3 bg-[#F0EFEA] p-4 rounded-lg">
                  <div>
                    <p className="font-medium text-sm text-[#141413]">Create an agent:</p>
                    <code className="text-xs bg-white px-2 py-1 rounded border border-[#828179] mt-1 block">create an agent for [department/function]</code>
                    <p className="text-xs text-[#828179] mt-1">Examples: "create an agent for marketing", "add an agent for customer support"</p>
                  </div>
                </div>
              </div>

              {/* Task Commands */}
              <div>
                <h3 className="text-lg font-semibold text-[#CC785C] mb-3">📋 Task Commands</h3>
                <div className="space-y-3 bg-[#F0EFEA] p-4 rounded-lg">
                  <div>
                    <p className="font-medium text-sm text-[#141413]">Generate tasks for all agents:</p>
                    <code className="text-xs bg-white px-2 py-1 rounded border border-[#828179] mt-1 block">generate tasks for agents</code>
                    <p className="text-xs text-[#828179] mt-1">Also: "create tasks for employees", "what should the agents work on"</p>
                  </div>
                  <div>
                    <p className="font-medium text-sm text-[#141413]">Execute a specific task:</p>
                    <code className="text-xs bg-white px-2 py-1 rounded border border-[#828179] mt-1 block">Just describe what needs to be done</code>
                    <p className="text-xs text-[#828179] mt-1">Example: "Research competitors in the fitness industry"</p>
                  </div>
                </div>
              </div>

              {/* General Commands */}
              <div>
                <h3 className="text-lg font-semibold text-[#CC785C] mb-3">💬 General Commands</h3>
                <div className="space-y-3 bg-[#F0EFEA] p-4 rounded-lg">
                  <div>
                    <p className="font-medium text-sm text-[#141413]">Ask questions:</p>
                    <p className="text-xs text-[#828179] mt-1">Ask me anything about your company, agents, or work history</p>
                    <p className="text-xs text-[#828179]">Examples: "What do I need to do?", "How is marketing performing?"</p>
                  </div>
                </div>
              </div>

              {/* Tips */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">💡 Pro Tips</h3>
                <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
                  <li>I automatically save goals, problems, and insights from our conversations</li>
                  <li>Agents learn from completed tasks and update the knowledge base</li>
                  <li>Use natural language - I understand context and intent</li>
                  <li>Review and approve generated tasks from the pending tasks list</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Messages (flex-1 to take remaining space) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
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
                <div className="text-sm prose prose-sm max-w-none prose-headings:font-semibold prose-p:my-2 prose-ul:my-2 prose-li:my-1">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                </div>

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

      {/* 6. Input at bottom */}
      <div className="p-4 border-t border-[#828179] bg-white">
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

      {/* Tool Modal */}
      <ToolModal />
    </div>
  );
}
