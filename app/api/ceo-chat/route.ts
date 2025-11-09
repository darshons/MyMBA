import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { searchChunks } from '@/lib/rag';
import { resetVectorStore } from '@/lib/vectorStore';
import { AVAILABLE_TOOLS, executeToolCall } from '@/lib/tools';
import type { CustomToolDefinition } from '@/types/customTool';

export const runtime = 'nodejs';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

// Detect if question is requesting company creation
function isCompanyCreationRequest(question: string): { isRequest: boolean; industry?: string; description?: string } {
  const lowerQ = question.toLowerCase();

  // Only match if asking to create a NEW company (not mentioning existing company)
  // Must have explicit creation verbs + "company" without "agent/employee" in between

  // Check if this mentions agent/employee (then it's NOT company creation)
  if (/(?:agent|employee|worker|person|hire|staff)/i.test(question)) {
    return { isRequest: false };
  }

  // Match patterns like:
  // "create a dog grooming company"
  // "build a tech company"
  // "start an e-commerce company"
  const simplePattern = /^(?:create|make|build|start|i want to (?:create|make|build|start))(?:\s+a|\s+an|\s+my)?\s+(.+?)\s+company/i;
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
  // But NOT "create agent for my company"
  const patterns = [
    /^(?:create|make|build|start)\s+(?:a\s+)?(?:new\s+)?company\s+(?:for|in|about)\s+([^.!?]+)/i,
    /^i (?:want|need)\s+(?:to\s+)?(?:create|make|build|start)\s+(?:a\s+)?company/i,
  ];

  for (const pattern of patterns) {
    const match = question.match(pattern);
    if (match) {
      return {
        isRequest: true,
        industry: match[1]?.trim() || lowerQ,
        description: question,
      };
    }
  }

  return { isRequest: false };
}

// Detect if question is requesting agent/employee creation
function isAgentCreationRequest(question: string): { isRequest: boolean; description?: string } {
  const lowerQ = question.toLowerCase();

  const patterns = [
    // Explicit creation commands
    /(?:create|make|build|add|hire)\s+(?:a|an|new|another)?\s*(?:agent|employee|worker|person|department)/i,

    // "I want/need an agent"
    /(?:i\s+)?(?:want|need)\s+(?:a|an|to add|to create)?\s*(?:new\s+)?(?:agent|employee)/i,

    // "new agent for X"
    /(?:new|another)\s+(?:agent|employee).*(?:for|to|that)/i,

    // Starting with "agent" or "employee"
    /^(?:agent|employee)\s+(?:for|to handle|that)/i,
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

// Detect if question is requesting task generation
function isTaskGenerationRequest(question: string): boolean {
  const lowerQ = question.toLowerCase();

  const patterns = [
    /(?:generate|create|make).*tasks?.*(?:for|from).*(?:employees?|agents?|departments?|company)/i,
    /(?:come up with|suggest|propose).*tasks?.*(?:for|from).*(?:employees?|agents?|departments?)/i,
    /(?:what|which).*tasks?.*(?:should|can|need).*(?:employees?|agents?|departments?)/i,
    /(?:employees?|agents?|departments?).*(?:need|should|can).*(?:do|work on|tasks?)/i,
  ];

  return patterns.some(pattern => pattern.test(lowerQ));
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
    const { question, executions, company, customTools } = await request.json();

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
        response: `I'll help you create a ${creationCheck.industry} company. Let me generate your team structure...`
      });
    }

    // Check if this is an agent creation request
    const agentCheck = isAgentCreationRequest(question);
    if (agentCheck.isRequest) {
      return NextResponse.json({
        type: 'agent_creation',
        description: agentCheck.description,
        response: `I'll help you create that agent. Let me design their role and responsibilities...`
      });
    }

    // Check if this is a task generation request
    if (isTaskGenerationRequest(question)) {
      return NextResponse.json({
        type: 'task_generation',
        response: `I'll analyze the company document and generate tasks for all employees...`
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

      // Use RAG to find relevant company knowledge based on the question
      try {
        // Check if this is a status/summary question
        const isStatusQuery = /what.*done|progress|status|summar|completed|accomplish/i.test(question);

        // Check if this is asking about notes
        const isNotesQuery = /note|sticky|idea|wrote|written|jot/i.test(question);

        let relevantChunks = searchChunks(question, {
          limit: isStatusQuery ? 10 : 5,
          threshold: isStatusQuery ? 0.01 : 0.05, // Very low threshold for status queries
        });

        // For status queries, ALWAYS fetch "learning" type chunks (Past work)
        if (isStatusQuery) {
          const pastWorkChunks = searchChunks('past work completed tasks history', {
            type: 'learning',
            limit: 20,
            threshold: 0.01,
          });
          // Merge and deduplicate
          const existingIds = new Set(relevantChunks.map(c => c.id));
          pastWorkChunks.forEach(chunk => {
            if (!existingIds.has(chunk.id)) {
              relevantChunks.push(chunk);
            }
          });
        }

        // For notes queries, explicitly fetch all note chunks
        if (isNotesQuery) {
          const noteChunks = searchChunks('notes sticky ideas', {
            type: 'note',
            limit: 20,
            threshold: 0.01,
          });
          // Merge and deduplicate
          const existingIds = new Set(relevantChunks.map(c => c.id));
          noteChunks.forEach(chunk => {
            if (!existingIds.has(chunk.id)) {
              relevantChunks.push(chunk);
            }
          });
        }

        if (relevantChunks.length > 0) {
          contextText += `=== RELEVANT COMPANY KNOWLEDGE ===\n`;
          relevantChunks.forEach((chunk, idx) => {
            contextText += `\n[${idx + 1}] ${chunk.metadata.section}`;
            if (chunk.metadata.department) {
              contextText += ` - ${chunk.metadata.department}`;
            }
            contextText += ` (${chunk.metadata.type}):\n${chunk.content}\n`;
          });
          contextText += `\n=== END KNOWLEDGE ===\n\n`;
        }
      } catch (error) {
        console.error('Failed to search company knowledge:', error);
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

    // Build context from executions (recent session data)
    if (executions && executions.length > 0) {
      contextText += `Recent work history from this session:\n\n`;

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
    }

    // Note: Full work history is available in the RELEVANT COMPANY KNOWLEDGE section above
    contextText += `\nNote: Complete work history for all departments is available in the company knowledge base above.\n`;

    const prompt = `You are an executive assistant for a CEO managing an AI company. The CEO has departments made of AI agents that complete tasks.

IMPORTANT CONSTRAINTS:
- ONLY use information from the context provided below
- DO NOT make assumptions about time of day, dates, or any information not in the context
- DO NOT make up or hallucinate information
- If you don't have information to answer a question, say "I don't have that information in the company knowledge base"
- Base ALL responses on: RAG knowledge base (especially "Past work" sections and "Notes"), work history, and visible agents/departments
- The "RELEVANT COMPANY KNOWLEDGE" section contains the actual work completed by departments and notes from sticky notes - USE THIS as your primary source

AVAILABLE CONTEXT:
${contextText}

CEO's question: "${question}"

You can help the CEO with:
- Summarizing work completed by departments (found in "Past work" sections of company knowledge)
- Referencing notes and ideas (found in "Notes" section - these come from sticky notes on the canvas)
- Analyzing department activity and productivity
- Information about departments and their agents
- Reviewing work history and performance
- Suggesting improvements and next steps based ONLY on provided context
- Answering questions about the company structure

When the CEO asks "What has been done?" or "Summarize progress":
1. Check the RELEVANT COMPANY KNOWLEDGE section for each department's "Past work"
2. Summarize what each department has accomplished based on their Past work entries
3. If a department has "No work completed yet", state that clearly
4. Provide a department-by-department summary

When the CEO asks about notes, ideas, or references sticky notes:
1. Check the RELEVANT COMPANY KNOWLEDGE section for "Notes" entries
2. These notes come from sticky notes placed on the workflow canvas
3. Summarize relevant notes that match the CEO's question

If the CEO wants to modify departments (add/remove employees, create subdepartments, etc.), acknowledge their request and let them know they can use natural language to make changes.

Provide a helpful, concise response. Be professional and factual. Never greet with time-specific phrases (like "good morning/afternoon/evening") - you don't know what time it is.

You have access to various tools to help answer questions. Use web_search, multi_web_search, industry_research, and other tools as needed to provide accurate, up-to-date information.`;

    // Build tool map (built-in + custom tools)
    const sanitizedCustomTools = (customTools || []).map((tool: CustomToolDefinition) => ({
      id: tool.id,
      name: tool.name,
      description: tool.description,
      endpoint: tool.endpoint,
      authType: tool.authType,
      authValue: tool.authValue,
    }));

    const { toolDefinitions: customToolDefs, toolMap } = buildCustomToolDefinitions(sanitizedCustomTools);
    const allTools = [...AVAILABLE_TOOLS, ...customToolDefs];

    // Use tool calling loop
    const messages: Anthropic.MessageParam[] = [
      {
        role: 'user',
        content: prompt,
      },
    ];

    let finalResponse = '';
    let turnCount = 0;
    const maxTurns = 10;

    while (turnCount < maxTurns) {
      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        messages,
        tools: allTools as any[],
      });

      // Check if we got a text response
      const textBlock = message.content.find(block => block.type === 'text');
      if (textBlock && textBlock.type === 'text') {
        finalResponse = textBlock.text;
      }

      // Check if there are tool uses
      const toolUses = message.content.filter(block => block.type === 'tool_use');

      if (toolUses.length === 0) {
        // No more tool uses, we're done
        break;
      }

      // Add assistant message to conversation
      messages.push({
        role: 'assistant',
        content: message.content,
      });

      // Execute all tool calls
      const toolResults = await Promise.all(
        toolUses.map(async (toolUse: any) => {
          try {
            const result = await executeToolCall(
              toolUse.name,
              toolUse.input,
              toolMap,
              {
                company,
                agentName: 'CEO Assistant',
                customToolsArray: sanitizedCustomTools,
              }
            );

            return {
              type: 'tool_result' as const,
              tool_use_id: toolUse.id,
              content: result,
            };
          } catch (error) {
            return {
              type: 'tool_result' as const,
              tool_use_id: toolUse.id,
              content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
              is_error: true,
            };
          }
        })
      );

      // Add tool results to conversation
      messages.push({
        role: 'user',
        content: toolResults,
      });

      turnCount++;
    }

    const response = finalResponse || 'I apologize, I could not generate a response.';

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
- Changes to company mission or strategy

Respond in JSON format:
{
  "mission": "new mission if mentioned, otherwise null"
}

If nothing important was mentioned, return null mission.`;

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

  // Update mission if mentioned
  if (extracted.mission) {
    content = updateMission(content, extracted.mission);
    writeFileSync(filePath, content, 'utf-8');

    // Reset vector store so RAG picks up the new information
    resetVectorStore();
    console.log('Knowledge base updated from chat conversation');
  }
}

function updateMission(content: string, mission: string): string {
  return content.replace(
    /\*\*Mission:\*\* .+/,
    `**Mission:** ${mission}`
  );
}

function buildCustomToolDefinitions(customTools: CustomToolDefinition[]) {
  const definitions: any[] = [];
  const toolMap = new Map<string, CustomToolDefinition>();

  customTools.forEach(tool => {
    const toolName = `custom_tool_${tool.id}`;
    toolMap.set(toolName, tool);

    definitions.push({
      name: toolName,
      description: `${tool.description} (User-defined tool)`,
      input_schema: {
        type: 'object',
        properties: {
          input: {
            type: 'string',
            description: 'Primary input or payload for this tool',
          },
          context: {
            type: 'string',
            description: 'Optional additional context or metadata',
          },
        },
        required: ['input'],
      },
    });
  });

  return { toolDefinitions: definitions, toolMap };
}
