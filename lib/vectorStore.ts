import { DocumentChunk } from './rag';

/**
 * TF-IDF Vector representation
 */
export interface VectorDocument {
  chunk: DocumentChunk;
  vector: Map<string, number>;
  magnitude: number;
}

/**
 * Stop words to filter out
 */
const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
  'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
  'to', 'was', 'will', 'with', 'the', 'this', 'but', 'they', 'have',
]);

/**
 * Tokenize text into words
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !STOP_WORDS.has(word));
}

/**
 * Calculate term frequency for a document
 */
function calculateTF(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  const totalTokens = tokens.length;

  for (const token of tokens) {
    tf.set(token, (tf.get(token) || 0) + 1);
  }

  // Normalize by total tokens
  for (const [term, count] of tf.entries()) {
    tf.set(term, count / totalTokens);
  }

  return tf;
}

/**
 * Calculate inverse document frequency
 */
function calculateIDF(documents: string[][]): Map<string, number> {
  const idf = new Map<string, number>();
  const totalDocs = documents.length;

  // Count documents containing each term
  const docFrequency = new Map<string, number>();
  for (const doc of documents) {
    const uniqueTerms = new Set(doc);
    for (const term of uniqueTerms) {
      docFrequency.set(term, (docFrequency.get(term) || 0) + 1);
    }
  }

  // Calculate IDF
  for (const [term, freq] of docFrequency.entries()) {
    idf.set(term, Math.log(totalDocs / freq));
  }

  return idf;
}

/**
 * Calculate vector magnitude
 */
function calculateMagnitude(vector: Map<string, number>): number {
  let sumSquares = 0;
  for (const value of vector.values()) {
    sumSquares += value * value;
  }
  return Math.sqrt(sumSquares);
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(
  vec1: Map<string, number>,
  mag1: number,
  vec2: Map<string, number>,
  mag2: number
): number {
  if (mag1 === 0 || mag2 === 0) return 0;

  let dotProduct = 0;
  for (const [term, value1] of vec1.entries()) {
    const value2 = vec2.get(term) || 0;
    dotProduct += value1 * value2;
  }

  return dotProduct / (mag1 * mag2);
}

/**
 * Vector Store for semantic search
 */
export class VectorStore {
  private documents: VectorDocument[] = [];
  private idf: Map<string, number> = new Map();

  constructor(chunks: DocumentChunk[]) {
    this.buildIndex(chunks);
  }

  /**
   * Build TF-IDF index from document chunks
   */
  private buildIndex(chunks: DocumentChunk[]): void {
    // Tokenize all documents
    const allTokens = chunks.map(chunk => tokenize(chunk.content));

    // Calculate IDF across all documents
    this.idf = calculateIDF(allTokens);

    // Create TF-IDF vectors for each document
    this.documents = chunks.map((chunk, idx) => {
      const tokens = allTokens[idx];
      const tf = calculateTF(tokens);
      const tfidf = new Map<string, number>();

      // Calculate TF-IDF for each term
      for (const [term, tfValue] of tf.entries()) {
        const idfValue = this.idf.get(term) || 0;
        tfidf.set(term, tfValue * idfValue);
      }

      return {
        chunk,
        vector: tfidf,
        magnitude: calculateMagnitude(tfidf),
      };
    });
  }

  /**
   * Search for similar documents using vector similarity
   */
  search(query: string, options?: {
    department?: string;
    type?: 'goal' | 'problem' | 'learning' | 'general';
    limit?: number;
    threshold?: number;
  }): DocumentChunk[] {
    const limit = options?.limit || 5;
    const threshold = options?.threshold || 0.1;

    // Filter documents by metadata if specified
    let candidates = this.documents;
    if (options?.department) {
      candidates = candidates.filter(doc =>
        doc.chunk.metadata.department?.toLowerCase().includes(options.department!.toLowerCase())
      );
    }
    if (options?.type) {
      candidates = candidates.filter(doc => doc.chunk.metadata.type === options.type);
    }

    // Vectorize query
    const queryTokens = tokenize(query);
    const queryTF = calculateTF(queryTokens);
    const queryVector = new Map<string, number>();

    for (const [term, tfValue] of queryTF.entries()) {
      const idfValue = this.idf.get(term) || 0;
      queryVector.set(term, tfValue * idfValue);
    }

    const queryMagnitude = calculateMagnitude(queryVector);

    // Calculate similarity scores
    const results = candidates.map(doc => ({
      chunk: doc.chunk,
      similarity: cosineSimilarity(queryVector, queryMagnitude, doc.vector, doc.magnitude),
    }));

    // Sort by similarity and filter by threshold
    results.sort((a, b) => b.similarity - a.similarity);

    return results
      .filter(r => r.similarity >= threshold)
      .slice(0, limit)
      .map(r => r.chunk);
  }

  /**
   * Get statistics about the vector store
   */
  getStats() {
    return {
      totalDocuments: this.documents.length,
      vocabularySize: this.idf.size,
      averageVectorSize: this.documents.reduce((sum, doc) => sum + doc.vector.size, 0) / this.documents.length,
    };
  }
}

/**
 * Global vector store instance (singleton pattern)
 */
let globalVectorStore: VectorStore | null = null;

/**
 * Initialize or get the global vector store
 */
export function getVectorStore(chunks: DocumentChunk[]): VectorStore {
  if (!globalVectorStore) {
    console.log('Initializing vector store...');
    globalVectorStore = new VectorStore(chunks);
    console.log('Vector store initialized:', globalVectorStore.getStats());
  }
  return globalVectorStore;
}

/**
 * Reset the global vector store (useful for updates)
 */
export function resetVectorStore(): void {
  globalVectorStore = null;
}
