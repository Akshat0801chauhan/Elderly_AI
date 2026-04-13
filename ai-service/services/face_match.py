from typing import Optional

import numpy as np

from models.face_store import FaceStore


class FaceMatcher:
    def __init__(self, store: FaceStore, threshold: float = 0.45) -> None:
        self.store = store
        self.threshold = threshold

    def find_best_match(self, probe_encoding: np.ndarray) -> Optional[dict]:
        known_faces = self.store.load_faces()
        return self._find_best_match_from_faces(probe_encoding, known_faces)

    def find_matches(self, probe_encodings: list[np.ndarray]) -> list[dict]:
        known_faces = self.store.load_faces()
        matches: list[dict] = []
        seen_names: set[str] = set()

        for index, probe_encoding in enumerate(probe_encodings):
            match = self._find_best_match_from_faces(probe_encoding, known_faces)
            if match is None:
                continue
            if match["name"] in seen_names:
                continue

            seen_names.add(match["name"])
            matches.append(
                {
                    "face_index": index,
                    "name": match["name"],
                    "similarity": match["similarity"],
                }
            )

        return matches

    def _find_best_match_from_faces(
        self,
        probe_encoding: np.ndarray,
        known_faces: list[dict],
    ) -> Optional[dict]:
        if not known_faces:
            return None

        compatible_faces = [
            face for face in known_faces if face["encoding"].shape == probe_encoding.shape
        ]
        if not compatible_faces:
            return None

        names = [face["name"] for face in compatible_faces]
        encodings = np.array([face["encoding"] for face in compatible_faces], dtype="float32")
        similarities = encodings @ probe_encoding
        best_index = int(np.argmax(similarities))
        best_similarity = float(similarities[best_index])

        if best_similarity < self.threshold:
            return None

        return {"name": names[best_index], "similarity": best_similarity}
