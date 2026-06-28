from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from database import get_db
from models import Incident, User, IncidentTypeEnum, IncidentStatusEnum
from schemas import IncidentTypeEnum as IncidentTypeSchema, IncidentStatusEnum as IncidentStatusSchema
from dependencies import get_current_active_user
from datetime import datetime
import uuid
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/incidents", tags=["incidents"])

# ==================== Incident Schemas ====================

from pydantic import BaseModel, Field
from typing import Optional, List

class IncidentCreate(BaseModel):
    circle_id: uuid.UUID
    vendor_id: Optional[uuid.UUID] = None
    incident_type: str
    title: str = Field(..., min_length=1, max_length=255)
    description: str = Field(..., min_length=1)
    location: Optional[str] = None
    severity: Optional[str] = None
    root_cause: Optional[str] = None
    immediate_action: Optional[str] = None

class IncidentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    severity: Optional[str] = None
    root_cause: Optional[str] = None
    immediate_action: Optional[str] = None
    assigned_to: Optional[uuid.UUID] = None

class IncidentResponse(BaseModel):
    id: uuid.UUID
    incident_number: str
    incident_type: str
    status: str
    title: str
    description: str
    location: Optional[str]
    severity: Optional[str]
    incident_date: datetime
    reported_date: datetime
    assigned_to: Optional[uuid.UUID]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class IncidentsListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    pages: int
    data: List[IncidentResponse]

# ==================== Routes ====================

@router.get("/", response_model=IncidentsListResponse)
async def list_incidents(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    status: Optional[str] = None,
    incident_type: Optional[str] = None,
    circle_id: Optional[str] = None,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    List incidents with pagination and filtering
    """
    query = db.query(Incident)
    
    # Apply filters
    if status:
        query = query.filter(Incident.status == status)
    if incident_type:
        query = query.filter(Incident.incident_type == incident_type)
    if circle_id:
        query = query.filter(Incident.circle_id == uuid.UUID(circle_id))
    if search:
        query = query.filter(
            Incident.title.ilike(f"%{search}%") |
            Incident.incident_number.ilike(f"%{search}%") |
            Incident.description.ilike(f"%{search}%")
        )
    
    # Count total
    total = query.count()
    
    # Apply pagination
    skip = (page - 1) * page_size
    incidents = query.order_by(Incident.created_at.desc()).offset(skip).limit(page_size).all()
    
    return IncidentsListResponse(
        total=total,
        page=page,
        page_size=page_size,
        pages=(total + page_size - 1) // page_size,
        data=incidents
    )

@router.post("/", response_model=IncidentResponse, status_code=status.HTTP_201_CREATED)
async def create_incident(
    incident_data: IncidentCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Create a new incident
    """
    # Generate incident number
    incident_count = db.query(func.count(Incident.id)).scalar() + 1
    incident_number = f"INC-{datetime.utcnow().strftime('%Y%m%d')}-{incident_count:05d}"
    
    # Create incident
    incident = Incident(
        incident_number=incident_number,
        incident_type=incident_data.incident_type,
        circle_id=incident_data.circle_id,
        vendor_id=incident_data.vendor_id,
        title=incident_data.title,
        description=incident_data.description,
        location=incident_data.location,
        severity=incident_data.severity,
        root_cause=incident_data.root_cause,
        immediate_action=incident_data.immediate_action,
        incident_date=datetime.utcnow(),
        created_by=current_user.id,
        updated_by=current_user.id
    )
    
    db.add(incident)
    db.commit()
    db.refresh(incident)
    
    logger.info(f"Incident {incident_number} created by {current_user.email}")
    return incident

@router.get("/{incident_id}", response_model=IncidentResponse)
async def get_incident(
    incident_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get incident by ID
    """
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incident not found"
        )
    return incident

@router.put("/{incident_id}", response_model=IncidentResponse)
async def update_incident(
    incident_id: uuid.UUID,
    incident_data: IncidentUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Update incident
    """
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incident not found"
        )
    
    # Update fields
    if incident_data.title:
        incident.title = incident_data.title
    if incident_data.description:
        incident.description = incident_data.description
    if incident_data.status:
        incident.status = incident_data.status
    if incident_data.severity:
        incident.severity = incident_data.severity
    if incident_data.root_cause:
        incident.root_cause = incident_data.root_cause
    if incident_data.immediate_action:
        incident.immediate_action = incident_data.immediate_action
    if incident_data.assigned_to:
        incident.assigned_to = incident_data.assigned_to
    
    incident.updated_by = current_user.id
    incident.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(incident)
    
    logger.info(f"Incident {incident.incident_number} updated by {current_user.email}")
    return incident

@router.delete("/{incident_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_incident(
    incident_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Delete incident (soft delete - archive)
    """
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incident not found"
        )
    
    incident.is_archived = True
    incident.updated_by = current_user.id
    db.commit()
    
    logger.info(f"Incident {incident.incident_number} archived by {current_user.email}")
