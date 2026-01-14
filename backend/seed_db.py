import requests
import json

BASE_URL = "http://localhost:8000"

def add_doc(doc_id, text, title):
    url = f"{BASE_URL}/add-doc"
    payload = {
        "id": doc_id,
        "text": text,
        "metadata": {"title": title}
    }
    response = requests.post(url, json=payload)
    print(f"Added {title}: {response.json()}")

if __name__ == "__main__":
    # Sample data
    docs = [
        {"id": "alpha", "title": "Project Alpha", "text": "Project Alpha is our new internal project for real-time collaboration using WebSockets and low latency streaming."},
        {"id": "beta", "title": "Project Beta", "text": "Project Beta focuses on the frontend migration to Next.js and Tailwind CSS for a premium user experience."},
        {"id": "gamma", "title": "Meeting Protocol", "text": "Always start meetings with an agenda and record the session for the Copilot to process."},
    ]
    
    for doc in docs:
        try:
            add_doc(doc["id"], doc["text"], doc["title"])
        except Exception as e:
            print(f"Error adding {doc['title']}: {e}. Is the server running?")
