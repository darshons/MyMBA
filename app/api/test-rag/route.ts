import { NextRequest, NextResponse } from 'next/server';
import { chunkCompanyDocument, searchChunks } from '@/lib/rag';
import { getVectorStore } from '@/lib/vectorStore';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || 'marketing strategy';

    // Get chunks and build vector store
    const chunks = chunkCompanyDocument();
    const vectorStore = getVectorStore(chunks);
    const stats = vectorStore.getStats();

    // Perform search
    const results = searchChunks(query, { limit: 5 });

    return NextResponse.json({
      success: true,
      query,
      stats,
      results: results.map(chunk => ({
        id: chunk.id,
        section: chunk.metadata.section,
        department: chunk.metadata.department,
        type: chunk.metadata.type,
        preview: chunk.content.substring(0, 150) + '...',
        fullContent: chunk.content,
      })),
    });
  } catch (error) {
    console.error('RAG test error:', error);
    return NextResponse.json(
      {
        error: 'Test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
