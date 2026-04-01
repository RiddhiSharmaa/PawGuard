from __future__ import annotations

import json
import logging
import os

from pydantic import BaseModel, Field

try:
    from crewai.tools import BaseTool
except Exception:
    class BaseTool:
        def __init__(self, **kwargs):
            for key, value in kwargs.items():
                setattr(self, key, value)

try:
    from crewai_tools import TavilySearchTool
except Exception:
    TavilySearchTool = None

logger = logging.getLogger(__name__)


class SearchNGOsInput(BaseModel):
    query: str = Field(description="Search query for finding animal rescue NGOs")


class FallbackNGOWebSearchTool(BaseTool):
    name: str = "search_ngos_web"
    description: str = (
        "Returns an empty result set when Tavily search is unavailable so rescue coordination "
        "can continue without crashing."
    )
    args_schema: type[BaseModel] = SearchNGOsInput

    def _run(self, query: str) -> str:
        return json.dumps(
            {
                "results": [],
                "warning": "Web NGO search is unavailable. Use database results instead.",
                "query": query,
            }
        )


def get_ngo_search_tool():
    if not os.getenv("TAVILY_API_KEY") or TavilySearchTool is None:
        return FallbackNGOWebSearchTool()

    try:
        return TavilySearchTool()
    except Exception:
        logger.exception("Failed to initialize Tavily search tool")
        return FallbackNGOWebSearchTool()
