from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache

import numpy as np

try:
    from insightface.app import FaceAnalysis
except ImportError:  # pragma: no cover - depends on optional runtime dependency
    FaceAnalysis = None


@dataclass(frozen=True)
class DetectedFace:
    embedding: np.ndarray
    bbox: list[float]
    detection_score: float


class FaceEngine:
    def __init__(
        self,
        model_name: str = "buffalo_l",
        providers: list[str] | None = None,
        det_size: tuple[int, int] = (640, 640),
    ) -> None:
        if FaceAnalysis is None:
            raise RuntimeError(
                "InsightFace is not installed. Install dependencies from requirements.txt."
            )

        selected_providers = providers or ["CPUExecutionProvider"]
        self.app = FaceAnalysis(name=model_name, providers=selected_providers)
        self.app.prepare(ctx_id=0, det_size=det_size)

    def detect_faces(self, image_array: np.ndarray) -> list[DetectedFace]:
        faces = self.app.get(image_array)
        detected_faces: list[DetectedFace] = []
        for face in faces:
            embedding = getattr(face, "embedding", None)
            bbox = getattr(face, "bbox", None)
            if embedding is None or bbox is None:
                continue

            normalized_embedding = self._normalize(np.asarray(embedding, dtype="float32"))
            detected_faces.append(
                DetectedFace(
                    embedding=normalized_embedding,
                    bbox=np.asarray(bbox, dtype="float32").round(2).tolist(),
                    detection_score=float(getattr(face, "det_score", 0.0)),
                )
            )
        return detected_faces

    def encode_single_face(
        self,
        image_array: np.ndarray,
        require_single_face: bool = False,
    ) -> np.ndarray:
        faces = self.detect_faces(image_array)
        if not faces:
            raise ValueError("No face detected in the image.")
        if require_single_face and len(faces) > 1:
            raise ValueError("Multiple faces detected. Please upload an image with one face.")
        return max(faces, key=lambda face: face.detection_score).embedding

    @staticmethod
    def _normalize(embedding: np.ndarray) -> np.ndarray:
        norm = np.linalg.norm(embedding)
        if norm == 0:
            raise ValueError("Invalid face embedding generated.")
        return embedding / norm


@lru_cache
def get_face_engine(
    model_name: str = "buffalo_l",
    providers: tuple[str, ...] = ("CPUExecutionProvider",),
    det_size: tuple[int, int] = (640, 640),
) -> FaceEngine:
    return FaceEngine(
        model_name=model_name,
        providers=list(providers),
        det_size=det_size,
    )
