from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import json
import logging
import asyncio

from stt.deepgram_stream import DeepgramStreamer
from nlp.keyword_detector import detector
from rag.search import vector_search
from cards.generator import card_generator

# Simple Action Item Detector (Mock for demonstration)
def detect_action_items(text: str):
    triggers = ["i will", "let's", "to do", "action item", "remind me to", "schedule", "assign"]
    text_lower = text.lower()
    if any(trigger in text_lower for trigger in triggers):
        return text.strip()
    return None

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Real-Time Meeting Copilot API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Meeting Copilot API is running"}

@app.post("/generate-mom")
async def generate_mom(data: dict):
    transcript = data.get("transcript", [])
    # In a real app, this would call an LLM with the full transcript
    # Mocking MoM generation for conference demo
    return {
        "title": "Minutes of Meeting",
        "date": "Jan 30, 2026",
        "summary": "Discussed the new product design and AI features. Successful demonstration of real-time transcription and HD video.",
        "decisions": [
            "Approved the use of 48kHz audio for all upcoming sessions.",
            "Agreed to implement Gallery/Focus mode for larger meetings."
        ],
        "action_items": [
            "Ankar to finalize the CSS visualizer components.",
            "George to test the MoM export functionality across browsers."
        ]
    }

@app.websocket("/ws/audio")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    logger.info("WebSocket connection established")

    async def on_transcript(text: str, is_final: bool):
        try:
            # Send transcript to client immediately
            await websocket.send_json({
                "type": "TRANSCRIPT",
                "text": text,
                "is_final": is_final
            })

            if is_final:
                # Wrap AI processing in its own try-except to keep the connection alive
                try:
                    detected_keywords = detector.detect(text)
                    for keyword in detected_keywords:
                        await websocket.send_json({
                            "type": "KEYWORD",
                            "keyword": keyword
                        })
                        
                        # Fetch context and generate Knowledge Card
                        contexts = vector_search.search(keyword)
                        if contexts:
                            card = await card_generator.generate_card(keyword, contexts)
                            if card:
                                await websocket.send_json({
                                    "type": "CARD",
                                    "data": card
                                })
                    
                    # Action Item Detection
                    action_item = detect_action_items(text)
                    if action_item:
                        await websocket.send_json({
                            "type": "ACTION_ITEM",
                            "text": action_item
                        })
                except Exception as ai_error:
                    logger.error(f"AI Processing error (non-fatal): {ai_error}")
        except Exception as e:
            logger.error(f"Transcription callback error: {e}")

    streamer = DeepgramStreamer(on_transcript)
    if not await streamer.start():
        await websocket.close(code=1011)
        return

    try:
        byte_count = 0
        while True:
            data = await websocket.receive_bytes()
            byte_count += len(data)
            if byte_count > 100000: # Log every ~100KB
                logger.info(f"Received {byte_count} bytes of audio")
                byte_count = 0
            await streamer.send_audio(data)
    except WebSocketDisconnect:
        logger.info("WebSocket connection closed")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")

    finally:
        await streamer.stop()
        try:
            await websocket.close()
        except:
            pass

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

