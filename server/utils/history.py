from pydantic import BaseModel, Field
from typing import List


class Message(BaseModel):
    role: str
    content: str


class LlmProvider(BaseModel):
    model: str
    provider: str
    title: str
    icon: str
    subtitle: str
    systemMessage: str
    # apiBase: Optional[str] = None
    apiBase: str = Field(default=None)  # Using Field to set the default value to None
    apiKeyName: str


class ChatHistory(BaseModel):
    messages: List[Message]
    llm: LlmProvider
