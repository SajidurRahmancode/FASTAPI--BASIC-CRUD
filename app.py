"""AI prediction app: clean, robust endpoint to load a pickle model and serve predictions.

This file replaces the previous, malformed `app.py`. It will attempt to find a
`.pkl` model in a `models/` directory (or repository root) at startup using
`ai.loader.find_model_file`. If no model is found the /predict endpoint returns
503 until a model is available.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
import pandas as pd
from pathlib import Path
import logging

from ai.loader import find_model_file, load_model, find_metadata


logger = logging.getLogger("uvicorn.error")

# Expose router so main application can include these endpoints
ai_router = APIRouter()


class PredictInput(BaseModel):
    age: int = Field(..., gt=0)
    weight: float = Field(..., gt=0)
    height: float = Field(..., gt=0)
    income_lpa: float = Field(..., gt=0)
    smoker: bool
    city: Optional[str] = None
    occupation: Optional[str] = None


# Globals to hold the loaded model and metadata
MODEL = None
MODEL_PATH: Optional[Path] = None
MODEL_META: dict = {}


def init_model():
    """Attempt to find and load a model file. Called by the main app at startup."""
    global MODEL, MODEL_PATH, MODEL_META
    p = find_model_file(("models", "."))
    if p is None:
        logger.warning("No .pkl model found at startup. /predict will return 503 until a model is available.")
        return

    try:
        MODEL = load_model(p)
        MODEL_PATH = p
        MODEL_META = find_metadata(p)
        logger.info(f"Loaded model from {p} (type={type(MODEL)})")
    except Exception as e:
        logger.exception("Failed to load model at startup: %s", e)
        MODEL = None


@ai_router.get("/ai/health")
def health():
    return {"status": "ok", "model_loaded": MODEL is not None, "model_path": str(MODEL_PATH) if MODEL_PATH else None}


@ai_router.get("/models")
def list_models():
    """Return information about the loaded model (if any)."""
    if MODEL is None:
        raise HTTPException(status_code=404, detail="No model loaded")
    return {"path": str(MODEL_PATH), "type": str(type(MODEL)), "meta": MODEL_META}


@ai_router.post("/predict")
def predict(data: PredictInput):
    """Run a model prediction on the provided input."""

    if MODEL is None:
        raise HTTPException(status_code=503, detail="No model loaded")

    bmi = data.weight / (data.height ** 2) if data.height > 0 else 0.0
    lifestyle_risk = "low"
    if data.smoker and bmi > 30:
        lifestyle_risk = "high"
    elif data.smoker or bmi > 27:
        lifestyle_risk = "medium"

    age_group = "senior"
    if data.age < 25:
        age_group = "adult"
    elif data.age < 60:
        age_group = "middle_aged"

    df = pd.DataFrame([
        {
            "bmi": bmi,
            "age_group": age_group,
            "lifestyle_risk": lifestyle_risk,
            "income_lpa": data.income_lpa,
            "city": data.city or "",
            "occupation": data.occupation or "",
        }
    ])

    try:
        if hasattr(MODEL, "predict_proba"):
            probs = MODEL.predict_proba(df)
            pred = MODEL.predict(df)[0]
            return {"prediction": pred, "probabilities": probs.tolist()}
        else:
            pred = MODEL.predict(df)[0]
            return {"prediction": pred}
    except Exception as e:
        logger.exception("Prediction failed: %s", e)
        raise HTTPException(status_code=500, detail=f"Prediction failed: {e}")
