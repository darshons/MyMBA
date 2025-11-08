import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { AgentNode, AgentEdge } from '@/types';

export const runtime = 'edge';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

// Helper to build the execution order based on edges
function getExecutionOrder(nodes: AgentNode[], edges: AgentEdge[]): AgentNode[] {
  // Find nodes with no incoming edges (starting nodes)
  const nodeIds = new Set(nodes.map(n => n.id));
  const targetIds = new Set(edges.map(e => e.target));
  const startNodes = nodes.filter(n => !targetIds.has(n.id));

  // If no clear start, just use all nodes in order
  if (startNodes.length === 0) {
    return nodes;
  }

  // Simple topological sort
  const visited = new Set<string>();
  const order: AgentNode[] = [];

  function visit(nodeId: string) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);

    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    // Visit dependencies first
    const outgoingEdges = edges.filter(e => e.source === nodeId);
    outgoingEdges.forEach(edge => visit(edge.target));

    order.unshift(node);
  }

  startNodes.forEach(node => visit(node.id));

  return order;
}

export async function POST(request: NextRequest) {
  try {
    const { input, nodes, edges } = await request.json();

    if (!input || !nodes || nodes.length === 0) {
      return new Response('Missing required fields', { status: 400 });
    }

    const executionOrder = getExecutionOrder(nodes, edges);

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let context = input;

        for (const node of executionOrder) {
          // Send "active" status
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'active', agentId: node.id })}\n\n`)
          );

          try {
            // Call Claude API
            const message = await anthropic.messages.create({
              model: 'claude-3-5-sonnet-20241022',
              max_tokens: 1024,
              system: node.data.instructions,
              messages: [
                {
                  role: 'user',
                  content: context,
                },
              ],
            });

            const output = message.content[0].type === 'text'
              ? message.content[0].text
              : 'No response';

            // Send result
            const result = {
              agentId: node.id,
              agentName: node.data.name,
              input: context,
              output,
              timestamp: Date.now(),
            };

            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'result', result })}\n\n`)
            );

            // Update context for next agent
            context = output;

            // Small delay for visual effect
            await new Promise(resolve => setTimeout(resolve, 500));
          } catch (error) {
            console.error('Error executing agent:', error);
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: 'error',
                  agentId: node.id,
                  error: 'Failed to execute agent'
                })}\n\n`
              )
            );
          }
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
