# test_main.py
import pytest
from fastapi.testclient import TestClient
from server.main import app, verify_authorization, stream_chat_history
from server.utils.history import ChatHistory, Message
from unittest.mock import patch, MagicMock

client = TestClient(app)


def test_read_root():
    response = client.get("/hi")
    assert response.status_code == 200
    assert response.json() == {"Hello": "World"}


@pytest.mark.asyncio
async def test_verify_authorization():
    # Test valid authorization
    await verify_authorization("Bearer my_key_something")

    # Test invalid authorization
    with pytest.raises(Exception):
        await verify_authorization("Bearer invalid_key")


@pytest.mark.asyncio
async def test_stream_chat_history():
    llm = "test_model"
    tokens = [
        Message(role="human", content="Hello"),
        Message(role="assistant", content="Hi there!")
    ]

    mock_callback = MagicMock()
    mock_callback.aiter.return_value = iter(["Test", "response"])

    with patch('server.main.LLMFactory.get_llm') as mock_get_llm, \
            patch('server.main.AsyncIteratorCallbackHandler', return_value=mock_callback):
        mock_model = MagicMock()
        mock_get_llm.return_value = mock_model

        result = [token async for token in stream_chat_history(llm, tokens)]

        assert result == ["Test", "response"]
        mock_get_llm.assert_called_once_with(mock_callback, llm)
        mock_model.agenerate.assert_called_once()


@pytest.mark.asyncio
async def test_chat():
    chat_history = ChatHistory(
        llm="test_model",
        messages=[
            Message(role="human", content="Hello"),
            Message(role="assistant", content="Hi there!")
        ]
    )

    with patch('server.main.stream_chat_history') as mock_stream_chat_history:
        mock_stream_chat_history.return_value = iter(["Test", "response"])

        response = await client.post("/chat/", json=chat_history.dict())

        assert response.status_code == 200
        assert response.text == "Testresponse"
        mock_stream_chat_history.assert_called_once_with(chat_history.llm, chat_history.messages)


if __name__ == "__main__":
    pytest.main()
