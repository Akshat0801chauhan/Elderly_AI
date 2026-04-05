from fastapi import FastAPI, File, Form, HTTPException, UploadFile

from models.face_store import FaceStore
from services.face_encode import encode_face_image
from services.face_match import FaceMatcher
from utils.config import get_settings


settings = get_settings()
store = FaceStore(settings.encodings_dir)
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
    image: UploadFile = File(...),
) -> dict:
    normalized_name = name.strip()
    if not normalized_name:
        raise HTTPException(status_code=400, detail="Name is required.")

    try:
        encoding = await encode_face_image(image, require_single_face=True)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    store.save_face(normalized_name, encoding)
    return {
        "message": f"Face enrolled successfully for {normalized_name}.",
        "name": normalized_name,
    }


@app.post("/recognize")
async def recognize_face(image: UploadFile = File(...)) -> dict:
    try:
        encoding = await encode_face_image(image)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    match = matcher.find_best_match(encoding)
    if match is None:
        return {
            "recognized": False,
            "message": "Face not found. Do you want to add this face?",
            "name": None,
            "suggest_enroll": True,
        }

    return {
        "recognized": True,
        "message": f"Recognized {match['name']}.",
        "name": match["name"],
        "distance": round(match["distance"], 4),
        "suggest_enroll": False,
    }


@app.get("/faces")
def list_faces() -> dict:
    return {"faces": store.list_faces()}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
