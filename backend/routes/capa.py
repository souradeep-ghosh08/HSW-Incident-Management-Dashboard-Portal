from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from database import get_db
from models import CAPA, Incident, User, CapaStatusEnum
from dependencies import get_current_active_user
from datetime import datetime
import uuid
import logging
from pydantic import BaseModel, Field
from typing import Optional, List

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/capa", tags=["capa"])

# ==================== CAPA Schemas ====================

class CAPACreate(BaseModel):
    incident_id: uuid.UUID
    title: str = Field(..., min_length=1, max_length=255)
    description: str = Field(..., min_length=1)
    corrective_action: Optional[str] = None
    preventive_action: Optional[str] = None
    assigned_to: uuid.UUID
    due_date: datetime

class CAPAUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    corrective_action: Optional[str] = None
    preventive_action: Optional[str] = None
    assigned_to: Optional[uuid.UUID] = None
    due_date: Optional[datetime] = None
    completed_date: Optional[datetime] = None

class CAPAResponse(BaseModel):
    id: uuid.UUID
    capa_number: str
    incident_id: uuid.UUID
    status: str
    title: str
    description: str
    corrective_action: Optional[str]
    preventive_action: Optional[str]
    due_date: datetime
    completed_date: Optional[datetime]
    is_overdue: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class CAPAsListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    pages: int
    data: List[CAPAResponse]

# ==================== Routes ====================

@router.get("/", response_model=CAPAsListResponse)
async def list_capa(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    status: Optional[str] = None,
    is_overdue: Optional[bool] = None,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    List CAPA with pagination and filtering
    """
    query = db.query(CAPA)
    
    # Apply filters
    if status:
        query = query.filter(CAPA.status == status)
    if is_overdue is not None:
        query = query.filter(CAPA.is_overdue == is_overdue)
    if search:
        query = query.filter(
            CAPA.title.ilike(f"%{search}%") |
            CAPA.capa_number.ilike(f"%{search}%") |
            CAPA.description.ilike(f"%{search}%")
        )
    
    # Count total
    total = query.count()
    
    # Apply pagination
    skip = (page - 1) * page_size
    capa_records = query.order_by(CAPA.created_at.desc()).offset(skip).limit(page_size).all()
    
    return CAPAsListResponse(
        total=total,
        page=page,
        page_size=page_size,
        pages=(total + page_size - 1) // page_size,
        data=capa_records
    )

@router.post("/", response_model=CAPAResponse, status_code=status.HTTP_201_CREATED)
async def create_capa(
    capa_data: CAPACreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Create a new CAPA record
    """
    # Check incident exists
    incident = db.query(Incident).filter(Incident.id == capa_data.incident_id).first()
    if not incident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incident not found"
        )
    
    # Generate CAPA number
    from sqlalchemy import func
    capa_count = db.query(func.count(CAPA.id)).scalar() + 1
    capa_number = f"CAPA-{datetime.utcnow().strftime('%Y%m%d')}-{capa_count:05d}"
    
    capa = CAPA(
        capa_number=capa_number,
        incident_id=capa_data.incident_id,
        title=capa_data.title,
        description=capa_data.description,
        corrective_action=capa_data.corrective_action,
        preventive_action=capa_data.preventive_action,
        assigned_to=capa_data.assigned_to,
        due_date=capa_data.due_date,
        created_by=current_user.id,
        updated_by=current_user.id
    )
    
    db.add(capa)
    db.commit()
    db.refresh(capa)
    
    logger.info(f"CAPA {capa_number} created by {current_user.email}")
    return capa

@router.get("/{capa_id}", response_model=CAPAResponse)
async def get_capa(
    capa_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get CAPA by ID
    """
    capa = db.query(CAPA).filter(CAPA.id == capa_id).first()
    if not capa:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="CAPA not found"
        )
    return capa

@router.put("/{capa_id}", response_model=CAPAResponse)
async def update_capa(
    capa_id: uuid.UUID,
    capa_data: CAPAUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Update CAPA record
    """
    capa = db.query(CAPA).filter(CAPA.id == capa_id).first()
    if not capa:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="CAPA not found"
        )
    
    # Update fields
    update_data = capa_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if value is not None:
            if field == "completed_date" and value:
                capa.status = "completed"
            setattr(capa, field, value)
    
    # Check if overdue
    if capa.due_date and datetime.utcnow() > capa.due_date and capa.status != "completed":
        capa.is_overdue = True
    
    capa.updated_by = current_user.id
    capa.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(capa)
    
    logger.info(f"CAPA {capa.capa_number} updated by {current_user.email}")
    return capa

@router.delete("/{capa_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_capa(
    capa_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Delete CAPA record
    """
    capa = db.query(CAPA).filter(CAPA.id == capa_id).first()
    if not capa:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="CAPA not found"
        )
    
    db.delete(capa)
    db.commit()
    
    logger.info(f"CAPA {capa.capa_number} deleted by {current_user.email}")
