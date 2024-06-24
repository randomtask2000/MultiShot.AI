from setuptools import setup, find_packages

setup(
    name="ai_js_langchain_example",
    version="0.1.0",
    description="Little project that shows how to create a UI with basic JS supported by a FastAPI backend",
    author="Emilio Nicoli",
    author_email="emilionicoli@gmail.com",
    packages=find_packages(),
    install_requires=[
        "uvicorn",
        "python-dotenv",
        "fastapi",
        "langchain",
        "langchain-community",
        "langchain-core",
        "langchain-openai",
        "pydantic",
        "starlette"
    ],
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
    python_requires='>=3.7',
)