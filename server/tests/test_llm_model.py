import unittest
from unittest.mock import patch, MagicMock, call
from server.utils.llm_factory import LLMFactory


class TestLLMFactory(unittest.TestCase):
    @patch('llm_model.ChatOpenAI')
    @patch('llm_model.ChatAnthropic')
    @patch('os.getenv')
    async def test_get_llm(self, mock_getenv, mock_chat_anthropic, mock_chat_openai):
        mock_getenv.return_value = 'test_api_key'
        mock_callback = MagicMock()

        test_cases = [
            ("gpt-4o-mini", mock_chat_openai, False),
            ("gpt-3.5-turbo", mock_chat_openai, False),
            ("gpt-4o", mock_chat_openai, False),
            ("claude-3-5-sonnet-20240620", mock_chat_anthropic, False),
            ("llama3-70b-8192", mock_chat_openai, True),
            ("codestral:22b", mock_chat_openai, True),
            ("unknown_model", mock_chat_openai, False),
        ]

        for llm, mock_class, has_base_url in test_cases:
            with self.subTest(llm=llm):
                await LLMFactory.get_llm(mock_callback, llm)

                expected_kwargs = {
                    "streaming": True,
                    "verbose": True,
                    "callbacks": [mock_callback],
                    "model_name": llm,
                }

                if llm == "claude-3-5-sonnet-20240620":
                    expected_kwargs["api_key"] = 'test_api_key'
                else:
                    expected_kwargs["openai_api_key"] = 'test_api_key'

                if has_base_url:
                    if llm == "llama3-70b-8192":
                        expected_kwargs["base_url"] = "https://api.groq.com/openai/v1/"
                    elif llm == "codestral:22b":
                        expected_kwargs["base_url"] = "http://10.0.6.5:11434/v1/"

                mock_class.assert_called_once_with(**expected_kwargs)
                mock_class.reset_mock()


if __name__ == '__main__':
    unittest.main()
