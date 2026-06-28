from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import Incident, CAPA, IncidentTypeEnum
from dependencies import get_current_active_user
from pydantic import BaseModel
from typing import List
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/dashboard", tags=["dashboard"])

# ==================== Dashboard Schemas ====================

class KPIResponse(BaseModel):
    total_incidents: int
    near_miss_count: int
    first_aid_count: int
    medical_treatment_count: int
    lti_count: int
    fatality_count: int
    property_damage_count: int
    pending_capa: int
    overdue_capa: int
    ltir: float
    trir: float

class IncidentTrendData(BaseModel):
    month: str
    incidents: int
    capa: int

class RecentIncidentResponse(BaseModel):
    id: str
    incident_number: str
    title: str
    incident_type: str
    status: str
    created_at: datetime

# ==================== Routes ====================

@router.get("/kpis", response_model=KPIResponse)
async def get_kpis(
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get KPI dashboard data
    """
    # Count incidents by type
    near_miss = db.query(func.count(Incident.id)).filter(
        Incident.incident_type == IncidentTypeEnum.NEAR_MISS
    ).scalar()
    first_aid = db.query(func.count(Incident.id)).filter(
        Incident.incident_type == IncidentTypeEnum.FIRST_AID
    ).scalar()
    medical_treatment = db.query(func.count(Incident.id)).filter(
        Incident.incident_type == IncidentTypeEnum.MEDICAL_TREATMENT_CASE
    ).scalar()
    lti = db.query(func.count(Incident.id)).filter(
        Incident.incident_type == IncidentTypeEnum.LTI
    ).scalar()
    fatality = db.query(func.count(Incident.id)).filter(
        Incident.incident_type == IncidentTypeEnum.FATALITY
    ).scalar()
    property_damage = db.query(func.count(Incident.id)).filter(
        Incident.incident_type == IncidentTypeEnum.PROPERTY_DAMAGE
    ).scalar()
    
    total_incidents = (
        near_miss + first_aid + medical_treatment + lti + fatality + property_damage
    )
    
    # Count CAPA
    pending_capa = db.query(func.count(CAPA.id)).filter(
        CAPA.status.in_(["assigned", "in_progress"])
    ).scalar()
    overdue_capa = db.query(func.count(CAPA.id)).filter(
        CAPA.is_overdue == True
    ).scalar()
    
    # Calculate safety metrics
    ltir = (lti / 200000 * 100) if total_incidents > 0 else 0  # Simplified calculation
    trir = (total_incidents / 200000 * 100) if total_incidents > 0 else 0
    
    return KPIResponse(
        total_incidents=total_incidents,
        near_miss_count=near_miss,
        first_aid_count=first_aid,
        medical_treatment_count=medical_treatment,
        lti_count=lti,
        fatality_count=fatality,
        property_damage_count=property_damage,
        pending_capa=pending_capa,
        overdue_capa=overdue_capa,
        ltir=ltir,
        trir=trir
    )

@router.get("/incident-trends", response_model=List[IncidentTrendData])
async def get_incident_trends(
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get incident trend data for the last 12 months
    """
    data = []
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    
    for i in range(12):
        month_num = (datetime.utcnow().month - i - 1) % 12 + 1
        month_name = months[month_num - 1]
        
        incidents = db.query(func.count(Incident.id)).filter(
            func.extract('month', Incident.created_at) == month_num
        ).scalar()
        
        capa = db.query(func.count(CAPA.id)).filter(
            func.extract('month', CAPA.created_at) == month_num
        ).scalar()
        
        data.append(IncidentTrendData(month=month_name, incidents=incidents, capa=capa))
    
    return list(reversed(data))

@router.get("/recent-incidents", response_model=List[RecentIncidentResponse])
async def get_recent_incidents(
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get recent incidents
    """
    incidents = db.query(Incident).order_by(
        Incident.created_at.desc()
    ).limit(10).all()
    
    return [
        RecentIncidentResponse(
            id=str(inc.id),
            incident_number=inc.incident_number,
            title=inc.title,
            incident_type=inc.incident_type,
            status=inc.status,
            created_at=inc.created_at
        )
        for inc in incidents
    ]
