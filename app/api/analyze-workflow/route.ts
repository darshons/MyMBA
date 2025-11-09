import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'fs';
import { join } from 'path';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export async function POST(request: NextRequest) {
  try {
    const { task, agentName, departmentName } = await request.json();

    // Read workflows guide
    const workflowsPath = join(process.cwd(), 'lib', 'workflows-guide.md');
    const workflowsGuide = readFileSync(workflowsPath, 'utf-8');

    const analysisPrompt = `You are an AI workflow optimization expert. Analyze this task and determine the optimal execution workflow pattern.

TASK: "${task}"
AGENT: ${agentName} (${departmentName} department)

AVAILABLE WORKFLOW PATTERNS:
${workflowsGuide}

Analyze the task and respond in JSON format:
{
  "workflow": "prompt_chaining" | "router" | "panel_of_judges" | "delegation" | "parallelization" | "debate" | "specialization" | "evaluator_optimizer",
  "reasoning": "Brief explanation of why this workflow is optimal for this task",
  "execution_plan": {
    "steps": ["step 1 description", "step 2 description", ...],
    "model_allocation": {
      "primary": "claude-sonnet-4" | "claude-3-haiku-20240307",
      "secondary": "claude-sonnet-4" | "claude-3-haiku-20240307" (if needed for delegation/parallelization)
    },
    "estimated_calls": 2 (number of LLM calls needed),
    "parallel": true/false
  },
  "expected_benefits": ["benefit 1", "benefit 2"]
}

Choose the workflow that will produce the BEST RESULTS for this specific task, considering:
1. Task complexity and requirements
2. Need for quality vs speed
3. Whether subtasks are predictable or dynamic
4. Whether multiple perspectives would help
5. Cost/speed optimization opportunities`;

    const message = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: analysisPrompt,
        },
      ],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '{}';

    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse workflow analysis');
    }

    const analysis = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error('Workflow analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze workflow', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
