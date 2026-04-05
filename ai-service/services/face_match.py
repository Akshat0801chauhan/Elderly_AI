from typing import Optional

import numpy as np

from models.face_store import FaceStore


class FaceMatcher:
    def __init__(self, store: FaceStore, threshold: float = 0.6) -> None:
        self.store = store
        self.threshold = threshold

    def find_best_match(self, probe_encoding: np.ndarray) -> Optional[dict]:
        known_faces = self.store.load_faces()
        if not known_faces:
            return None

        names = [face["name"] for face in known_faces]
        encodings = [face["encoding"] for face in known_faces]
        distances = np.linalg.norm(np.array(encodings) - probe_encoding, axis=1)
        best_index = int(np.argmin(distances))
        best_distance = float(distances[best_index])

        if best_distance > self.threshold:
            return None

        return {"name": names[best_index], "distance": best_distance}
