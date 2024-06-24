# standard library imports
import asyncio
import os
from typing import AsyncIterable, List, Optional

# related third party imports
import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from langchain.callbacks.streaming_aiter import AsyncIteratorCallbackHandler

# local application/library specific imports
from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI
from starlette.staticfiles import StaticFiles

# local imports
from server.utils.history import ChatHistory, Message

load_dotenv()
API_KEY = os.getenv('OPENAI_API_KEY', 'default_value_if_not_found')
MODEL = os.getenv('MODEL', 'gpt-3.5-turbo')

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory=".", html=True), name="static")


@app.get("/hi")
def read_root():
    """
    This method returns a greeting message to test the service.

    Returns:
    dict: A dictionary containing a greeting message {"Hello": "World"}
    """
    return {"Hello": "World"}


async def verify_authorization(authorization: Optional[str] = Header(None)):
    if authorization != "Bearer my_key_something":
        raise HTTPException(status_code=401, detail="Unauthorized")


async def process_tokens_history(tokens: List[Message]) -> AsyncIterable[str]:
    """
    Async function to process and generate responses for a list of given tokens.

    The function initiates a chat model using the OpenAI API and streams the tokens through it, yielding
    the generated responses one by one. When the incoming tokens are processed, it signals the task completion.

    Parameters:
    tokens (List[Message]): List of messages to be processed. It can contain messages from both the user (human) and the AI.

    Returns:
    AsyncIterable[str]: Asynchronously generated responses from the model for each token in the input list.
    """
    callback = AsyncIteratorCallbackHandler()
    model = ChatOpenAI(
        streaming=True,
        verbose=True,
        callbacks=[callback],
        openai_api_key=API_KEY,
        model_name=MODEL,
    )
    new_token_list: List[BaseMessage] = []
    system_message = SystemMessage(content="""
                You are a helpful assistant named Buddy.
            """)

    new_token_list.append(system_message)

    for token in tokens:
        if token.role in ["human", "user"]:
            msg = HumanMessage(content=token.content)
        elif token.role in ["assistant", "ai"]:
            msg = AIMessage(content=token.content)
        else:
            msg = HumanMessage(content=token.content)  # Default to HumanMessage
        new_token_list.append(msg)

    task = asyncio.create_task(
        model.agenerate(messages=[new_token_list])
    )

    try:
        async for token in callback.aiter():
            yield token
    except Exception as e:
        print(f"Caught exception: {e}")
    finally:
        callback.done.set()

    await task


@app.post("/stream_history/")
async def stream_history(chat_history: ChatHistory):
    #  , authorization: Optional[str] = Depends(verify_authorization)
    """
    This method processes the chat history and returns a streaming response.

    Parameters:
    chat_history (ChatHistory): The chat history to be processed.

    Returns:
    StreamingResponse: A streaming response containing the processed chat history.

    Example:
        curl https://api.openai.com/v1/chat/completions
        -H "Content-Type: application/json"
        -H "Authorization: Bearer YOUR_API_KEY"
        -d '{
        "model": "gpt-4",
        "messages": [
          {"role": "system", "content": "You are a helpful assistant."},
          {"role": "user", "content": "Tell me a joke."}
        ],
        "temperature": 0.7
        }'
    """
    generator = process_tokens_history(chat_history.messages)
    return StreamingResponse(generator, media_type="text/event-stream")


if __name__ == "__main__":
    uvicorn.run(app,
                port=8000,
                reload=True,
                log_level='debug'
                )
