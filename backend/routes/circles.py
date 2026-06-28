from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from database import get_db
from models import Circle, User
from dependencies import get_current_active_user
from datetime import datetime
import uuid
import logging
from pydantic import BaseModel, Field
from typing import Optional, List

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/circles", tags=["circles"])

# ==================== Circle Schemas ====================

class CircleCreate(BaseModel):
    code: str = Field(..., min_length=1, max_length=50)
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    location: Optional[str] = None
    is_active: bool = True

class CircleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    is_active: Optional[bool] = None

class CircleResponse(BaseModel):
    id: uuid.UUID
    code: str
    name: str
    description: Optional[str]
    location: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class CirclesListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    pages: int
    data: List[CircleResponse]

# ==================== Routes ====================

@router.get("/", response_model=CirclesListResponse)
async def list_circles(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    is_active: Optional[bool] = None,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    List circles with pagination and filtering
    """
    query = db.query(Circle)
    
    # Apply filters
    if is_active is not None:
        query = query.filter(Circle.is_active == is_active)
    if search:
        query = query.filter(
            Circle.name.ilike(f"%{search}%") |
            Circle.code.ilike(f"%{search}%") |
            Circle.location.ilike(f"%{search}%")
        )
    
    # Count total
    total = query.count()
    
    # Apply pagination
    skip = (page - 1) * page_size
    circles = query.order_by(Circle.created_at.desc()).offset(skip).limit(page_size).all()
    
    return CirclesListResponse(
        total=total,
        page=page,
        page_size=page_size,
        pages=(total + page_size - 1) // page_size,
        data=circles
    )

@router.post("/", response_model=CircleResponse, status_code=status.HTTP_201_CREATED)
async def create_circle(
    circle_data: CircleCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Create a new circle
    """
    # Check if code already exists
    existing = db.query(Circle).filter(Circle.code == circle_data.code).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Circle code already exists"
        )
    
    circle = Circle(
        code=circle_data.code,
        name=circle_data.name,
        description=circle_data.description,
        location=circle_data.location,
        is_active=circle_data.is_active,
        created_by=current_user.id,
        updated_by=current_user.id
    )
    
    db.add(circle)
    db.commit()
    db.refresh(circle)
    
    logger.info(f"Circle {circle.code} created by {current_user.email}")
    return circle

@router.get("/{circle_id}", response_model=CircleResponse)
async def get_circle(
    circle_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get circle by ID
    """
    circle = db.query(Circle).filter(Circle.id == circle_id).first()
    if not circle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Circle not found"
        )
    return circle

@router.put("/{circle_id}", response_model=CircleResponse)
async def update_circle(
    circle_id: uuid.UUID,
    circle_data: CircleUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Update circle
    """
    circle = db.query(Circle).filter(Circle.id == circle_id).first()
    if not circle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Circle not found"
        )
    
    # Update fields
    update_data = circle_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if value is not None:
            setattr(circle, field, value)
    
    circle.updated_by = current_user.id
    circle.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(circle)
    
    logger.info(f"Circle {circle.code} updated by {current_user.email}")
    return circle

@router.delete("/{circle_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_circle(
    circle_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Delete circle (soft delete - deactivate)
    """
    circle = db.query(Circle).filter(Circle.id == circle_id).first()
    if not circle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Circle not found"
        )
    
    circle.is_active = False
    circle.updated_by = current_user.id
    db.commit()
    
    logger.info(f"Circle {circle.code} deactivated by {current_user.email}")
