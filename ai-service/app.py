from pathlib import Path

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse

from models.face_store import FaceStore
from services.face_encode import detect_face_embeddings, encode_face_image
from services.face_match import FaceMatcher
from utils.config import get_settings


settings = get_settings()
store = FaceStore(settings.encodings_dir, settings.images_dir)
matcher = FaceMatcher(store, threshold=settings.match_threshold)

app = FastAPI(
    title="Face Recognition Service",
    description="Register a user's face once and recognize them on later uploads.",
    version="1.0.0",
)


@app.get("/health")
def health_check() -> dict:
    return {"status": "ok"}


@app.post("/enroll")
async def enroll_face(
    name: str = Form(...),
    relation: str | None = Form(None),
    user_email: str = Form(...),
    image: UploadFile = File(...),
) -> dict:
    normalized_name = name.strip()
    if not normalized_name:
        raise HTTPException(status_code=400, detail="Name is required.")

    image_bytes = await image.read()
    await image.seek(0)

    try:
        encoding = await encode_face_image(image, require_single_face=True)
    except (RuntimeError, ValueError) as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    suffix = Path(image.filename or "upload.jpg").suffix or ".jpg"
    normalized_relation = relation.strip() if relation else None
    face = store.save_face(
        normalized_name,
        encoding,
        image_bytes,
        suffix,
        normalized_relation,
        user_email.strip(),
    )

    return {
        "message": f"Face enrolled successfully for {normalized_name}.",
        "name": normalized_name,
        "relation": normalized_relation,
        "slug": Path(face).stem,
        "user_email": user_email.strip(),
    }


@app.post("/recognize")
async def recognize_face(
    image: UploadFile = File(...),
    user_email: str | None = Form(None),
) -> dict:
    try:
        detected_faces = await detect_face_embeddings(image)
    except (RuntimeError, ValueError) as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    if not detected_faces:
        raise HTTPException(status_code=400, detail="No face detected in the image.")

    matches = matcher.find_matches(
        [face.embedding for face in detected_faces],
        user_email=user_email.strip() if user_email else None,
    )
    if not matches:
        return {
            "recognized": False,
            "message": "No saved faces were recognized in the image.",
            "name": None,
            "matches": [],
            "detected_faces": len(detected_faces),
            "suggest_enroll": True,
        }

    best_match = max(matches, key=lambda match: match["similarity"])
    return {
        "recognized": True,
        "message": f"Recognized {best_match['name']} in the image.",
        "name": best_match["name"],
        "similarity": round(best_match["similarity"], 4),
        "detected_faces": len(detected_faces),
        "matches": [
            {
                "face_index": match["face_index"],
                "name": match["name"],
                "similarity": round(match["similarity"], 4),
                "bbox": detected_faces[match["face_index"]].bbox,
                "detection_score": round(
                    detected_faces[match["face_index"]].detection_score,
                    4,
                ),
            }
            for match in matches
        ],
        "suggest_enroll": False,
    }


@app.get("/faces")
def list_faces(user_email: str | None = None) -> dict:
    faces = []
    for face in store.list_faces(user_email.strip() if user_email else None):
        query_param = f"?user_email={user_email.strip()}" if user_email else ""
        faces.append(
            {
                "name": face["name"],
                "slug": face["slug"],
                "relation": face.get("relation"),
                "image_url": (
                    f"http://127.0.0.1:8000/faces/{face['slug']}/image{query_param}"
                    if face.get("image_path")
                    else None
                ),
            }
        )
    return {"faces": faces}


@app.get("/faces/{face_slug}/image")
def get_face_image(face_slug: str, user_email: str | None = None):
    image_path = store.get_face_image_path(face_slug, user_email.strip() if user_email else None)
    if image_path is None:
        raise HTTPException(status_code=404, detail="Face image not found.")
    return FileResponse(image_path)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
