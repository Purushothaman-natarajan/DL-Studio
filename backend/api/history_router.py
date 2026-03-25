from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
import os
import json
import shutil
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


@router.get("/history/{run_id}/logs")
async def get_run_logs(run_id: str, limit: int = 400):
    """Returns the latest log lines for a specific run."""
    root_dir = RUNS_DIR.resolve()
    run_path = (RUNS_DIR / run_id).resolve()
    if root_dir not in run_path.parents:
        raise HTTPException(status_code=400, detail="Invalid run_id")

    log_path = run_path / "logs" / "run.log"
    if not log_path.exists():
        return {"status": "success", "run_id": run_id, "lines": []}

    safe_limit = max(1, min(limit, 1000))
    try:
        with open(log_path, "r", encoding="utf-8") as f:
            lines = [line.rstrip("\n") for line in f if line.strip()]
    except OSError as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    return {"status": "success", "run_id": run_id, "lines": lines[-safe_limit:]}


@router.delete("/history/{run_id}")
async def delete_run(run_id: str):
    """Delete a specific training run."""
    root_dir = RUNS_DIR.resolve()
    run_path = (RUNS_DIR / run_id).resolve()
    if root_dir not in run_path.parents:
        raise HTTPException(status_code=400, detail="Invalid run_id")
    if not run_path.exists():
        raise HTTPException(status_code=404, detail="Run not found")
    shutil.rmtree(run_path)
    return JSONResponse({"status": "success", "deleted": run_id})


@router.delete("/history")
async def delete_all_runs():
    """Delete ALL training runs."""
    if not RUNS_DIR.exists():
        return JSONResponse({"status": "success", "deleted": 0})
    count = 0
    for run_id in os.listdir(RUNS_DIR):
        run_path = RUNS_DIR / run_id
        if run_path.is_dir():
            shutil.rmtree(run_path)
            count += 1
    return JSONResponse({"status": "success", "deleted": count})
