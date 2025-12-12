"""
FastAPI application entry point
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .api import agents, chat

# Try to import voice features (optional)
try:
    from .api import voice
    VOICE_AVAILABLE = True
except Exception as e:
    print(f"⚠️  Voice features disabled: {e}")
    VOICE_AVAILABLE = False

# Create FastAPI app
app = FastAPI(
    title="LangGraph Agent API",
    description="API for managing and executing LangGraph-powered AI agents",
    version="1.0.0",
    debug=settings.DEBUG
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(agents.router, prefix="/api", tags=["agents"])
app.include_router(chat.router, prefix="/api", tags=["chat"])

# Include voice router if available
    app.include_router(voice.router, prefix="/api", tags=["voice"])
    print("✅ Voice features enabled")
else:
    print("⚠️  Voice features disabled (missing API keys or dependencies)")

# Include SIP router
from .api import sip
app.include_router(sip.router, prefix="/api", tags=["sip"])


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "LangGraph Agent API",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )
