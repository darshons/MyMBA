import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { task, targetAgent, delegatingAgent, company, customTools } = body;

    if (!task || !targetAgent || !company) {
      return NextResponse.json(
        { error: 'Missing required fields: task, targetAgent, or company' },
        { status: 400 }
      );
    }

    // Find the target agent in the company structure
    const targetDepartment = company.departments?.find(
      (dept: any) => dept.agent && (
        dept.agent.data.name === targetAgent ||
        dept.name === targetAgent ||
        dept.agent.id === targetAgent
      )
    );

    if (!targetDepartment || !targetDepartment.agent) {
      return NextResponse.json(
        { error: `Agent "${targetAgent}" not found in company` },
        { status: 404 }
      );
    }

    // Add context about delegation
    const delegationContext = delegatingAgent
      ? `\n\n[DELEGATION] You are being asked to help with a subtask by ${delegatingAgent}. Please focus on: ${task}`
      : '';

    const taskWithContext = task + delegationContext;

    // Call execute API for the target agent
    const executeResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: taskWithContext,
        agent: targetDepartment.agent,
        workflowName: targetDepartment.name,
        customTools: customTools || [],
      }),
    });

    if (!executeResponse.ok) {
      throw new Error(`Failed to execute task with ${targetAgent}`);
    }

    const reader = executeResponse.body?.getReader();
    if (!reader) {
      throw new Error('No response stream available');
    }

    let fullOutput = '';
    const decoder = new TextDecoder();

    // Read the stream
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'result') {
              fullOutput = data.result.output;
            }
          } catch (e) {
            // Skip malformed JSON
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      agent: targetDepartment.agent.data.name,
      department: targetDepartment.name,
      output: fullOutput,
    });
  } catch (error) {
    console.error('Delegation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Delegation failed' },
      { status: 500 }
    );
  }
}
