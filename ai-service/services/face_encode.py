from fastapi import UploadFile

from utils.image_utils import extract_single_face_features, upload_file_to_numpy


async def encode_face_image(
    upload_file: UploadFile,
    require_single_face: bool = False,
):
    image_array = await upload_file_to_numpy(upload_file)
    return extract_single_face_features(
        image_array,
        require_single_face=require_single_face,
    )
