from typing import Optional
import logging

from config import config

logger = logging.getLogger(__name__)


class EmbeddingEngine:
    """Lazy OpenAI embeddings client.

    The OpenAI client is created on first use so importing this module
    doesn't attempt network or SSL operations during application startup.
    If `OPENAI_API_KEY` is not set, the engine will be disabled and
    `get_embedding` will return None.
    """

    def __init__(self):
        self.client = None

    def _ensure_client(self):
        if self.client is not None:
            return
        api_key = config.OPENAI_API_KEY
        if not api_key:
            logger.warning("OPENAI_API_KEY not set; embeddings disabled.")
            return
        try:
            # Import here to avoid side-effects at module import time
            from openai import OpenAI

            self.client = OpenAI(api_key=api_key)
        except Exception as e:
            logger.error(f"Failed to initialize OpenAI client: {e}")
            self.client = None

    def get_embedding(self, text: str, model: str = "text-embedding-3-small") -> Optional[list]:
        self._ensure_client()
        if self.client is None:
            return None

        text = text.replace("\n", " ")
        try:
            resp = self.client.embeddings.create(input=[text], model=model)
            return resp.data[0].embedding
        except Exception as e:
            logger.error(f"Error generating embedding: {e}")
            return None


# Module-level singleton (safe to instantiate at import time since it won't
# create the OpenAI client until actually used).
embedding_engine = EmbeddingEngine()
from openai import OpenAI
from config import config
import logging

logger = logging.getLogger(__name__)

class EmbeddingEngine:
    def __init__(self):
        self.client = OpenAI(api_key=config.OPENAI_API_KEY)

    def get_embedding(self, text: str, model="text-embedding-3-small"):
        text = text.replace("\n", " ")
        try:
            return self.client.embeddings.create(input=[text], model=model).data[0].embedding
        except Exception as e:
            logger.error(f"Error generating embedding: {e}")
            return None

embedding_engine = EmbeddingEngine()
