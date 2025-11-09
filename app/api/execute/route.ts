import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { AgentNode } from '@/types';
import { AVAILABLE_TOOLS, executeToolCall } from '@/lib/tools';

export const runtime = 'edge';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export async function POST(request: NextRequest) {
  try {
    const { input, agent, workflowName, pastExecutions } = await request.json();

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

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        // Send "active" status
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'active', agentId: agent.id })}\n\n`)
        );

        try {
          // Call Claude API with feedback context and optional tools
          const systemPrompt = agent.data.instructions + feedbackContext;

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
            messageParams.tools = AVAILABLE_TOOLS;
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
            );

            if (!toolUseBlock) break;

            // Execute the tool
            const toolResult = await executeToolCall(
              toolUseBlock.name,
              toolUseBlock.input
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
              tools: agent.data.toolsEnabled ? AVAILABLE_TOOLS : undefined,
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
