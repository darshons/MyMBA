import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(
  request: NextRequest,
  { params }: { params: { departmentId: string } }
) {
  try {
    const departmentId = params.departmentId;
    const body = await request.json();

    // Extract input from webhook payload
    const input = body.input || body.text || body.message || JSON.stringify(body);

    // Log webhook trigger
    console.log(`Webhook triggered for department: ${departmentId}`);
    console.log(`Input: ${input}`);

    // Return success - actual execution happens client-side for now
    // In a production app, this would trigger a background job
    return NextResponse.json({
      success: true,
      message: 'Webhook received successfully',
      departmentId,
      input: input.substring(0, 200), // Preview
      timestamp: new Date().toISOString(),
      note: 'For demo purposes, please trigger execution via the UI. Production version would execute in background.'
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { 
        error: 'Webhook processing failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to show webhook info
export async function GET(
  request: NextRequest,
  { params }: { params: { departmentId: string } }
) {
  return NextResponse.json({
    departmentId: params.departmentId,
    webhookUrl: `${request.nextUrl.origin}/api/webhooks/${params.departmentId}`,
    method: 'POST',
    contentType: 'application/json',
    example: {
      input: 'Your task or data here'
    },
    curlExample: `curl -X POST ${request.nextUrl.origin}/api/webhooks/${params.departmentId} \\
  -H "Content-Type: application/json" \\
  -d '{"input": "Process this lead: John Doe from Acme Corp"}'`
  });
}
