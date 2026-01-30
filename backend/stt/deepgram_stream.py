import asyncio
import logging
import json
from deepgram import AsyncDeepgramClient
from deepgram.core.events import EventType
from config import config

logger = logging.getLogger(__name__)

class DeepgramStreamer:
    def __init__(self, on_transcript_callback):
        self.client = AsyncDeepgramClient(api_key=config.DEEPGRAM_API_KEY)
        self.dg_connection = None
        self._ctx = None
        self.on_transcript_callback = on_transcript_callback

    async def start(self):
        try:
            # Use await for the connect call in AsyncDeepgramClient
            self._ctx = await self.client.listen.v1.connect(
                model="nova-2",

                language="en-US",
                smart_format="true",
                encoding="linear16",
                channels="1",
                sample_rate=48000,
                interim_results="true"
            )
            
            # Enter the context manager
            self.dg_connection = await self._ctx.__aenter__()

            async def on_message(result):
                try:
                    # result is V1SocketClientResponse (Union)
                    # We check for the presence of channel (indicating ListenV1Results)
                    if hasattr(result, "channel"):
                        sentence = result.channel.alternatives[0].transcript
                        if len(sentence) == 0:
                            return
                        
                        is_final = getattr(result, "is_final", False)
                        if is_final:
                            logger.info(f"Final Transcript: {sentence}")
                        
                        await self.on_transcript_callback(sentence, is_final)
                except Exception as e:
                    logger.error(f"Error processing Deepgram message: {e}")

            def on_error(error):
                logger.error(f"Deepgram Error: {error}")

            # Register handlers
            self.dg_connection.on(EventType.MESSAGE, on_message)
            self.dg_connection.on(EventType.ERROR, on_error)

            # Start the internal listening loop in a background task
            asyncio.create_task(self.dg_connection.start_listening())
            
            return True
        except Exception as e:
            logger.error(f"Failed to start Deepgram connection: {e}")
            return False

    async def send_audio(self, data):
        if self.dg_connection:
            # In SDK v5 AsyncV1SocketClient, it's send_media for binary data
            self.dg_connection.send_media(data)

    async def stop(self):
        if self._ctx:
            try:
                # Optional: send finalize if supported by con
                # self.dg_connection.send_finalize(...)
                pass
            except:
                pass
            await self._ctx.__aexit__(None, None, None)
            self.dg_connection = None
            self._ctx = None


