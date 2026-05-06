from pathlib import Path
from typing import List
import json
import re
import uuid

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
        user_email: str | None = None,
    ) -> Path:
        slug = f"{self._slugify(name)}-{uuid.uuid4().hex[:8]}"
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
            "user_email": user_email,
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
                        "user_email": payload.get("user_email"),
                    }
                )
            except (KeyError, json.JSONDecodeError, OSError, TypeError, ValueError):
                continue
        return faces

    def list_faces(self, user_email: str | None = None) -> List[dict]:
        return [
            {
                "name": face["name"],
                "slug": face["slug"],
                "image_path": face.get("image_path"),
                "relation": face.get("relation"),
                "user_email": face.get("user_email"),
            }
            for face in self.load_faces()
            if user_email is None or face.get("user_email") == user_email
        ]

    def get_face_image_path(self, slug: str, user_email: str | None = None) -> Path | None:
        for face in self.load_faces():
            if face["slug"] == slug and face.get("image_path"):
                if user_email is not None and face.get("user_email") != user_email:
                    return None
                image_path = self.images_dir / face["image_path"]
                if image_path.exists():
                    return image_path
        return None

    def update_face(self, slug: str, name: str | None = None, relation: str | None = None, user_email: str | None = None) -> bool:
        file_path = self.storage_dir / f"{slug}.json"
        if not file_path.exists():
            return False
        
        try:
            payload = json.loads(file_path.read_text(encoding="utf-8"))
            if user_email is not None and payload.get("user_email") != user_email:
                return False
            
            if name is not None:
                payload["name"] = name
            if relation is not None:
                payload["relation"] = relation
            
            file_path.write_text(json.dumps(payload), encoding="utf-8")
            return True
        except (json.JSONDecodeError, OSError):
            return False

    def delete_face(self, slug: str, user_email: str | None = None) -> bool:
        file_path = self.storage_dir / f"{slug}.json"
        if not file_path.exists():
            return False
        
        try:
            payload = json.loads(file_path.read_text(encoding="utf-8"))
            if user_email is not None and payload.get("user_email") != user_email:
                return False
            
            # Delete the JSON file
            file_path.unlink()
            
            # Delete the image file if it exists
            image_path_str = payload.get("image_path")
            if image_path_str:
                image_path = self.images_dir / image_path_str
                if image_path.exists():
                    image_path.unlink()
            
            return True
        except (json.JSONDecodeError, OSError):
            return False

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
