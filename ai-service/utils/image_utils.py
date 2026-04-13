from io import BytesIO

import numpy as np
from fastapi import UploadFile
from PIL import Image


async def upload_file_to_numpy(upload_file: UploadFile) -> np.ndarray:
    data = await upload_file.read()
    if not data:
        raise ValueError("Uploaded image is empty.")

    try:
        image = Image.open(BytesIO(data)).convert("RGB")
    except Exception as exc:
        raise ValueError("Invalid image file.") from exc

    return np.array(image)
