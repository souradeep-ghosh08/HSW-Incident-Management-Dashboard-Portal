from fastapi import APIRouter, HTTPException, status
from schemas import HealthCheckResponse
from config import settings
from database import engine
import logging

logger = logging.getLogger(__name__)
router = APIRouter(tags=["health"])

@router.get("/health", response_model=HealthCheckResponse)
async def health_check():
    """
    Health check endpoint
    """
    try:
        # Try to connect to database
        with engine.connect() as connection:
            db_status = "connected"
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        db_status = "disconnected"
    
    return HealthCheckResponse(
        status="healthy",
        version=settings.APP_VERSION,
        database=db_status
    )
