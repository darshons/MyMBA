import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const runtime = 'nodejs';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export async function POST(request: NextRequest) {
  try {
    const { message, company } = await request.json();

    if (!message || !company) {
      return NextResponse.json({ error: 'Message and company required' }, { status: 400 });
    }

    // Build department context
    const departmentsList = company.departments.map((dept: any) =>
      `- ${dept.name}: ${dept.description}`
    ).join('\n');

    const prompt = `You are an intelligent task router for a company. Analyze the user's message and break it down into individual tasks that should be sent to different departments.

Company Departments:
${departmentsList}

User Message:
"${message}"

Your task:
1. Identify each distinct task or request in the message
2. For each task, determine which department should handle it
3. Extract ONLY the relevant portion of the message for each department

Respond in JSON format:
{
  "tasks": [
    {
      "task": "the specific task description to send to the department",
      "department": "exact department name from the list above",
      "reasoning": "brief explanation of why this department"
    }
  ]
}

Rules:
- If the message is a single task, return one item
- If the message contains multiple tasks for different departments, return multiple items
- Each "task" field should be a complete, standalone description that the department can act on
- Do NOT include parts meant for other departments in each task
- Use the EXACT department name from the list above

Example:
User: "A customer is angry their order is late. We need a social media campaign for Gen Z."

Response:
{
  "tasks": [
    {
      "task": "A customer is angry their order is late. Please handle this customer complaint and resolve the issue.",
      "department": "Customer Experience",
      "reasoning": "Customer service handles complaints and order issues"
    },
    {
      "task": "We need to create a social media campaign targeting Gen Z.",
      "department": "Marketing",
      "reasoning": "Marketing department handles social media campaigns"
    }
  ]
}`;

    const message_response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const responseText = message_response.content[0].type === 'text' ? message_response.content[0].text : '{}';

    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Failed to parse tasks' }, { status: 500 });
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Parse tasks error:', error);
    return NextResponse.json(
      { error: 'Failed to parse tasks' },
      { status: 500 }
    );
  }
}
