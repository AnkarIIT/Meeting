import os
import json
from dotenv import load_dotenv

load_dotenv()

class VectorStore:
    def __init__(self):
        self.db_path = "./mock_db.json"
        self.documents = []
        self._load_db()

    def _load_db(self):
        if os.path.exists(self.db_path):
            with open(self.db_path, "r") as f:
                self.documents = json.load(f)
        else:
            # Seed with initial data
            self.documents = [
                {
                    "id": "alpha", 
                    "title": "Project Alpha", 
                    "text": "Project Alpha is our new internal project for real-time collaboration using WebSockets and low latency streaming.",
                    "keywords": ["alpha", "collaboration", "websocket"]
                },
                {
                    "id": "beta", 
                    "title": "Project Beta", 
                    "text": "Project Beta focuses on the frontend migration to Next.js and Tailwind CSS for a premium user experience.",
                    "keywords": ["beta", "frontend", "nextjs", "tailwind"]
                },
                {
                    "id": "gamma", 
                    "title": "Meeting Protocol", 
                    "text": "Always start meetings with an agenda and record the session for the Copilot to process.",
                    "keywords": ["protocol", "agenda", "record"]
                }
            ]
            self._save_db()

    def _save_db(self):
        with open(self.db_path, "w") as f:
            json.dump(self.documents, f, indent=4)

    def add_document(self, doc_id, text, metadata=None):
        title = metadata.get("title", "Untitled") if metadata else "Untitled"
        self.documents.append({
            "id": doc_id,
            "text": text,
            "title": title,
            "keywords": text.lower().split()
        })
        self._save_db()

    def search(self, query_text, n_results=1):
        """Simple keyword matching for Python 3.14 compatibility."""
        query_text = query_text.lower()
        matches = []
        
        for doc in self.documents:
            score = 0
            # Higher score if keyword is in title
            if any(k in doc["title"].lower() for k in query_text.split()):
                score += 2
            # Score based on text matches
            if any(k in doc["text"].lower() for k in query_text.split()):
                score += 1
            
            if score > 0:
                matches.append((score, doc))
        
        # Sort by score descending
        matches.sort(key=lambda x: x[0], reverse=True)
        
        if not matches:
            return None
            
        top_match = matches[0][1]
        # Return in a format compatible with main.py expectations
        return {
            "documents": [[top_match["text"]]],
            "metadatas": [[{"title": top_match["title"]}]],
            "ids": [[top_match["id"]]],
            "distances": [[0.1]] # High confidence mock distance
        }

    def list_documents(self):
        return self.documents
