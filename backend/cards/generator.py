from openai import OpenAI
from config import config
import logging
import json

logger = logging.getLogger(__name__)

class CardGenerator:
    def __init__(self):
        self.client = OpenAI(api_key=config.OPENAI_API_KEY)

    async def generate_card(self, keyword, contexts):
        context_text = "\n\n".join([c['text'] for c in contexts])
        
        prompt = f"""
        You are a meeting assistant. A user just mentioned the keyword: "{keyword}".
        Based on the following document context, generate a "Knowledge Card" for the user.
        The card should be concise, informative, and formatted as JSON.

        Context:
        {context_text}

        JSON Output Schema:
        {{
            "title": "Short Descriptive Title",
            "bullets": ["Bullet point 1", "Bullet point 2", "Bullet point 3"],
            "source": "Source Name or Document Reference"
        }}
        """

        try:
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"}
            )
            card_data = json.loads(response.choices[0].message.content)
            return card_data
        except Exception as e:
            logger.error(f"Error generating knowledge card: {e}")
            return None

card_generator = CardGenerator()
