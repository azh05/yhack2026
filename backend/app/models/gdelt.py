from pydantic import BaseModel


class GDELTArticle(BaseModel):
    url: str = ""
    title: str = ""
    tone: float = 0.0
    source_country: str = ""
    seendate: str = ""


class NewsResponse(BaseModel):
    query: str
    articles: list[GDELTArticle]
    average_tone: float
