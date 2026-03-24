import os
from pathlib import Path

# Base Paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent
WORKSPACE_DIR = BASE_DIR / "workspace"

RUNS_DIR = WORKSPACE_DIR / "runs"

# Training Defaults
DEFAULT_VALIDATION_SPLIT = 0.2
DEFAULT_PATIENCE = 5
Z_SCORE_THRESHOLD = 3.0

def initialize_workspace():
    """Ensure required workspace directories exist."""
    RUNS_DIR.mkdir(parents=True, exist_ok=True)

def get_run_dir(run_id):
    """Create and return a directory for a specific training run."""
    run_dir = RUNS_DIR / run_id
    for sub in ["models", "plots", "data", "logs"]:
        (run_dir / sub).mkdir(parents=True, exist_ok=True)
    return run_dir

def get_run_log_path(run_id):
    """Returns the log file path for a run and ensures the folder exists."""
    log_dir = RUNS_DIR / run_id / "logs"
    log_dir.mkdir(parents=True, exist_ok=True)
    return log_dir / "run.log"
