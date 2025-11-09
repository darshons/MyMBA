import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const runtime = 'edge';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export async function POST(request: NextRequest) {
  try {
    const { description } = await request.json();

    if (!description || !description.trim()) {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 });
    }

    const prompt = `You are an AI workflow designer. The user wants to create a department agent. Analyze their description and generate a comprehensive AI agent that can handle the full workflow.

User's request: "${description}"

Generate a JSON response with a single agent that handles ALL aspects of the workflow:
{
  "agent": {
    "name": "Agent Name (creative and descriptive)",
    "instructions": "Comprehensive instructions for handling the ENTIRE workflow from start to finish. Be very detailed and specific about all steps the agent should take."
  }
}

Guidelines:
- The agent should be capable of handling intake, processing, AND response
- Instructions should cover the complete workflow:
  1. How to receive and understand input
  2. What processing/analysis to perform
  3. How to format and deliver the final output
- Instructions should be specific, actionable, and thorough
- Think of this as a senior-level agent that owns the entire process
- Name should be creative and reflect the agent's role

Return ONLY the JSON object, no other text.`;

    const message = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '{}';

    // Extract JSON from response (in case Claude adds markdown formatting)
    let jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : responseText;

    const workflow = JSON.parse(jsonString);

    return NextResponse.json(workflow);
  } catch (error) {
    console.error('Generate workflow error:', error);
    return NextResponse.json(
      { error: 'Failed to generate workflow' },
      { status: 500 }
    );
  }
}
