from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from enum import Enum
import uuid

# ==================== Auth Schemas ====================

class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    password: str = Field(..., min_length=8)

# ==================== User Schemas ====================

class RoleEnum(str, Enum):
    SUPER_ADMIN = "super_admin"
    NATIONAL_HSW = "national_hsw"
    CIRCLE_HSW = "circle_hsw"
    VENDOR_MANAGER = "vendor_manager"
    SITE_ENGINEER = "site_engineer"
    READ_ONLY = "read_only"

class UserBase(BaseModel):
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: RoleEnum = RoleEnum.READ_ONLY

class UserCreate(UserBase):
    username: str = Field(..., min_length=3, max_length=100)
    password: str = Field(..., min_length=8)

class UserResponse(UserBase):
    id: uuid.UUID
    username: str
    is_active: bool
    is_verified: bool
    last_login: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# ==================== Circle Schemas ====================

class CircleBase(BaseModel):
    code: str = Field(..., min_length=1, max_length=50)
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    location: Optional[str] = None
    is_active: bool = True

class CircleCreate(CircleBase):
    pass

class CircleResponse(CircleBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# ==================== Vendor Schemas ====================

class VendorBase(BaseModel):
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

class VendorCreate(VendorBase):
    pass

class VendorResponse(VendorBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

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

class IncidentTrendResponse(BaseModel):
    month: str
    incidents: int
    capa: int

class HealthCheckResponse(BaseModel):
    status: str
    version: str
    database: str

class ErrorResponse(BaseModel):
    detail: str

class PaginationResponse(BaseModel):
    total: int
    page: int
    page_size: int
    pages: int
