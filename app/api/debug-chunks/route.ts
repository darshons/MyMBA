import { NextResponse } from 'next/server';
import { chunkCompanyDocument } from '@/lib/rag';

export async function GET() {
  try {
    const chunks = chunkCompanyDocument();

    // Filter to just learning (Past work) chunks
    const learningChunks = chunks.filter(c => c.metadata.type === 'learning');

    return NextResponse.json({
      totalChunks: chunks.length,
      learningChunks: learningChunks.length,
      chunks: learningChunks.map(c => ({
        id: c.id,
        section: c.metadata.section,
        department: c.metadata.department,
        type: c.metadata.type,
        contentPreview: c.content.substring(0, 200),
        contentLength: c.content.length,
      })),
      fullChunks: learningChunks, // Include full content for debugging
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to debug chunks', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
