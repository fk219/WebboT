/**
 * Knowledge Base type definitions
 */

export interface KnowledgeBase {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  
  // Vector DB Configuration
  vector_db_provider: 'pinecone' | 'weaviate' | 'qdrant';
  vector_db_index_name: string;
  embedding_model: string;
  
  // Retrieval Settings
  chunk_size: number;
  chunk_overlap: number;
  max_chunks: number;
  similarity_threshold: number;
  
  // Status
  status: 'active' | 'processing' | 'error';
  document_count: number;
  total_chunks: number;
  
  // Metadata
  created_at: string;
  updated_at: string;
}

export interface KBDocument {
  id: string;
  knowledge_base_id: string;
  filename: string;
  file_url: string;
  file_size: number;
  mime_type: string;
  
  // Processing
  status: 'pending' | 'processing' | 'completed' | 'error';
  chunk_count: number;
  error_message?: string;
  
  // Metadata
  uploaded_at: string;
  processed_at?: string;
}

export interface KBCreateInput {
  name: string;
  description?: string;
  vector_db_provider: string;
  embedding_model?: string;
  chunk_size?: number;
  chunk_overlap?: number;
}
