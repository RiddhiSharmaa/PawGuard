from __future__ import annotations

import os

from crewai import LLM

from config import load_backend_env


def get_groq_llm(model: str = "llama-3.3-70b-versatile", temperature: float = 0.1) -> LLM:
    load_backend_env()
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError("GROQ_API_KEY is not configured.")

    return LLM(
        model=model,
        provider="hosted_vllm",
        api_key=api_key,
        base_url="https://api.groq.com/openai/v1",
        temperature=temperature,
        max_tokens=700,
    )
