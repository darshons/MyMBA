import { NextRequest, NextResponse } from 'next/server';
import { searchChunks, getDepartmentChunks } from '@/lib/rag';

export async function POST(request: NextRequest) {
  try {
    const { query, department, type, limit } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Search for relevant chunks
    const chunks = searchChunks(query, {
      department,
      type,
      limit: limit || 5,
    });

    return NextResponse.json({
      success: true,
      chunks,
      count: chunks.length,
    });
  } catch (error) {
    console.error('RAG search error:', error);
    return NextResponse.json(
      {
        error: 'Failed to search knowledge base',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const department = searchParams.get('department');

    if (!department) {
      return NextResponse.json(
        { error: 'Department name is required' },
        { status: 400 }
      );
    }

    // Get all chunks for a department
    const chunks = getDepartmentChunks(department);

    return NextResponse.json({
      success: true,
      chunks,
      count: chunks.length,
    });
  } catch (error) {
    console.error('RAG retrieval error:', error);
    return NextResponse.json(
      {
        error: 'Failed to retrieve department knowledge',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
