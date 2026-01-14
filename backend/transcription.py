import os
import asyncio
from deepgram import AsyncDeepgramClient
from deepgram.core.events import EventType
from dotenv import load_dotenv

load_dotenv()

import httpx

class TranslationService:
    def __init__(self, callback, src_lang="en-US", tgt_lang="hi"):
        self.api_key = os.getenv("DEEPGRAM_API_KEY")
        self.or_key = os.getenv("OPENAI_API_KEY")
        self.client = AsyncDeepgramClient(api_key=self.api_key)
        self.callback = callback
        self.src_lang = src_lang
        self.tgt_lang = tgt_lang
        self.dg_connection = None
        self.connect_task = None
        self.loop = None

    async def translate(self, text):
        if self.src_lang.split('-')[0] == self.tgt_lang:
            return text
            
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.or_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": "google/learnlm-1.5-pro-experimental:free",
                        "messages": [
                            {"role": "system", "content": f"Translate the following text from {self.src_lang} to {self.tgt_lang}. Only return the translation, nothing else."},
                            {"role": "user", "content": text}
                        ],
                    },
                    timeout=2.0
                )
                if response.status_code == 200:
                    return response.json()['choices'][0]['message']['content'].strip()
            except Exception as e:
                print(f"Translation Error: {e}")
        return text

    async def start(self):
        self.loop = asyncio.get_event_loop()
        self.started_event = asyncio.Event()

        async def _run():
            try:
                async with self.client.listen.v1.connect(
                    model="nova-2",
                    punctuate="true",
                    language=self.src_lang,
                    encoding="linear16",
                    channels="1",
                    sample_rate="16000",
                ) as dg_connection:
                    self.dg_connection = dg_connection
                    
                    def on_message(result):
                        try:
                            sentence = result.channel.alternatives[0].transcript
                            if len(sentence) > 0:
                                # Start translation in background
                                async def process():
                                    final_text = await self.translate(sentence)
                                    await self.callback(final_text)
                                
                                asyncio.run_coroutine_threadsafe(process(), self.loop)
                        except (AttributeError, IndexError):
                            pass

                    self.dg_connection.on(EventType.MESSAGE, on_message)
                    self.started_event.set()
                    await dg_connection.start_listening()
            except Exception as e:
                print(f"Deepgram Connection Error: {e}")
                if not self.started_event.is_set():
                    self.started_event.set()

        self.connect_task = asyncio.create_task(_run())
        await self.started_event.wait()
        return True

    async def send_audio(self, data):
        if self.dg_connection:
            await self.dg_connection.send_media(data)

    async def stop(self):
        if self.connect_task:
            self.connect_task.cancel()
            try:
                await self.connect_task
            except asyncio.CancelledError:
                pass
