import re
import time
import logging
from typing import List, Set

logger = logging.getLogger(__name__)

class KeywordDetector:
    def __init__(self, keywords: List[str], debounce_seconds: int = 60):
        self.keywords = [k.lower() for k in keywords]
        self.debounce_seconds = debounce_seconds
        self.last_triggered = {} # keyword -> timestamp

    def detect(self, text: str) -> Set[str]:
        detected = set()
        normalized_text = text.lower()
        
        for keyword in self.keywords:
            # Simple substring match for now. Could use regex for word boundaries.
            if re.search(rf"\b{re.escape(keyword)}\b", normalized_text):
                current_time = time.time()
                last_time = self.last_triggered.get(keyword, 0)
                
                if current_time - last_time > self.debounce_seconds:
                    detected.add(keyword)
                    self.last_triggered[keyword] = current_time
                    logger.info(f"Keyword detected: {keyword}")
        
        return detected

# Example usage/default keywords
DEFAULT_KEYWORDS = ["Project X", "Architecture", "Deadline", "Meeting", "Budget"]
detector = KeywordDetector(DEFAULT_KEYWORDS)
