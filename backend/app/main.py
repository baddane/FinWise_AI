import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import Base, get_engine
import app.models  # noqa: F401 – registers all ORM models with Base.metadata
from app.routers import auth, transactions, analysis, chat

logger = logging.getLogger(__name__)


async def _init_db():
    """Initialize DB tables in the background so startup is non-blocking.
    Retries indefinitely with capped backoff until the DB is reachable."""
    if not settings.database_url:
        return
    attempt = 0
    while True:
        attempt += 1
        try:
            Base.metadata.create_all(bind=get_engine())
            logger.info("Database tables created/verified successfully")
            return
        except Exception as e:
            wait = min(2 * attempt, 30)  # backoff capped at 30s
            logger.warning(f"DB connection attempt {attempt} failed: {e}. Retrying in {wait}s...")
            await asyncio.sleep(wait)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Run DB init in background — app is ready immediately so healthcheck passes.
    asyncio.create_task(_init_db())
    yield


app = FastAPI(
    title="FinWise AI",
    description="AI-powered personal finance assistant API",
    version="1.0.0",
    lifespan=lifespan,
    redirect_slashes=False,
)

origins = settings.get_cors_origins()
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=origins != ["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(transactions.router, prefix="/api/transactions", tags=["transactions"])
app.include_router(analysis.router, prefix="/api/analysis", tags=["analysis"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error on {request.method} {request.url}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)},
    )


@app.get("/")
async def root():
    return {"message": "FinWise AI API", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
