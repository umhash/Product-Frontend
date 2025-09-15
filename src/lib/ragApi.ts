import api from './api';

export interface RAGProcessingStatus {
  PENDING: 'pending';
  PROCESSING: 'processing';
  COMPLETED: 'completed';
  FAILED: 'failed';
}

export interface RAGProcessingRequest {
  program_document_id: number;
  chunk_size?: number;
  chunk_overlap?: number;
  force_reprocess?: boolean;
}

export interface RAGProcessingResponse {
  rag_document_id: number;
  status: string;
  message: string;
}

export interface RAGQueryRequest {
  query: string;
  max_chunks?: number;
  similarity_threshold?: number;
  program_ids?: number[];
}

export interface RAGChunk {
  id: number;
  rag_document_id: number;
  content: string;
  chunk_index: number;
  token_count: number;
  page_number?: number;
  section_title?: string;
  chunk_type: string;
  chunk_metadata?: Record<string, any>;
  embedding_model: string;
  created_at: string;
  similarity_score: number;
}

export interface RAGQueryResponse {
  query: string;
  chunks: RAGChunk[];
  total_retrieved: number;
  embedding_time_ms: number;
  retrieval_time_ms: number;
  total_time_ms: number;
}

export interface RAGDocument {
  id: number;
  program_document_id: number;
  status: string;
  processing_started_at?: string;
  processing_completed_at?: string;
  error_message?: string;
  total_chunks: number;
  total_tokens: number;
  chunk_size: number;
  chunk_overlap: number;
  embedding_model: string;
  created_at: string;
  updated_at: string;
}

export interface RAGStatusResponse {
  total_documents: number;
  pending_documents: number;
  processing_documents: number;
  completed_documents: number;
  failed_documents: number;
  total_chunks: number;
  total_tokens: number;
}

export interface RAGDocumentListResponse {
  documents: RAGDocument[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

// RAG API functions
export const ragApi = {
  // Process a document for RAG
  async processDocument(request: RAGProcessingRequest): Promise<RAGProcessingResponse> {
    const response = await api.post('/rag/process', request);
    return response.data;
  },

  // Query documents using RAG
  async queryDocuments(request: RAGQueryRequest): Promise<RAGQueryResponse> {
    const response = await api.post('/rag/query', request);
    return response.data;
  },

  // Get RAG processing status
  async getStatus(): Promise<RAGStatusResponse> {
    const response = await api.get('/rag/status');
    return response.data;
  },

  // Get RAG documents with pagination
  async getDocuments(
    page: number = 1,
    per_page: number = 10,
    status_filter?: string
  ): Promise<RAGDocumentListResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: per_page.toString(),
    });
    
    if (status_filter) {
      params.append('status_filter', status_filter);
    }

    const response = await api.get(`/rag/documents?${params}`);
    return response.data;
  },

  // Get specific RAG document
  async getDocument(ragDocumentId: number): Promise<RAGDocument> {
    const response = await api.get(`/rag/documents/${ragDocumentId}`);
    return response.data;
  },

  // Delete RAG document
  async deleteDocument(ragDocumentId: number): Promise<{ message: string; embeddings_deleted: boolean }> {
    const response = await api.delete(`/rag/documents/${ragDocumentId}`);
    return response.data;
  },

  // Admin functions
  admin: {
    // Process documents in batch
    async processBatch(
      program_ids: number[],
      chunk_size: number = 1024,
      chunk_overlap: number = 200,
      force_reprocess: boolean = false
    ): Promise<{ message: string; results: any[] }> {
      const params = new URLSearchParams({
        chunk_size: chunk_size.toString(),
        chunk_overlap: chunk_overlap.toString(),
        force_reprocess: force_reprocess.toString(),
      });

      const response = await api.post(`/admin/api/rag/process-batch?${params}`, program_ids);
      return response.data;
    },

    // Get RAG analytics
    async getAnalytics(): Promise<{
      processing_status: RAGStatusResponse;
      query_analytics: {
        total_queries: number;
        average_retrieval_time_ms: number;
        average_similarity_score: number;
      };
      performance_metrics: {
        top_chunks: Array<{ chunks: any; count: number }>;
      };
    }> {
      const response = await api.get('/admin/api/rag/analytics');
      return response.data;
    },
  },
};
