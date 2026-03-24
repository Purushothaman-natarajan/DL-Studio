from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import os
import sys

# Path Setup for imports from sub-packages
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from api.router import router
from api.history_router import router as history_router
from fastapi.staticfiles import StaticFiles
from core.config import initialize_workspace, RUNS_DIR, WORKSPACE_DIR
from core.logger import logger, log_queue
import asyncio

def create_app() -> FastAPI:
    """Initialize the FastAPI application with sub-routers and configuration."""
    
    # 1. Start Workspace Directories
    initialize_workspace()
    logger.info(f"Workspace initialized at {WORKSPACE_DIR}")

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

    @app.get("/api/logs")
    async def stream_logs(request: Request):
        async def event_generator():
            while True:
                if await request.is_disconnected():
                    break
                if log_queue:
                    while log_queue:
                        yield f"data: {log_queue.popleft()}\n\n"
                await asyncio.sleep(0.5)
        return StreamingResponse(event_generator(), media_type="text/event-stream")

    return app

# The standard 'app' object for Uvicorn
app = create_app()

if __name__ == "__main__":
    import uvicorn
    logger.info("Launching DL-Studio Backend on Port 8000...")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
