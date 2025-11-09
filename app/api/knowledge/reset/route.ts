import { NextRequest, NextResponse } from 'next/server';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { resetVectorStore } from '@/lib/vectorStore';

export async function POST(req: NextRequest) {
  try {
    const filePath = join(process.cwd(), 'public', 'company.md');

    // Reset to clean template
    const cleanTemplate = `# Company Overview
**Industry:** Not yet defined
**Mission:** Not yet defined
`;

    writeFileSync(filePath, cleanTemplate, 'utf-8');

    // Reset vector store
    resetVectorStore();
    console.log('Company knowledge base and vector store reset');

    return NextResponse.json({
      success: true,
      message: 'Knowledge base reset successfully'
    });
  } catch (error) {
    console.error('Error resetting knowledge base:', error);
    return NextResponse.json(
      { error: 'Failed to reset knowledge base' },
      { status: 500 }
    );
  }
}
