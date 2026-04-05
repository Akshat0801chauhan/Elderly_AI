from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
import os


BASE_DIR = Path(__file__).resolve().parent.parent
DEFAULT_ENCODINGS_DIR = BASE_DIR / "data" / "encodings"


@dataclass(frozen=True)
class Settings:
    encodings_dir: Path
    match_threshold: float


@lru_cache
def get_settings() -> Settings:
    encodings_dir = Path(
        os.getenv("FACE_ENCODINGS_DIR", str(DEFAULT_ENCODINGS_DIR))
    ).resolve()
    match_threshold = float(os.getenv("FACE_MATCH_THRESHOLD", "70.0"))
    encodings_dir.mkdir(parents=True, exist_ok=True)
    return Settings(
        encodings_dir=encodings_dir,
        match_threshold=match_threshold,
    )
