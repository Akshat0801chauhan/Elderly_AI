from pathlib import Path
from typing import List
import json
import re

import numpy as np


class FaceStore:
    def __init__(self, storage_dir: Path, images_dir: Path) -> None:
        self.storage_dir = Path(storage_dir)
        self.images_dir = Path(images_dir)
        self.storage_dir.mkdir(parents=True, exist_ok=True)
        self.images_dir.mkdir(parents=True, exist_ok=True)

    def save_face(
        self,
        name: str,
        encoding: np.ndarray,
        image_bytes: bytes,
        image_suffix: str,
        relation: str | None = None,
    ) -> Path:
        slug = self._slugify(name)
        file_path = self.storage_dir / f"{slug}.json"
        image_path = self.images_dir / f"{slug}{self._normalize_suffix(image_suffix)}"
        payload = {
            "name": name,
            "slug": slug,
            "encoding": encoding.astype("float32").tolist(),
            "embedding_dim": int(encoding.shape[0]),
            "embedding_model": "insightface-buffalo_l",
            "image_path": str(image_path.name),
            "relation": relation,
        }
        file_path.write_text(json.dumps(payload), encoding="utf-8")
        image_path.write_bytes(image_bytes)
        return file_path

    def load_faces(self) -> List[dict]:
        faces = []
        for file_path in sorted(self.storage_dir.glob("*.json")):
            try:
                payload = json.loads(file_path.read_text(encoding="utf-8"))
                encoding = np.array(payload["encoding"], dtype="float32")
                faces.append(
                    {
                        "name": payload["name"],
                        "slug": payload.get("slug", file_path.stem),
                        "encoding": encoding,
                        "embedding_dim": int(payload.get("embedding_dim", encoding.shape[0])),
                        "embedding_model": payload.get("embedding_model", "legacy"),
                        "image_path": payload.get("image_path"),
                        "relation": payload.get("relation"),
                    }
                )
            except (KeyError, json.JSONDecodeError, OSError, TypeError, ValueError):
                continue
        return faces

    def list_faces(self) -> List[dict]:
        return [
            {
                "name": face["name"],
                "slug": face["slug"],
                "image_path": face.get("image_path"),
                "relation": face.get("relation"),
            }
            for face in self.load_faces()
        ]

    def get_face_image_path(self, slug: str) -> Path | None:
        for face in self.list_faces():
            if face["slug"] == slug and face.get("image_path"):
                image_path = self.images_dir / face["image_path"]
                if image_path.exists():
                    return image_path
        return None

    def _slugify(self, value: str) -> str:
        slug = re.sub(r"[^a-zA-Z0-9]+", "_", value.strip().lower()).strip("_")
        return slug or "unknown"

    def _normalize_suffix(self, value: str) -> str:
        suffix = value.lower().strip()
        if not suffix:
            return ".jpg"
        if not suffix.startswith("."):
            suffix = "." + suffix
        return suffix
