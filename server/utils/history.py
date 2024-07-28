import json
from pydantic import BaseModel
from typing import NamedTuple
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
    apiKeyName: str


class ChatHistory(BaseModel):
    messages: List[Message]
    llm: LlmProvider
