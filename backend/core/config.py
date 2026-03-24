import os
from pathlib import Path

# Base Paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent
WORKSPACE_DIR = BASE_DIR / "workspace"

# Workspace Subfolders
RAW_DIR = WORKSPACE_DIR / "raw"
CLEANED_DIR = WORKSPACE_DIR / "cleaned"
MODELS_DIR = WORKSPACE_DIR / "models"
LOGS_DIR = WORKSPACE_DIR / "logs"
PLOTS_DIR = WORKSPACE_DIR / "plots"
RUNS_DIR = WORKSPACE_DIR / "runs"

# Training Defaults
DEFAULT_VALIDATION_SPLIT = 0.2
DEFAULT_PATIENCE = 5
Z_SCORE_THRESHOLD = 3.0

def initialize_workspace():
    """Ensure all required workspace directories exist."""
    for directory in [RAW_DIR, CLEANED_DIR, MODELS_DIR, LOGS_DIR, PLOTS_DIR, RUNS_DIR]:
        directory.mkdir(parents=True, exist_ok=True)

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
