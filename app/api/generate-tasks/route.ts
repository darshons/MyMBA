import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'fs';
import { join } from 'path';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

interface ProposedTask {
  action: string;
  reasoning: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { company } = body;

    if (!company) {
      return NextResponse.json(
        { error: 'No company found' },
        { status: 400 }
      );
    }

    // Read company.md to get overview and goals
    const filePath = join(process.cwd(), 'public', 'company.md');
    const companyDoc = readFileSync(filePath, 'utf-8');

    // Extract company overview (everything before first ## heading)
    const overviewMatch = companyDoc.match(/^([\s\S]*?)(?=\n##\s)/m);
    const companyOverview = overviewMatch ? overviewMatch[1].trim() : '';

    const allProposedActions = [];

    // For each department, generate tasks
    for (const dept of company.departments) {
      if (!dept.agent) continue; // Skip departments without agents

      // Extract department-specific section from company.md
      const deptSection = extractDepartmentSection(companyDoc, dept.name);

      // Ask Claude to propose tasks for this department
      const prompt = `You are the ${dept.agent.data.name} for ${company.name}.

COMPANY CONTEXT:
${companyOverview}

YOUR DEPARTMENT (${dept.name}):
${dept.description}

CURRENT SITUATION & GOALS:
${deptSection || 'No specific information available.'}

Based on the company's goals, current problems, and your department's responsibilities, propose exactly ONE specific, actionable task that would have the most impact.

Consider:
- What problems from the company overview can you address?
- What goals can you help achieve?
- What single improvement would have the most impact?
- What is realistically achievable in the near term?

Respond with a JSON array containing exactly ONE task in this format:
[
  {
    "action": "Brief task description (what needs to be done)",
    "reasoning": "Why this task is important and how it helps the company",
    "priority": "low" | "medium" | "high" | "critical"
  }
]

IMPORTANT: Respond with exactly ONE task only. Respond ONLY with the JSON array, no other text.`;

      try {
        const response = await anthropic.messages.create({
          model: 'claude-3-haiku-20240307',
          max_tokens: 1024,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        });

        // Extract text from response
        const responseText = response.content
          .filter((block: any) => block.type === 'text')
          .map((block: any) => block.text)
          .join('');

        // Parse JSON response
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
          console.error(`Failed to parse tasks for ${dept.name}`);
          continue;
        }

        const proposedTasks: ProposedTask[] = JSON.parse(jsonMatch[0]);

        // Create proposed action objects (client will save to localStorage)
        for (const task of proposedTasks) {
          const proposedAction = {
            id: `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            departmentId: dept.id,
            departmentName: dept.name,
            agentId: dept.agent.id,
            agentName: dept.agent.data.name,
            action: task.action,
            reasoning: task.reasoning,
            status: 'pending' as const,
            createdAt: new Date().toISOString(),
          };
          allProposedActions.push(proposedAction);
        }
      } catch (error) {
        console.error(`Error generating tasks for ${dept.name}:`, error);
        // Continue with next department
      }
    }

    return NextResponse.json({
      success: true,
      proposedActions: allProposedActions,
      count: allProposedActions.length,
    });
  } catch (error) {
    console.error('Error generating tasks:', error);
    return NextResponse.json(
      { error: 'Failed to generate tasks' },
      { status: 500 }
    );
  }
}

function extractDepartmentSection(content: string, departmentName: string): string {
  const lines = content.split('\n');
  const sectionStart = lines.findIndex(line =>
    line.trim().startsWith('##') && line.includes(departmentName)
  );

  if (sectionStart === -1) {
    return ''; // Department section not found
  }

  // Find next ## heading or end of file
  let sectionEnd = lines.length;
  for (let i = sectionStart + 1; i < lines.length; i++) {
    if (lines[i].trim().startsWith('##') && !lines[i].trim().startsWith('###')) {
      sectionEnd = i;
      break;
    }
  }

  return lines.slice(sectionStart, sectionEnd).join('\n');
}
