import { readFileSync } from 'fs';
import { join } from 'path';
import { getVectorStore } from './vectorStore';

export interface DocumentChunk {
  id: string;
  content: string;
  metadata: {
    section: string;
    department?: string;
    type: 'goal' | 'problem' | 'learning' | 'general';
  };
}

/**
 * Chunks the company.md file into searchable segments
 */
export function chunkCompanyDocument(): DocumentChunk[] {
  const filePath = join(process.cwd(), 'public', 'company.md');
  const content = readFileSync(filePath, 'utf-8');

  const chunks: DocumentChunk[] = [];
  const lines = content.split('\n');

  let currentSection = 'Overview';
  let currentDepartment: string | undefined;
  let currentType: 'goal' | 'problem' | 'learning' | 'general' = 'general';
  let currentContent: string[] = [];
  let chunkId = 0;

  const flushChunk = () => {
    if (currentContent.length > 0) {
      const text = currentContent.join('\n').trim();
      if (text.length > 20) { // Only add meaningful chunks
        chunks.push({
          id: `chunk_${chunkId++}`,
          content: text,
          metadata: {
            section: currentSection,
            department: currentDepartment,
            type: currentType,
          },
        });
      }
      currentContent = [];
    }
  };

  for (const line of lines) {
    // Detect H1 headers (Company Overview)
    if (line.startsWith('# ')) {
      flushChunk();
      const sectionName = line.replace('# ', '').trim();
      currentSection = sectionName;
      currentDepartment = undefined;
      currentType = 'general';
      continue;
    }

    // Detect H2 headers (Departments)
    if (line.startsWith('## ')) {
      flushChunk();
      const sectionName = line.replace('## ', '').trim();
      currentSection = sectionName;
      currentDepartment = sectionName;
      currentType = 'general';
      continue;
    }

    // Detect H3 headers (subsections like Past work)
    if (line.startsWith('### ')) {
      flushChunk();
      const subsection = line.replace('### ', '').trim().toLowerCase();

      // Determine chunk type based on subsection name
      if (subsection.includes('past work')) {
        currentType = 'learning'; // Past work is like learnings
      } else {
        currentType = 'general';
      }
      continue;
    }

    // Add content to current chunk
    if (line.trim()) {
      currentContent.push(line);
    } else if (currentContent.length > 0) {
      // Empty line - potential chunk boundary
      flushChunk();
    }
  }

  // Flush any remaining content
  flushChunk();

  return chunks;
}

/**
 * Search for relevant chunks using vector similarity (semantic search)
 */
export function searchChunks(query: string, options?: {
  department?: string;
  type?: 'goal' | 'problem' | 'learning' | 'general';
  limit?: number;
  threshold?: number;
}): DocumentChunk[] {
  const allChunks = chunkCompanyDocument();
  const vectorStore = getVectorStore(allChunks);

  return vectorStore.search(query, {
    department: options?.department,
    type: options?.type,
    limit: options?.limit || 5,
    threshold: options?.threshold || 0.1,
  });
}

/**
 * Get all chunks for a specific department
 */
export function getDepartmentChunks(departmentName: string): DocumentChunk[] {
  const allChunks = chunkCompanyDocument();
  return allChunks.filter(
    chunk => chunk.metadata.department?.toLowerCase().includes(departmentName.toLowerCase())
  );
}
