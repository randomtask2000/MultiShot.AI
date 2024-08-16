import os
from langchain_community.chat_models import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from server.utils.history import LlmProvider


class LLMFactory:
    @staticmethod
    async def get_llm(callback, llm_settings: LlmProvider):
        llm = llm_settings.provider
        match llm:
            case "openai":
                model = await LLMFactory.get_openai_url(
                    callback, llm_settings.model, llm_settings.apiKeyName, llm_settings.apiBase
                )
            case "anthropic":
                model = await LLMFactory.get_anthropic(
                    callback, llm_settings.model, llm_settings.apiKeyName
                )
            case "mistral":
                model = await LLMFactory.get_openai_url(
                    callback, llm_settings.model, llm_settings.apiKeyName, "https://api.mistral.ai/v1/"
                )
            case "groq":
                model = await LLMFactory.get_openai_url(
                    callback, llm_settings.model, llm_settings.apiKeyName, "https://api.groq.com/openai/v1/"
                )
            case "ollama":
                model = await LLMFactory.get_openai_url(
                    callback, llm_settings.model, llm_settings.apiKeyName, "http://10.0.6.5:11434/v1/"
                )
            case _:
                model = await LLMFactory.get_openai(
                    callback, "gpt-3.5-turbo", "OPENAI_API_KEY"
                )
        return model

    @staticmethod
    async def get_anthropic(callback, llm, env_key):
        model = ChatAnthropic(
            streaming=True,
            verbose=True,
            callbacks=[callback],
            model=llm,
            model_name=llm,
            anthropic_api_key=os.getenv(env_key + '_KEY', 'nokey'),
        )
        return model

    @staticmethod
    async def get_openai(callback, llm, env_key):
        model = ChatOpenAI(
            streaming=True,
            verbose=True,
            callbacks=[callback],
            openai_api_key=os.getenv(env_key + '_KEY', 'nokey'),
            model_name=llm
        )
        return model

    @staticmethod
    async def get_openai_url(callback, llm, env_key, url):
        if url is None:
            model = await LLMFactory.get_openai(callback, llm, env_key)
        else:
            model = ChatOpenAI(
                base_url=url,
                streaming=True,
                verbose=True,
                callbacks=[callback],
                openai_api_key=os.getenv(env_key + '_KEY', 'nokey'),
                model_name=llm
            )
        return model