import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const runtime = 'edge';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

interface Department {
  id: string;
  name: string;
  description: string;
  employees: any[];
}

interface Company {
  name: string;
  industry: string;
  departments: Department[];
}

export async function POST(req: NextRequest) {
  try {
    const { task, company } = await req.json() as { task: string; company: Company };

    if (!task || !company) {
      return new Response(
        JSON.stringify({ error: 'Missing task or company data' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create department summary for routing
    const departmentSummary = company.departments
      .map((dept) => {
        const employeeCount = dept.employees?.length || 0;
        return `- ${dept.name} (ID: ${dept.id}): ${dept.description}. Has ${employeeCount} employees.`;
      })
      .join('\n');

    const routingPrompt = `You are the CEO's executive assistant for ${company.name}, a ${company.industry} company.

A task has come in that needs to be assigned to the appropriate department. Here are our departments:

${departmentSummary}

Task: "${task}"

Analyze this task and determine which department is best suited to handle it. Consider:
1. The department's description and area of responsibility
2. The nature of the task
3. Which department's employees would have the right skills

Respond with ONLY the department ID (the part in parentheses after "ID:") of the best department to handle this task. Do not include any explanation, just the ID.

If no department is suitable, respond with "NONE".`;

    const response = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 100,
      messages: [
        {
          role: 'user',
          content: routingPrompt,
        },
      ],
    });

    const departmentId = response.content[0].type === 'text'
      ? response.content[0].text.trim()
      : 'NONE';

    // Validate the department ID exists
    const selectedDepartment = company.departments.find((d) => d.id === departmentId);

    if (!selectedDepartment) {
      return new Response(
        JSON.stringify({
          departmentId: null,
          departmentName: null,
          reasoning: 'No suitable department found for this task.',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        departmentId: selectedDepartment.id,
        departmentName: selectedDepartment.name,
        reasoning: `Task routed to ${selectedDepartment.name} department.`,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Task routing error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to route task' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
