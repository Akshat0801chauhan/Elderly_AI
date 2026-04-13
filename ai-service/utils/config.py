from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
import os


BASE_DIR = Path(__file__).resolve().parent.parent
DEFAULT_ENCODINGS_DIR = BASE_DIR / "data" / "encodings"


@dataclass(frozen=True)
class Settings:
    encodings_dir: Path
    images_dir: Path
    match_threshold: float
    face_model_name: str
    face_providers: tuple[str, ...]


@lru_cache
def get_settings() -> Settings:
    encodings_dir = Path(
        os.getenv("FACE_ENCODINGS_DIR", str(DEFAULT_ENCODINGS_DIR))
    ).resolve()
    images_dir = Path(
        os.getenv("FACE_IMAGES_DIR", str(encodings_dir.parent / "images"))
    ).resolve()
    match_threshold = float(os.getenv("FACE_MATCH_THRESHOLD", "0.45"))
    face_model_name = os.getenv("FACE_MODEL_NAME", "buffalo_l")
    face_providers = tuple(
        provider.strip()
        for provider in os.getenv("FACE_PROVIDERS", "CPUExecutionProvider").split(",")
        if provider.strip()
    )
    encodings_dir.mkdir(parents=True, exist_ok=True)
    images_dir.mkdir(parents=True, exist_ok=True)
    return Settings(
        encodings_dir=encodings_dir,
        images_dir=images_dir,
        match_threshold=match_threshold,
        face_model_name=face_model_name,
        face_providers=face_providers,
    )
