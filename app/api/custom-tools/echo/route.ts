import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = typeof body?.input === 'string' ? body.input : JSON.stringify(body?.input ?? {});
    const context = body?.context;

    const summaryLines = [
      `Input Recap: ${input || '(empty input)'}`,
      context ? `Context Hint: ${context}` : null,
      `Received At: ${new Date().toISOString()}`,
    ].filter(Boolean) as string[];

    return NextResponse.json({
      success: true,
      message: 'Sample echo tool executed successfully.',
      summary: summaryLines.join('\n'),
      recommendedNextActions: [
        'Log this insight in the knowledge base',
        'Share findings with the Customer Experience team',
      ],
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Invalid JSON payload. Ensure you send { "input": "...", "context": "..." }',
      },
      { status: 400 }
    );
  }
}
