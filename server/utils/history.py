import json
from pydantic import BaseModel
from typing import List


class Message(BaseModel):
    role: str
    content: str


class ChatHistory(BaseModel):
    messages: List[Message]
    llm: str
