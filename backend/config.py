from __future__ import annotations

import logging
import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
_ENV_LOADED = False
_CREWAI_PATCHED = False


def load_backend_env() -> None:
    global _ENV_LOADED
    if _ENV_LOADED:
        return

    runtime_dir = BASE_DIR / ".runtime"
    runtime_dir.mkdir(parents=True, exist_ok=True)
    os.environ["LOCALAPPDATA"] = str(runtime_dir)
    os.environ["APPDATA"] = str(runtime_dir)
    os.environ["XDG_DATA_HOME"] = str(runtime_dir)
    os.environ.setdefault("CREWAI_TRACING_ENABLED", "false")
    os.environ.setdefault("OTEL_SDK_DISABLED", "true")

    load_dotenv(BASE_DIR.parent / ".env", override=False)
    load_dotenv(BASE_DIR.parent / ".env.local", override=False)
    load_dotenv(BASE_DIR / ".env", override=False)
    _ENV_LOADED = True


def configure_crewai_runtime() -> None:
    global _CREWAI_PATCHED
    if _CREWAI_PATCHED:
        return

    load_backend_env()
    crewai_runtime_dir = BASE_DIR / ".runtime" / "crewai"
    crewai_runtime_dir.mkdir(parents=True, exist_ok=True)

    try:
        from crewai.memory.storage import kickoff_task_outputs_storage
        from crewai.utilities import task_output_storage_handler
        from crewai.utilities import paths

        class NoOpKickoffTaskOutputsStorage:
            def __init__(self, db_path: str | None = None) -> None:
                self.db_path = db_path

            def add(self, *args, **kwargs) -> None:
                return None

            def update(self, *args, **kwargs) -> None:
                return None

            def load(self) -> list[dict]:
                return []

            def delete_all(self) -> None:
                return None

        paths.db_storage_path = lambda: str(crewai_runtime_dir)
        kickoff_task_outputs_storage.db_storage_path = lambda: str(crewai_runtime_dir)
        kickoff_task_outputs_storage.KickoffTaskOutputsSQLiteStorage = NoOpKickoffTaskOutputsStorage
        task_output_storage_handler.KickoffTaskOutputsSQLiteStorage = NoOpKickoffTaskOutputsStorage
        _CREWAI_PATCHED = True
    except Exception:
        logging.getLogger(__name__).exception("Failed to patch CrewAI runtime storage path")


def configure_logging() -> None:
    load_backend_env()
    configure_crewai_runtime()

    level_name = os.getenv("LOG_LEVEL", "INFO").upper()
    level = getattr(logging, level_name, logging.INFO)

    root_logger = logging.getLogger()
    if not root_logger.handlers:
        logging.basicConfig(
            level=level,
            format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
        )
    else:
        root_logger.setLevel(level)
