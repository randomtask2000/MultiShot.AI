from dotenv import load_dotenv
from langchain_community.chat_models import ChatOpenAI
from langchain_core.callbacks import StreamingStdOutCallbackHandler
from langchain_core.messages import HumanMessage
import os
#from langchain_community.schema import HumanMessage

load_dotenv()

#from langchain_core.callbacks.streaming_stdout import StreamingStdOutCallbackHandler

API_KEY = os.getenv('OPENAI_API_KEY', 'default_value_if_not_found')

chat = ChatOpenAI(api_key=API_KEY,
    streaming=True, callbacks=[StreamingStdOutCallbackHandler()], temperature=0
)
print(chat([HumanMessage(content="Write me a song about sparkling water.")]))
