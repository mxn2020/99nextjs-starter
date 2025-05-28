import { Index } from '@upstash/vector';

export interface VectorMetadata {
  id: string;
  text?: string;
  [key: string]: any;
}

export const upstashVector = new Index<VectorMetadata>({
  url: process.env.UPSTASH_VECTOR_REST_URL!,
  token: process.env.UPSTASH_VECTOR_REST_TOKEN!,
});

// Helper functions for common vector operations
export const upstashVectorHelpers = {
  async upsert(
    id: string, 
    vector: number[], 
    metadata?: VectorMetadata
  ): Promise<void> {
    await upstashVector.upsert({
      id,
      vector,
      metadata: metadata || { id },
    });
  },

  async query(
    vector: number[], 
    topK: number = 10,
    filter?: any
  ): Promise<any> {
    return await upstashVector.query({
      vector,
      topK,
      filter,
      includeMetadata: true,
      includeVectors: false,
    });
  },

  async deleteVector(id: string): Promise<void> {
    await upstashVector.delete(id);
  },

  async fetch(ids: string[]): Promise<any> {
    return await upstashVector.fetch(ids, {
      includeMetadata: true,
      includeVectors: false,
    });
  },
};