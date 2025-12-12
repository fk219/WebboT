"""
Knowledge Base Integration
Handles vector search and document retrieval.
"""

import os
from typing import List, Dict, Any, Optional
from langchain_openai import OpenAIEmbeddings
from langchain_pinecone import PineconeVectorStore
from pinecone import Pinecone, ServerlessSpec

# Initialize Pinecone
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", "webbot-agents")

class KnowledgeBase:
    def __init__(self):
        self.embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
        self.vector_store = None
        self._init_pinecone()

    def _init_pinecone(self):
        """Initialize Pinecone connection"""
        if not PINECONE_API_KEY:
            print("⚠️ PINECONE_API_KEY not found. Knowledge Base disabled.")
            return

        try:
            pc = Pinecone(api_key=PINECONE_API_KEY)
            
            # Check if index exists
            existing_indexes = [i.name for i in pc.list_indexes()]
            if PINECONE_INDEX_NAME not in existing_indexes:
                print(f"⚠️ Index {PINECONE_INDEX_NAME} not found. Please create it.")
                return

            self.vector_store = PineconeVectorStore(
                index_name=PINECONE_INDEX_NAME,
                embedding=self.embeddings
            )
            print("✅ Knowledge Base (Pinecone) initialized.")
        except Exception as e:
            print(f"❌ Failed to initialize Pinecone: {e}")

    def search(self, query: str, kb_ids: List[str], k: int = 3) -> List[str]:
        """
        Search for relevant documents in the vector store.
        
        Args:
            query: The user's question
            kb_ids: List of Knowledge Base IDs to filter by (namespace or metadata filter)
            k: Number of results to return
            
        Returns:
            List of text chunks
        """
        if not self.vector_store:
            return []

        if not kb_ids:
            return []

        try:
            # Filter by knowledge_base_id
            # Assuming documents are stored with metadata={"kb_id": "..."}
            # Pinecone filter syntax
            filter_dict = {
                "kb_id": {"$in": kb_ids}
            }

            results = self.vector_store.similarity_search(
                query,
                k=k,
                filter=filter_dict
            )
            
            return [doc.page_content for doc in results]
        except Exception as e:
            print(f"❌ Knowledge search failed: {e}")
            return []

# Singleton instance
kb_service = KnowledgeBase()
