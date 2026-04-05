from io import BytesIO

import cv2
import numpy as np
from fastapi import UploadFile
from PIL import Image


CASCADE_PATH = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
FACE_CASCADE = cv2.CascadeClassifier(CASCADE_PATH)


async def upload_file_to_numpy(upload_file: UploadFile) -> np.ndarray:
    data = await upload_file.read()
    if not data:
        raise ValueError("Uploaded image is empty.")

    try:
        image = Image.open(BytesIO(data)).convert("RGB")
    except Exception as exc:
        raise ValueError("Invalid image file.") from exc

    return np.array(image)


def extract_single_face_features(
    image_array: np.ndarray,
    require_single_face: bool = False,
) -> np.ndarray:
    gray = cv2.cvtColor(image_array, cv2.COLOR_RGB2GRAY)
    faces = FACE_CASCADE.detectMultiScale(
        gray,
        scaleFactor=1.1,
        minNeighbors=5,
        minSize=(80, 80),
    )

    if len(faces) == 0:
        raise ValueError("No face detected in the image.")
    if require_single_face and len(faces) > 1:
        raise ValueError("Multiple faces detected. Please upload an image with one face.")

    # When multiple candidate faces are detected, use the largest one.
    # This makes recognition more forgiving for busy backgrounds or false positives.
    x, y, w, h = max(faces, key=lambda face: face[2] * face[3])
    face_region = gray[y : y + h, x : x + w]
    resized_face = cv2.resize(face_region, (200, 200))

    # Flatten the normalized grayscale face so we can store and compare it easily.
    normalized_face = resized_face.astype("float32") / 255.0
    return normalized_face.flatten()
