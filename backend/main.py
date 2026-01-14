from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import json
import asyncio
import os
from dotenv import load_dotenv
from transcription import TranslationService
from vector_store import VectorStore

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

vector_store = VectorStore()

@app.get("/")
async def root():
    return {"message": "Meeting Copilot API is running"}

@app.post("/add-doc")
async def add_doc(doc: dict):
    vector_store.add_document(doc["id"], doc["text"], doc.get("metadata"))
    return {"status": "success"}

@app.websocket("/listen")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    
    # Get params
    src_lang = websocket.query_params.get("srcLang", "en-US")
    tgt_lang = websocket.query_params.get("tgtLang", "hi")
    
    async def transcription_callback(transcript: str):
        print(f"Transcript: {transcript}")
        # Send transcript to client
        await websocket.send_text(json.dumps({"transcript": transcript}))
        
        # Keyword Search/RAG
        # This is a simple implementation: search for every transcript
        # In a real app, you might want to filter for specific keywords or use an LLM
        results = vector_store.search(transcript)
        if results and results["documents"] and results["distances"][0][0] < 0.5: # Threshold
             await websocket.send_text(json.dumps({
                 "knowledge_card": {
                     "title": results["metadatas"][0][0].get("title", "Related Info"),
                     "summary": results["documents"][0][0],
                     "id": results["ids"][0][0]
                 }
             }))

    transcription_service = TranslationService(transcription_callback, src_lang=src_lang, tgt_lang=tgt_lang)
    started = await transcription_service.start()
    
    if not started:
        await websocket.close(code=1011)
        return

    try:
        while True:
            data = await websocket.receive_bytes()
            await transcription_service.send_audio(data)
    except WebSocketDisconnect:
        print("Client disconnected")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        await transcription_service.stop()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
