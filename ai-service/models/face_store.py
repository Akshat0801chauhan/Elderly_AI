from pathlib import Path
from typing import List
import json
import re

import numpy as np


class FaceStore:
    def __init__(self, storage_dir: Path) -> None:
        self.storage_dir = Path(storage_dir)
        self.storage_dir.mkdir(parents=True, exist_ok=True)

    def save_face(self, name: str, encoding: np.ndarray) -> Path:
        file_path = self.storage_dir / f"{self._slugify(name)}.json"
        payload = {"name": name, "encoding": encoding.tolist()}
        file_path.write_text(json.dumps(payload), encoding="utf-8")
        return file_path

    def load_faces(self) -> List[dict]:
        faces = []
        for file_path in sorted(self.storage_dir.glob("*.json")):
            try:
                payload = json.loads(file_path.read_text(encoding="utf-8"))
                faces.append(
                    {
                        "name": payload["name"],
                        "encoding": np.array(payload["encoding"]),
                    }
                )
            except (KeyError, json.JSONDecodeError, OSError, TypeError, ValueError):
                continue
        return faces

    def list_faces(self) -> List[str]:
        return [face["name"] for face in self.load_faces()]

    def _slugify(self, value: str) -> str:
        slug = re.sub(r"[^a-zA-Z0-9]+", "_", value.strip().lower()).strip("_")
        return slug or "unknown"
