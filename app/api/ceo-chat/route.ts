import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

export const runtime = 'nodejs';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

// Detect if question is requesting company creation
function isCompanyCreationRequest(question: string): { isRequest: boolean; industry?: string; description?: string } {
  const lowerQ = question.toLowerCase();

  // Match patterns like:
  // "create a dog grooming company"
  // "build a tech company"
  // "start an e-commerce company"
  const simplePattern = /(?:create|make|build|start)(?:\s+a|\s+an)?\s+(.+?)\s+company/i;
  const simpleMatch = question.match(simplePattern);
  if (simpleMatch) {
    return {
      isRequest: true,
      industry: simpleMatch[1].trim(),
      description: question,
    };
  }

  // Match patterns like:
  // "create company for dog grooming"
  // "company for real estate"
  const patterns = [
    /(?:create|make|build|start).*company.*(?:for|in|about)\s+([^.!?]+)/i,
    /company.*(?:for|in|about)\s+([^.!?]+)/i,
  ];

  for (const pattern of patterns) {
    const match = question.match(pattern);
    if (match) {
      return {
        isRequest: true,
        industry: match[1].trim(),
        description: question,
      };
    }
  }

  return { isRequest: false };
}

// Detect if question is requesting department creation
function isDepartmentCreationRequest(question: string): { isRequest: boolean; description?: string } {
  const lowerQ = question.toLowerCase();

  const patterns = [
    /(?:create|make|build|add|start).*(?:a|an|new)?\s*(.+?)\s*department/i,
    /(?:create|make|build|add).*department.*(?:for|to handle|that)\s+(.+)/i,
    /(?:add|create).*department.*(?:called|named)\s+(.+)/i,
    /(?:need|want).*(?:a|an)?\s*(.+?)\s*department/i,
  ];

  for (const pattern of patterns) {
    const match = question.match(pattern);
    if (match) {
      return {
        isRequest: true,
        description: question,
      };
    }
  }

  return { isRequest: false };
}

// Detect if this is a task to be executed (vs a question)
function isTaskRequest(question: string): boolean {
  const lowerQ = question.toLowerCase();

  // Strong question indicators (NOT tasks) - must be at start or very explicit
  const strongQuestionPatterns = [
    /^(what|when|where|who|why|which)\b/i,
    /^(can you|could you|would you|will you) (tell|show|explain|describe)/i,
    /\?$/,
  ];

  // Check strong question patterns first
  for (const pattern of strongQuestionPatterns) {
    if (pattern.test(lowerQ.trim())) {
      return false;
    }
  }

  // Task action verbs - if sentence starts with these, it's almost always a task
  const taskStartPatterns = [
    /^(help|handle|solve|fix|create|make|build|design|write|draft|develop|analyze|review|process|determine|research|find|identify|plan|prepare|generate|optimize|improve|assess|evaluate|investigate|study|explore)/i,
  ];

  for (const pattern of taskStartPatterns) {
    if (pattern.test(lowerQ.trim())) {
      return true;
    }
  }

  // Task indicators in content
  const taskContentPatterns = [
    /(need|want|require).*(help|assistance|support|done|handled|fixed|created|analyzed)/i,
    /(customer|client|user).*(issue|problem|complaint|request|concern)/i,
    /plan.*(campaign|strategy|initiative)/i,
    /analyze.*(data|feedback|performance|results)/i,
    /create.*(strategy|plan|content|material)/i,
    /write.*(proposal|report|document|plan)/i,
    /determine.*(best|optimal|right|correct)/i,
    /research.*(market|competitor|trend|option)/i,
    /design.*(product|feature|system|process)/i,
  ];

  for (const pattern of taskContentPatterns) {
    if (pattern.test(lowerQ)) {
      return true;
    }
  }

  // Default: if contains action verbs without question words, likely a task
  const hasActionVerb = /\b(need|want|help|handle|solve|fix|create|make|process|analyze|determine|research|find|plan|design|develop|review|assess|evaluate|prepare|generate|build)\b/i.test(lowerQ);
  const hasQuestionWord = /^(what|when|where|who|why|how are|how is|how do|how does)\b/i.test(lowerQ);

  return hasActionVerb && !hasQuestionWord;
}

// Split message into multiple tasks if it contains multiple instructions
function splitIntoTasks(message: string): string[] {
  // Split on common delimiters
  const lines = message.split(/\n+/).filter(line => line.trim());

  // If only one line, return as-is
  if (lines.length === 1) {
    return [message];
  }

  // Check if lines are numbered or bulleted (multiple tasks)
  const numberedPattern = /^\s*(\d+[\.\)]\s*|[-•*]\s*)/;
  const hasNumbering = lines.filter(line => numberedPattern.test(line)).length > 1;

  if (hasNumbering) {
    // Return each numbered/bulleted item as separate task
    return lines
      .map(line => line.replace(numberedPattern, '').trim())
      .filter(line => line.length > 10); // Filter out very short items
  }

  // If no clear numbering, check if multiple sentences with task patterns
  const sentences = message.split(/[.!]\s+/).filter(s => s.trim());
  if (sentences.length > 1) {
    const tasks = sentences.filter(s => isTaskRequest(s));
    if (tasks.length > 1) {
      return tasks;
    }
  }

  // Default: treat as single task
  return [message];
}

export async function POST(request: NextRequest) {
  try {
    const { question, executions, company } = await request.json();

    if (!question || !question.trim()) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    // Check if this is a company creation request
    const creationCheck = isCompanyCreationRequest(question);
    if (creationCheck.isRequest) {
      return NextResponse.json({
        type: 'company_creation',
        industry: creationCheck.industry,
        description: creationCheck.description,
        response: `I'll help you create a ${creationCheck.industry} company. Let me generate the department structure...`
      });
    }

    // Check if this is a department creation request
    const departmentCheck = isDepartmentCreationRequest(question);
    if (departmentCheck.isRequest) {
      if (!company) {
        return NextResponse.json({
          response: 'You need to create a company first before adding departments. Try saying "Create a company for [industry]".'
        });
      }
      return NextResponse.json({
        type: 'department_creation',
        description: departmentCheck.description,
        response: `I'll help you create that department. Let me design the employees and workflow...`
      });
    }

    // Check if this is a task to execute
    if (company && isTaskRequest(question)) {
      // Use AI to parse and route tasks intelligently
      try {
        const parseResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/parse-tasks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: question, company }),
        });

        if (parseResponse.ok) {
          const parsed = await parseResponse.json();

          if (parsed.tasks && parsed.tasks.length > 0) {
            if (parsed.tasks.length > 1) {
              // Multiple tasks to different departments
              return NextResponse.json({
                type: 'task_execution_smart',
                parsedTasks: parsed.tasks,
                response: `I identified ${parsed.tasks.length} tasks for different departments. Executing now...`
              });
            } else {
              // Single task
              return NextResponse.json({
                type: 'task_execution_smart',
                parsedTasks: parsed.tasks,
                response: `I'll route this to ${parsed.tasks[0].department} and get it done.`
              });
            }
          }
        }
      } catch (parseError) {
        console.error('Task parsing failed, falling back to simple routing:', parseError);
      }

      // Fallback to simple routing if AI parsing fails
      return NextResponse.json({
        type: 'task_execution',
        task: question,
        response: `I'll route this task to the appropriate department and get it done. One moment...`
      });
    }

    // Build context from company and executions
    let contextText = '';

    if (company) {
      contextText = `You are the CEO of "${company.name}", a ${company.industry} company.\n\n`;

      // Read company.md for detailed context
      try {
        const filePath = join(process.cwd(), 'public', 'company.md');
        const companyDoc = readFileSync(filePath, 'utf-8');
        contextText += `=== COMPANY KNOWLEDGE BASE ===\n${companyDoc}\n\n=== END KNOWLEDGE BASE ===\n\n`;
      } catch (error) {
        console.error('Failed to read company.md:', error);
      }

      contextText += `Departments:\n`;
      company.departments.forEach((dept: any) => {
        contextText += `- ${dept.name}: ${dept.description}\n`;
        if (dept.agent) {
          contextText += `  Agent: ${dept.agent.data.name}\n`;
        }
        if (dept.parentId) {
          const parent = company.departments.find((d: any) => d.id === dept.parentId);
          if (parent) {
            contextText += `  (Subdepartment of ${parent.name})\n`;
          }
        }
      });
      contextText += '\n';
    }

    // Build context from executions
    if (executions && executions.length > 0) {
      contextText += `Work history:\n\n`;

      executions.slice(0, 10).forEach((exec: any, idx: number) => {
        contextText += `${idx + 1}. ${exec.workflowName}\n`;
        contextText += `   Task: ${exec.input}\n`;
        contextText += `   Status: ${exec.status}\n`;
        contextText += `   Time: ${new Date(exec.createdAt).toLocaleString()}\n`;

        if (exec.results && exec.results.length > 0) {
          contextText += `   Results:\n`;
          exec.results.forEach((result: any) => {
            contextText += `     - ${result.agentName}: ${result.output.slice(0, 200)}${result.output.length > 200 ? '...' : ''}\n`;
          });
        }

        if (exec.feedback) {
          contextText += `   CEO Feedback: ${exec.feedback.rating}/5 stars - ${exec.feedback.comment}\n`;
        }

        contextText += `\n`;
      });
    } else {
      if (!company) {
        contextText += 'No company has been created yet. You can ask me to create one!';
      } else {
        contextText += 'No work has been done yet. The company is just getting started!';
      }
    }

    const prompt = `You are an executive assistant for a CEO managing an AI company. The CEO has departments made of AI agents that complete tasks.

${contextText}

CEO's question: "${question}"

You can help the CEO with:
- Analyzing the company knowledge base to understand goals, problems, and current work
- Identifying what needs to be done based on company goals and department work
- Information about departments and their agents
- Reviewing work history and performance
- Suggesting improvements and next steps
- Answering questions about the company structure

When the CEO asks "What do I need to do?" or similar questions:
1. Review the company's Current Goals and Current Problems from the knowledge base
2. Check each department's Current Work and Learnings & Insights
3. Identify gaps or areas that need attention
4. Provide a clear, actionable summary organized by department
5. Suggest specific tasks that would help achieve goals or solve problems

If the CEO wants to modify departments (add/remove employees, create subdepartments, etc.), acknowledge their request and let them know they can use natural language to make changes.

Provide a helpful, concise response as the CEO's assistant. Be professional but friendly.`;

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

    const response = message.content[0].type === 'text' ? message.content[0].text : 'I apologize, I could not generate a response.';

    // Extract and update knowledge base from conversation
    try {
      await updateKnowledgeBase(question, response, company);
    } catch (kbError) {
      console.error('Failed to update knowledge base:', kbError);
      // Don't fail the request if KB update fails
    }

    return NextResponse.json({ response });
  } catch (error) {
    console.error('CEO chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process question' },
      { status: 500 }
    );
  }
}

// Extract insights from conversation and update knowledge base
async function updateKnowledgeBase(question: string, response: string, company: any) {
  if (!company) return; // Can't update KB without a company

  const analysisPrompt = `Analyze this CEO conversation and extract any important company information that should be added to the knowledge base.

CEO Question: "${question}"
Assistant Response: "${response}"

Extract (if mentioned):
1. New goals or objectives
2. Current problems or challenges
3. Important insights or decisions
4. Changes to company mission or strategy

Respond in JSON format:
{
  "goals": ["list of new goals mentioned"],
  "problems": ["list of problems identified"],
  "insights": ["list of key insights or decisions"],
  "mission": "new mission if mentioned, otherwise null"
}

If nothing important was mentioned, return empty arrays.`;

  const analysisMessage = await anthropic.messages.create({
    model: 'claude-3-haiku-20240307',
    max_tokens: 512,
    messages: [
      {
        role: 'user',
        content: analysisPrompt,
      },
    ],
  });

  const analysisText = analysisMessage.content[0].type === 'text' ? analysisMessage.content[0].text : '{}';

  // Extract JSON from response (Claude might wrap it in markdown)
  const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return;

  const extracted = JSON.parse(jsonMatch[0]);

  // Update company.md
  const filePath = join(process.cwd(), 'public', 'company.md');
  let content = readFileSync(filePath, 'utf-8');
  let updated = false;

  // Add new goals
  if (extracted.goals && extracted.goals.length > 0) {
    for (const goal of extracted.goals) {
      content = addGoalToOverview(content, goal);
      updated = true;
    }
  }

  // Add new problems
  if (extracted.problems && extracted.problems.length > 0) {
    for (const problem of extracted.problems) {
      content = addProblemToOverview(content, problem);
      updated = true;
    }
  }

  // Update mission if mentioned
  if (extracted.mission) {
    content = updateMission(content, extracted.mission);
    updated = true;
  }

  // Save if any updates were made
  if (updated) {
    // Update last updated date
    content = content.replace(
      /\*\*Last Updated:\*\* .+/,
      `**Last Updated:** ${new Date().toISOString().split('T')[0]}`
    );
    writeFileSync(filePath, content, 'utf-8');
  }
}

function addGoalToOverview(content: string, goal: string): string {
  const lines = content.split('\n');
  const goalsIndex = lines.findIndex(line => line.includes('**Current Goals:**'));
  if (goalsIndex === -1) return content;

  let insertIndex = goalsIndex + 1;
  while (insertIndex < lines.length && lines[insertIndex].trim().startsWith('-')) {
    insertIndex++;
  }

  if (lines[goalsIndex + 1]?.includes('None set yet')) {
    lines.splice(goalsIndex + 1, 1);
    insertIndex = goalsIndex + 1;
  }

  lines.splice(insertIndex, 0, `- ${goal}`);
  return lines.join('\n');
}

function addProblemToOverview(content: string, problem: string): string {
  const lines = content.split('\n');
  const problemsIndex = lines.findIndex(line => line.includes('**Current Problems:**'));
  if (problemsIndex === -1) return content;

  let insertIndex = problemsIndex + 1;
  while (insertIndex < lines.length && lines[insertIndex].trim().startsWith('-')) {
    insertIndex++;
  }

  if (lines[problemsIndex + 1]?.includes('None identified yet')) {
    lines.splice(problemsIndex + 1, 1);
    insertIndex = problemsIndex + 1;
  }

  lines.splice(insertIndex, 0, `- ${problem}`);
  return lines.join('\n');
}

function updateMission(content: string, mission: string): string {
  return content.replace(
    /\*\*Mission:\*\* .+/,
    `**Mission:** ${mission}`
  );
}
