import os
from langchain_community.chat_models import ChatOpenAI
from langchain_anthropic import ChatAnthropic


class LLMFactory:
    @staticmethod
    async def get_llm(callback, llm):
        match llm:
            case "gpt-4o-mini":
                model = await LLMFactory.get_openai(callback, llm, 'MODEL_LLM_OPENAI_GPT4O_API_KEY')
            case "gpt-3.5-turbo":
                model = await LLMFactory.get_openai(callback, llm, 'MODEL_LLM_OPENAI_GPT4O_API_KEY')
            case "gpt-4o":
                model = await LLMFactory.get_openai(callback, llm, 'MODEL_LLM_OPENAI_GPT4O_API_KEY')
            case "claude-3-5-sonnet-20240620":
                model = await LLMFactory.get_anthropic(callback,
                                                       llm,
                                                       'MODEL_LLM_ANTHROPIC_CLAUD35SONNET_API_KEY')
            case "llama3-70b-8192":
                model = await LLMFactory.get_openai_url(callback,
                                                        llm,
                                                        'MODEL_LLM_GROQ_LLAMA370B_API_KEY',
                                                        "https://api.groq.com/openai/v1/")
            case "codestral:22b":
                model = await LLMFactory.get_openai_url(callback,
                                                        llm,
                                                        'MODEL_LLM_OLLAMA_CODESTRAL222B_API_KEY',
                                                        "http://10.0.6.5:11434/v1/")
            case _:
                model = await LLMFactory.get_openai(callback,
                                                    "gpt-3.5-turbo",
                                                    'MODEL_LLM_OPENAI_GPT4O_API_KEY')
        return model

    @staticmethod
    async def get_anthropic(callback, llm, env_key):
        k = os.getenv(env_key, 'nokey')
        model = ChatAnthropic(
            streaming=True,
            verbose=True,
            callbacks=[callback],
            model=llm,
            model_name=llm,
            anthropic_api_key=k
        )
        return model

    @staticmethod
    async def get_openai(callback, llm, env_key):
        model = ChatOpenAI(
            streaming=True,
            verbose=True,
            callbacks=[callback],
            openai_api_key=os.getenv(env_key, 'nokey'),
            model_name=llm
        )
        return model

    @staticmethod
    async def get_openai_url(callback, llm, env_key, url):
        model = ChatOpenAI(
            base_url=url,
            streaming=True,
            verbose=True,
            callbacks=[callback],
            openai_api_key=os.getenv(env_key, 'nokey'),
            model_name=llm
        )
        return model

