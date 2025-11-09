import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { AgentNode } from '@/types';
import { AVAILABLE_TOOLS, executeToolCall } from '@/lib/tools';
import { searchChunks } from '@/lib/rag';
import { CustomToolDefinition } from '@/types/customTool';

export const runtime = 'nodejs';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      input,
      agent,
      workflowName,
      pastExecutions,
      workflowAnalysis,
      customTools = [],
      company,
    } = body;

    if (!input || !agent) {
      return new Response('Missing required fields', { status: 400 });
    }

    // Build feedback context from past executions with feedback
    let feedbackContext = '';
    if (pastExecutions && pastExecutions.length > 0) {
      const executionsWithFeedback = pastExecutions.filter((exec: any) => exec.feedback);

      if (executionsWithFeedback.length > 0) {
        feedbackContext = '\n\nPAST CEO FEEDBACK (Learn from this to improve your work):\n';
        executionsWithFeedback.slice(0, 3).forEach((exec: any, idx: number) => {
          feedbackContext += `\n${idx + 1}. Previous task: "${exec.input}"\n`;
          feedbackContext += `   CEO Rating: ${exec.feedback.rating}/5 stars\n`;
          if (exec.feedback.comment) {
            feedbackContext += `   CEO Comment: "${exec.feedback.comment}"\n`;
          }
        });
        feedbackContext += '\nUse this feedback to improve your current work.\n';
      }
    }

    // Build workflow execution guidance
    let workflowContext = '';
    if (workflowAnalysis) {
      workflowContext = `\n\nOPTIMAL WORKFLOW STRATEGY:\n`;
      workflowContext += `Workflow Type: ${workflowAnalysis.workflow.replace(/_/g, ' ').toUpperCase()}\n`;
      workflowContext += `Reasoning: ${workflowAnalysis.reasoning}\n`;
      if (workflowAnalysis.execution_plan && workflowAnalysis.execution_plan.steps) {
        workflowContext += `\nExecution Steps:\n`;
        workflowAnalysis.execution_plan.steps.forEach((step: string, idx: number) => {
          workflowContext += `${idx + 1}. ${step}\n`;
        });
      }
      workflowContext += `\nFollow this workflow pattern to optimize your task execution.\n`;
    }

    // Build RAG context from relevant knowledge chunks
    let ragContext = '';
    try {
      const relevantChunks = searchChunks(input, {
        department: workflowName,
        limit: 3, // Top 3 most relevant chunks
      });

      if (relevantChunks.length > 0) {
        ragContext = `\n\nRELEVANT COMPANY KNOWLEDGE:\n`;
        relevantChunks.forEach((chunk, idx) => {
          ragContext += `\n[${idx + 1}] ${chunk.metadata.section}`;
          if (chunk.metadata.department) {
            ragContext += ` - ${chunk.metadata.department}`;
          }
          ragContext += ` (${chunk.metadata.type}):\n${chunk.content}\n`;
        });
        ragContext += `\nUse this context to inform your work on the current task.\n`;
      }
    } catch (error) {
      console.error('RAG search failed:', error);
      // Continue without RAG context if search fails
    }

    const sanitizedCustomTools: CustomToolDefinition[] = Array.isArray(customTools)
      ? customTools
          .filter((tool: any) => tool && tool.id && tool.name && tool.endpoint)
          .map((tool: any) => ({
            id: String(tool.id),
            name: String(tool.name).slice(0, 64),
            description: String(tool.description || 'Custom user tool'),
            endpoint: String(tool.endpoint),
            authType: tool.authType === 'bearer' || tool.authType === 'apikey' ? tool.authType : 'none',
            authValue: tool.authValue ? String(tool.authValue) : undefined,
          }))
      : [];

    const { toolDefinitions, toolMap } = buildCustomToolDefinitions(sanitizedCustomTools);

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        // Send "active" status
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'active', agentId: agent.id })}\n\n`)
        );

        try {
          // Call Claude API with feedback context, workflow guidance, RAG context, and optional tools
          const systemPrompt = agent.data.instructions + feedbackContext + workflowContext + ragContext;

          // Build message parameters
          const messageParams: any = {
            model: 'claude-3-haiku-20240307',
            max_tokens: 1024,
            system: systemPrompt,
            messages: [
              {
                role: 'user',
                content: input,
              },
            ],
          };

          // Add tools if enabled for this agent
          if (agent.data.toolsEnabled) {
            messageParams.tools = [
              ...AVAILABLE_TOOLS,
              ...toolDefinitions,
            ];
          }

          let message = await anthropic.messages.create(messageParams);

          // Handle tool use loop
          let output = '';
          const conversationMessages: any[] = [
            {
              role: 'user',
              content: input,
            },
          ];

          while (message.stop_reason === 'tool_use') {
            // Find tool use blocks
            const toolUseBlock = message.content.find(
              (block: any) => block.type === 'tool_use'
            ) as any;

            if (!toolUseBlock) break;

            // Execute the tool
            const toolResult = await executeToolCall(
              toolUseBlock.name,
              toolUseBlock.input,
              toolMap,
              {
                company,
                agentName: agent.data.name,
                customToolsArray: sanitizedCustomTools,
              }
            );

            // Add assistant message and tool result to conversation
            conversationMessages.push({
              role: 'assistant',
              content: message.content,
            });

            conversationMessages.push({
              role: 'user',
              content: [
                {
                  type: 'tool_result',
                  tool_use_id: toolUseBlock.id,
                  content: toolResult,
                },
              ],
            });

            // Continue the conversation
            message = await anthropic.messages.create({
              model: 'claude-3-haiku-20240307',
              max_tokens: 1024,
              system: systemPrompt,
              messages: conversationMessages,
              tools: agent.data.toolsEnabled
                ? [...AVAILABLE_TOOLS, ...toolDefinitions]
                : undefined,
            });
          }

          // Extract final text output
          const textBlock = message.content.find((block: any) => block.type === 'text');
          output = textBlock ? textBlock.text : 'No response';

          // Send result
          const result = {
            agentId: agent.id,
            agentName: agent.data.name,
            input,
            output,
            timestamp: Date.now(),
          };

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'result', result })}\n\n`)
          );
        } catch (error) {
          console.error('Error executing agent:', error);
          const errorMessage = error instanceof Error ? error.message : 'Failed to execute agent';
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'error',
                agentId: agent.id,
                error: errorMessage
              })}\n\n`
            )
          );
        }

        // Send completion
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'complete' })}\n\n`)
        );

        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('API error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

function buildCustomToolDefinitions(customTools: CustomToolDefinition[]) {
  const definitions: any[] = [];
  const toolMap = new Map<string, CustomToolDefinition>();

  customTools.forEach(tool => {
    const toolName = `custom_tool_${tool.id}`;
    toolMap.set(toolName, tool);

    definitions.push({
      name: toolName,
      description: `${tool.description} (User-defined tool)`,
      input_schema: {
        type: 'object',
        properties: {
          input: {
            type: 'string',
            description: 'Primary input or payload for this tool',
          },
          context: {
            type: 'string',
            description: 'Optional additional context or metadata',
          },
        },
        required: ['input'],
      },
    });
  });

  return { toolDefinitions: definitions, toolMap };
}
