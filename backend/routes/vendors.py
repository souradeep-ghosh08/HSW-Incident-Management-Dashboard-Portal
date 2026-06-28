from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from database import get_db
from models import Vendor, User
from dependencies import get_current_active_user
from datetime import datetime
import uuid
import logging
from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/vendors", tags=["vendors"])

# ==================== Vendor Schemas ====================

class VendorCreate(BaseModel):
    code: str = Field(..., min_length=1, max_length=50)
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    contact_person: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None
    is_active: bool = True

class VendorUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    contact_person: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None
    is_active: Optional[bool] = None

class VendorResponse(BaseModel):
    id: uuid.UUID
    code: str
    name: str
    description: Optional[str]
    contact_person: Optional[str]
    email: Optional[str]
    phone: Optional[str]
    city: Optional[str]
    state: Optional[str]
    country: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class VendorsListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    pages: int
    data: List[VendorResponse]

# ==================== Routes ====================

@router.get("/", response_model=VendorsListResponse)
async def list_vendors(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    is_active: Optional[bool] = None,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    List vendors with pagination and filtering
    """
    query = db.query(Vendor)
    
    # Apply filters
    if is_active is not None:
        query = query.filter(Vendor.is_active == is_active)
    if search:
        query = query.filter(
            Vendor.name.ilike(f"%{search}%") |
            Vendor.code.ilike(f"%{search}%") |
            Vendor.email.ilike(f"%{search}%")
        )
    
    # Count total
    total = query.count()
    
    # Apply pagination
    skip = (page - 1) * page_size
    vendors = query.order_by(Vendor.created_at.desc()).offset(skip).limit(page_size).all()
    
    return VendorsListResponse(
        total=total,
        page=page,
        page_size=page_size,
        pages=(total + page_size - 1) // page_size,
        data=vendors
    )

@router.post("/", response_model=VendorResponse, status_code=status.HTTP_201_CREATED)
async def create_vendor(
    vendor_data: VendorCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Create a new vendor
    """
    # Check if code already exists
    existing = db.query(Vendor).filter(Vendor.code == vendor_data.code).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vendor code already exists"
        )
    
    vendor = Vendor(
        code=vendor_data.code,
        name=vendor_data.name,
        description=vendor_data.description,
        contact_person=vendor_data.contact_person,
        email=vendor_data.email,
        phone=vendor_data.phone,
        address=vendor_data.address,
        city=vendor_data.city,
        state=vendor_data.state,
        country=vendor_data.country,
        postal_code=vendor_data.postal_code,
        is_active=vendor_data.is_active,
        created_by=current_user.id,
        updated_by=current_user.id
    )
    
    db.add(vendor)
    db.commit()
    db.refresh(vendor)
    
    logger.info(f"Vendor {vendor.code} created by {current_user.email}")
    return vendor

@router.get("/{vendor_id}", response_model=VendorResponse)
async def get_vendor(
    vendor_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get vendor by ID
    """
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vendor not found"
        )
    return vendor

@router.put("/{vendor_id}", response_model=VendorResponse)
async def update_vendor(
    vendor_id: uuid.UUID,
    vendor_data: VendorUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Update vendor
    """
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vendor not found"
        )
    
    # Update fields
    update_data = vendor_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if value is not None:
            setattr(vendor, field, value)
    
    vendor.updated_by = current_user.id
    vendor.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(vendor)
    
    logger.info(f"Vendor {vendor.code} updated by {current_user.email}")
    return vendor

@router.delete("/{vendor_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_vendor(
    vendor_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Delete vendor (soft delete - deactivate)
    """
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vendor not found"
        )
    
    vendor.is_active = False
    vendor.updated_by = current_user.id
    db.commit()
    
    logger.info(f"Vendor {vendor.code} deactivated by {current_user.email}")
