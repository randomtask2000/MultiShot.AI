# test_llm_factory.py
import pytest
from unittest.mock import patch, MagicMock
from server.utils.llm_factory import LLMFactory


@pytest.mark.asyncio
async def test_get_llm():
    callback = MagicMock()

    # Test OpenAI models
    with patch('server.utils.llm_factory.LLMFactory.get_openai') as mock_get_openai:
        await LLMFactory.get_llm(callback, "gpt-4o-mini")
        mock_get_openai.assert_called_once_with(callback, "gpt-4o-mini", 'MODEL_LLM_OPENAI_GPT4O_API_KEY')

    with patch('server.utils.llm_factory.LLMFactory.get_openai') as mock_get_openai:
        await LLMFactory.get_llm(callback, "gpt-3.5-turbo")
        mock_get_openai.assert_called_once_with(callback, "gpt-3.5-turbo", 'MODEL_LLM_OPENAI_GPT4O_API_KEY')

    # Test Anthropic model
    with patch('server.utils.llm_factory.LLMFactory.get_anthropic') as mock_get_anthropic:
        await LLMFactory.get_llm(callback, "claude-3-5-sonnet-20240620")
        mock_get_anthropic.assert_called_once_with(callback, "claude-3-5-sonnet-20240620",
                                                   'MODEL_LLM_ANTHROPIC_CLAUD35SONNET_API_KEY')

    # Test OpenAI URL models
    with patch('server.utils.llm_factory.LLMFactory.get_openai_url') as mock_get_openai_url:
        await LLMFactory.get_llm(callback, "llama-3.1-405b-reasoning")
        mock_get_openai_url.assert_called_once_with(callback, "llama-3.1-405b-reasoning", 'MODEL_LLM_GROQ_LLAMA370B_API_KEY',
                                                    "https://api.groq.com/openai/v1/")

    with patch('server.utils.llm_factory.LLMFactory.get_openai_url') as mock_get_openai_url:
        await LLMFactory.get_llm(callback, "llama3-70b-8192")
        mock_get_openai_url.assert_called_once_with(callback, "llama3-70b-8192", 'MODEL_LLM_GROQ_LLAMA370B_API_KEY',
                                                    "https://api.groq.com/openai/v1/")

    with patch('server.utils.llm_factory.LLMFactory.get_openai_url') as mock_get_openai_url:
        await LLMFactory.get_llm(callback, "codestral:22b")
        mock_get_openai_url.assert_called_once_with(callback, "codestral:22b", 'MODEL_LLM_OLLAMA_CODESTRAL222B_API_KEY',
                                                    "http://10.0.6.5:11434/v1/")

    # Test default case
    with patch('server.utils.llm_factory.LLMFactory.get_openai') as mock_get_openai:
        await LLMFactory.get_llm(callback, "unknown_model")
        mock_get_openai.assert_called_once_with(callback, "gpt-3.5-turbo", 'MODEL_LLM_OPENAI_GPT4O_API_KEY')


@pytest.mark.asyncio
async def test_get_anthropic():
    callback = MagicMock()
    with patch('os.getenv', return_value='test_key'), \
            patch('server.utils.llm_factory.ChatAnthropic') as mock_chat_anthropic:
        await LLMFactory.get_anthropic(callback, "test_model", "TEST_ENV_KEY")
        mock_chat_anthropic.assert_called_once_with(
            streaming=True,
            verbose=True,
            callbacks=[callback],
            model="test_model",
            model_name="test_model",
            anthropic_api_key='test_key'
        )


@pytest.mark.asyncio
async def test_get_openai():
    callback = MagicMock()
    with patch('os.getenv', return_value='test_key'), \
            patch('server.utils.llm_factory.ChatOpenAI') as mock_chat_openai:
        await LLMFactory.get_openai(callback, "test_model", "TEST_ENV_KEY")
        mock_chat_openai.assert_called_once_with(
            streaming=True,
            verbose=True,
            callbacks=[callback],
            openai_api_key='test_key',
            model_name="test_model"
        )


@pytest.mark.asyncio
async def test_get_openai_url():
    callback = MagicMock()
    with patch('os.getenv', return_value='test_key'), \
            patch('server.utils.llm_factory.ChatOpenAI') as mock_chat_openai:
        await LLMFactory.get_openai_url(callback, "test_model", "TEST_ENV_KEY", "https://test.url")
        mock_chat_openai.assert_called_once_with(
            base_url="https://test.url",
            streaming=True,
            verbose=True,
            callbacks=[callback],
            openai_api_key='test_key',
            model_name="test_model"
        )
