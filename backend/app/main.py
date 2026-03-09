import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, get_engine
import app.models  # noqa: F401 – registers all ORM models with Base.metadata
from app.routers import auth, transactions, analysis, chat

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.database_url:
        for attempt in range(10):
            try:
                Base.metadata.create_all(bind=get_engine())
                logger.info("Database tables created/verified successfully")
                break
            except Exception as e:
                wait = 2 ** attempt
                logger.warning(f"DB connection attempt {attempt + 1}/10 failed: {e}. Retrying in {wait}s...")
                await asyncio.sleep(wait)
        else:
            logger.error("Could not connect to database after 10 attempts. Starting without DB.")
    yield


app = FastAPI(
    title="FinWise AI",
    description="AI-powered personal finance assistant API",
    version="1.0.0",
    lifespan=lifespan,
)

allow_all = settings.cors_origins == ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=not allow_all,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(transactions.router, prefix="/api/transactions", tags=["transactions"])
app.include_router(analysis.router, prefix="/api/analysis", tags=["analysis"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])


@app.get("/")
async def root():
    return {"message": "FinWise AI API", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
