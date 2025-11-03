from pathlib import Path
import pickle
import json
from typing import Any, Dict, Optional


def find_model_file(search_dirs=("models", ".")) -> Optional[Path]:
    """Return the first .pkl file found in the provided search dirs."""
    for d in search_dirs:
        p = Path(d)
        if not p.exists():
            continue
        # search non-recursively first
        for f in p.glob("*.pkl"):
            return f
        # fallback to recursive search
        for f in p.rglob("*.pkl"):
            return f
    return None


def load_model(path: Path) -> Any:
    """Safely load a pickle model. Raises if loading fails."""
    # `path` should be a Path pointing to the .pkl file. Handle the case where
    # a directory or a string was passed accidentally by resolving to an actual
    # .pkl file when needed.
    model_path = Path(path)
    if model_path.is_dir():
        # search inside the directory for a .pkl
        candidate = find_model_file((str(model_path),))
        if candidate is None:
            raise FileNotFoundError(f"No .pkl model found in directory: {model_path}")
        model_path = candidate

    # Open the model file in binary read mode and unpickle it.
    with model_path.open("rb") as f:
        return pickle.load(f)


def find_metadata(path: Path) -> Dict:
    """Load JSON metadata next to a model file if present (same stem + .json)."""
    meta_path = path.with_suffix(".json")
    if meta_path.exists():
        try:
            with meta_path.open("r", encoding="utf-8") as fh:
                return json.load(fh)
        except Exception:
            return {}
    return {}
