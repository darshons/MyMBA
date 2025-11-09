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

Generate a lean department structure with 5-8 core departments. Focus on essential departments only.

For each department's agent, specify:
- Name (use the DEPARTMENT NAME as the agent name, e.g., "Marketing", "Finance", "Operations", "Sales")
- Role (brief 1-line description)
- Responsibilities (concise, 1-2 sentences covering key duties)

Return ONLY valid JSON in this exact format:
{
  "companyName": "suggested company name",
  "reasoning": "brief 1-sentence explanation",
  "departments": [
    {
      "name": "Department Name",
      "description": "brief 1-sentence description",
      "parentName": null,
      "suggestedAgent": {
        "name": "Department Name",
        "role": "Brief role description",
        "responsibilities": "Concise 1-2 sentence list of key duties"
      }
    }
  ]
}

IMPORTANT:
- Keep it to 5-8 departments maximum
- Be concise in all descriptions
- Agent name must be the department name
- No subdepartments (all parentName should be null)
- Make it specific to the ${industry} industry`;

    const message = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 4096,
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
