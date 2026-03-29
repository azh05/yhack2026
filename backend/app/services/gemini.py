from google import genai

from app.config import get_settings

_PROMPT_TEMPLATE = """You are a conflict intelligence analyst. Given the following news content about a conflict zone, provide a structured summary in this format:

**Background:** Brief historical context (1-2 sentences)
**Current Situation:** What is happening now (2-3 sentences)
**Key Actors:** Who is involved
**Humanitarian Impact:** Civilian toll and displacement
**Outlook:** Likely near-term trajectory (1-2 sentences)

Keep the total summary under 300 words. Be factual and neutral.

News content:
{news}"""


def summarize_conflict(news_text: str) -> str:
    settings = get_settings()
    client = genai.Client(api_key=settings.gemini_api_key)
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=_PROMPT_TEMPLATE.format(news=news_text),
    )
    return response.text
