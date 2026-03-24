from fastapi import APIRouter, HTTPException
import os
import json
from pathlib import Path
from core.config import RUNS_DIR

router = APIRouter()

@router.get("/history")
async def get_history():
    """Returns a list of all historical training runs."""
    runs = []
    if not RUNS_DIR.exists():
        return []
        
    for run_id in sorted(os.listdir(RUNS_DIR), reverse=True):
        manifest_path = RUNS_DIR / run_id / "manifest.json"
        if manifest_path.exists():
            try:
                with open(manifest_path, "r") as f:
                    runs.append(json.load(f))
            except Exception as e:
                continue
    return runs

@router.get("/history/{run_id}")
async def get_run_details(run_id: str):
    """Returns the full manifest for a specific run."""
    manifest_path = RUNS_DIR / run_id / "manifest.json"
    if not manifest_path.exists():
        raise HTTPException(status_code=404, detail="Run not found")
        
    with open(manifest_path, "r") as f:
        return json.load(f)
