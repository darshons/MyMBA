import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const runtime = 'edge';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export async function POST(request: NextRequest) {
  try {
    const { industry, description } = await request.json();

    if (!industry || !industry.trim()) {
      return NextResponse.json({ error: 'Industry is required' }, { status: 400 });
    }

    const prompt = `You are an organizational consultant designing company structures. A CEO wants to start a ${industry} company${description ? `: ${description}` : ''}.

Generate a comprehensive department structure for this company. Include:
1. Core departments (e.g., Operations, Marketing, HR, Finance)
2. Subdepartments where appropriate (e.g., Marketing > Social Media, Content)
3. One AI agent for each department that will handle ALL tasks for that department

For each department's agent, specify:
- Name (make it creative and role-appropriate, e.g., "Marketing Maven", "Operations Orchestrator")
- Role/title (e.g., "Senior Marketing Agent", "Operations Director Agent")
- Comprehensive responsibilities (this agent handles ALL department tasks, so be thorough)

Return ONLY valid JSON in this exact format:
{
  "companyName": "suggested company name",
  "reasoning": "brief explanation of why these departments",
  "departments": [
    {
      "name": "Department Name",
      "description": "what this department does",
      "parentName": null,
      "suggestedAgent": {
        "name": "Agent Name",
        "role": "Agent Title",
        "responsibilities": "Comprehensive list of what this agent handles for the entire department"
      }
    }
  ]
}

For subdepartments, set parentName to the parent department's name.
Make it specific to the ${industry} industry.
Each agent should be capable of handling the full scope of their department's work.`;

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

    const response = message.content[0].type === 'text' ? message.content[0].text : '';

    // Parse the JSON response
    let parsed;
    try {
      // Remove markdown code blocks if present
      const jsonStr = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(jsonStr);
    } catch (error) {
      console.error('Failed to parse AI response:', response);
      return NextResponse.json({ error: 'Failed to parse company structure' }, { status: 500 });
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Company generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate company structure' },
      { status: 500 }
    );
  }
}
