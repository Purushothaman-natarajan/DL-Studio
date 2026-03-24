from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import sys

# Path Setup for imports from sub-packages
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from api.router import router
from api.history_router import router as history_router
from fastapi.staticfiles import StaticFiles
from core.config import initialize_workspace, RUNS_DIR

def create_app() -> FastAPI:
    """Initialize the FastAPI application with sub-routers and configuration."""
    
    # 1. Start Workspace Directories
    initialize_workspace()
    logger.info("Workspace initialized at ./workspace/")

    # 2. Main App Instance
    app = FastAPI(
        title="DL-Studio Backend",
        description="Unified Local AI Machine Learning Studio",
        version="2.0.0"
    )

    # 3. CORS Middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # 4. Mount Routers
    app.include_router(router)
    app.include_router(history_router, prefix="/api")
    
    # 5. Static Artifacts
    if RUNS_DIR.exists():
        app.mount("/runs", StaticFiles(directory=str(RUNS_DIR)), name="runs")
        
    logger.info("API Routers and Static Workspace mounted.")

    return app

# The standard 'app' object for Uvicorn
app = create_app()

if __name__ == "__main__":
    import uvicorn
    logger.info("Launching DL-Studio Backend on Port 8000...")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
