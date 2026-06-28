import logging
from logging.config import dictConfig
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from config import settings
from database import init_db, SessionLocal
from routes import auth, health, incidents, vendors, circles, dashboard, capa, excel_service, reports
import models
from database import Base, engine

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize seed data
def init_seed_data():
    """Initialize default admin user and other seed data"""
    from security import SecurityManager
    db = SessionLocal()
    try:
        # Check if admin user exists
        admin = db.query(models.User).filter(
            models.User.email == "admin@hsw-dashboard.local"
        ).first()
        
        if not admin:
            admin = models.User(
                email="admin@hsw-dashboard.local",
                username="admin",
                password_hash=SecurityManager.hash_password("admin123"),
                first_name="Super",
                last_name="Admin",
                role=models.RoleEnum.SUPER_ADMIN,
                is_active=True,
                is_verified=True
            )
            db.add(admin)
            db.commit()
            logger.info("Default admin user created")
    except Exception as e:
        logger.error(f"Error initializing seed data: {e}")
        db.rollback()
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    init_seed_data()
    yield
    # Shutdown
    logger.info(f"Shutting down {settings.APP_NAME}")

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="HSW Incident Management Dashboard Portal API",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors()}
    )

# Include routers
app.include_router(auth.router)
app.include_router(health.router)
app.include_router(incidents.router)
app.include_router(vendors.router)
app.include_router(circles.router)
app.include_router(dashboard.router)
app.include_router(capa.router)
app.include_router(excel_service.router)
app.include_router(reports.router)

# Root endpoint
@app.get("/")
async def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )
