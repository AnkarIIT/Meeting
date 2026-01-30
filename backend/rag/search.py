import logging
import os
from config import config
from rag.embeddings import embedding_engine

logger = logging.getLogger(__name__)

# Try to import chromadb, but handle failure
CHROMA_AVAILABLE = False
try:
    import chromadb
    CHROMA_AVAILABLE = True
except ImportError:
    logger.warning("ChromaDB not available, using in-memory fallback.")

class VectorSearch:
    def __init__(self, collection_name="meeting_docs"):
        self.use_fallback = not CHROMA_AVAILABLE
        self.collection = None
        self.fallback_data = [] # List of {"text": str, "metadata": dict, "embedding": list}

        if CHROMA_AVAILABLE:
            try:
                self.client = chromadb.PersistentClient(path=config.CHROMA_DB_PATH)
                self.collection = self.client.get_or_create_collection(name=collection_name)
            except Exception as e:
                logger.error(f"Failed to initialize ChromaDB: {e}. Falling back to in-memory.")
                self.use_fallback = True

    def search(self, query: str, n_results: int = 3):
        if self.use_fallback:
            # Simple keyword match or cosine similarity if we want to be fancy
            # For fallback, we'll just do keyword match in this simple version
            results = []
            query_lower = query.lower()
            for doc in self.fallback_data:
                if query_lower in doc['text'].lower():
                    results.append({
                        "text": doc['text'],
                        "metadata": doc['metadata'],
                        "distance": 0 # Exact match
                    })
            return results[:n_results]

        query_embedding = embedding_engine.get_embedding(query)
        if query_embedding is None:
            return []
        
        try:
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=n_results
            )
            
            formatted_results = []
            if results['documents']:
                for i in range(len(results['documents'][0])):
                    formatted_results.append({
                        "text": results['documents'][0][i],
                        "metadata": results['metadatas'][0][i] if results['metadatas'] else {},
                        "distance": results['distances'][0][i] if results['distances'] else 0
                    })
            return formatted_results
        except Exception as e:
            logger.error(f"Search error: {e}")
            return []

    def ingest(self, text: str, metadata: dict = None):
        if self.use_fallback:
            self.fallback_data.append({"text": text, "metadata": metadata or {}})
            return True

        embedding = embedding_engine.get_embedding(text)
        if embedding:
            try:
                self.collection.add(
                    embeddings=[embedding],
                    documents=[text],
                    metadatas=[metadata] if metadata else [{}],
                    ids=[str(hash(text))]
                )
                return True
            except Exception as e:
                logger.error(f"Ingest error: {e}")
                return False
        return False

vector_search = VectorSearch()

# Add some sample data if it's the fallback
if vector_search.use_fallback:
    vector_search.ingest("Project X is our next-gen AI platform focused on real-time collaboration. Key components include a distributed state manager and a low-latency messaging layer.", {"source": "architecture_doc.pdf"})
    vector_search.ingest("The deadline for Phase 1 of Project X is November 15th. All teams must submit their designs by then via the internal portal.", {"source": "project_timeline.pdf"})
    vector_search.ingest("Our budget for the current fiscal year is $2.5M, with a primary focus on Cloud infrastructure and R&D for the new AI engine.", {"source": "budget_2026.pdf"})
    vector_search.ingest("The marketing strategy for Project X involves a multi-channel approach, targeting early adopters in the tech and finance sectors through tailored webinars.", {"source": "marketing_strategy.pdf"})
    vector_search.ingest("Security is paramount for Project X. We use end-to-end encryption for all real-time data and OAuth2 for authentication and authorization.", {"source": "security_protocol.pdf"})
    vector_search.ingest("Deepgram is used for high-accuracy, real-time speech-to-text transcription. It supports multiple languages and has low latency.", {"source": "tech_stack.md"})
    vector_search.ingest("OpenAI models are used for generating intelligent knowledge cards from meeting transcripts by summarizing retrieved context.", {"source": "tech_stack.md"})
    vector_search.ingest("ChromaDB is our vector store for efficient RAG (Retrieval-Augmented Generation), enabling the AI to surface relevant company knowledge.", {"source": "tech_stack.md"})


