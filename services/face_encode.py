from fastapi import UploadFile

from services.face_engine import get_face_engine
from utils.config import get_settings
from utils.image_utils import upload_file_to_numpy


def _engine():
    settings = get_settings()
    return get_face_engine(
        model_name=settings.face_model_name,
        providers=settings.face_providers,
    )


async def encode_face_image(
    upload_file: UploadFile,
    require_single_face: bool = False,
):
    image_array = await upload_file_to_numpy(upload_file)
    return _engine().encode_single_face(
        image_array,
        require_single_face=require_single_face,
    )


async def detect_face_embeddings(upload_file: UploadFile):
    image_array = await upload_file_to_numpy(upload_file)
    return _engine().detect_faces(image_array)
