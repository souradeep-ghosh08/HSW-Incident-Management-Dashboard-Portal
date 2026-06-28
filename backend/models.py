from sqlalchemy import Column, String, Boolean, DateTime, UUID, Enum, Integer, Text, ForeignKey, DECIMAL, JSONB, Date
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime
import uuid
import enum

class RoleEnum(str, enum.Enum):
    SUPER_ADMIN = "super_admin"
    NATIONAL_HSW = "national_hsw"
    CIRCLE_HSW = "circle_hsw"
    VENDOR_MANAGER = "vendor_manager"
    SITE_ENGINEER = "site_engineer"
    READ_ONLY = "read_only"

class IncidentTypeEnum(str, enum.Enum):
    NEAR_MISS = "near_miss"
    FIRST_AID = "first_aid"
    MEDICAL_TREATMENT_CASE = "medical_treatment_case"
    LTI = "lti"
    FATALITY = "fatality"
    PROPERTY_DAMAGE = "property_damage"

class IncidentStatusEnum(str, enum.Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    PENDING_REVIEW = "pending_review"
    CLOSED = "closed"
    REJECTED = "rejected"

class CapaStatusEnum(str, enum.Enum):
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    OVERDUE = "overdue"
    CLOSED = "closed"

class AuditActionEnum(str, enum.Enum):
    CREATE = "create"
    UPDATE = "update"
    DELETE = "delete"
    LOGIN = "login"
    LOGOUT = "logout"
    EXPORT = "export"
    IMPORT = "import"

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    first_name = Column(String(100))
    last_name = Column(String(100))
    role = Column(Enum(RoleEnum), default=RoleEnum.READ_ONLY, nullable=False, index=True)
    is_active = Column(Boolean, default=True, index=True)
    is_verified = Column(Boolean, default=False)
    last_login = Column(DateTime)
    password_reset_token = Column(String(500))
    password_reset_expires = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))
    updated_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))

    # Relationships
    incidents = relationship("Incident", foreign_keys="Incident.created_by", back_populates="creator")
    capa_assignments = relationship("CAPA", foreign_keys="CAPA.assigned_to", back_populates="assigned_user")

class Circle(Base):
    __tablename__ = "circles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    location = Column(String(255))
    is_active = Column(Boolean, default=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    updated_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))

    # Relationships
    incidents = relationship("Incident", back_populates="circle")

class Vendor(Base):
    __tablename__ = "vendors"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    contact_person = Column(String(255))
    email = Column(String(255))
    phone = Column(String(20))
    address = Column(Text)
    city = Column(String(100))
    state = Column(String(100))
    country = Column(String(100))
    postal_code = Column(String(20))
    is_active = Column(Boolean, default=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    updated_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))

    # Relationships
    incidents = relationship("Incident", back_populates="vendor")

class Incident(Base):
    __tablename__ = "incidents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    incident_number = Column(String(50), unique=True, nullable=False, index=True)
    incident_type = Column(Enum(IncidentTypeEnum), nullable=False, index=True)
    status = Column(Enum(IncidentStatusEnum), default=IncidentStatusEnum.OPEN, index=True)
    circle_id = Column(UUID(as_uuid=True), ForeignKey("circles.id", ondelete="RESTRICT"), nullable=False, index=True)
    vendor_id = Column(UUID(as_uuid=True), ForeignKey("vendors.id", ondelete="SET NULL"), index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    location = Column(String(255))
    incident_date = Column(DateTime, nullable=False, index=True)
    reported_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    severity = Column(String(50))
    root_cause = Column(Text)
    immediate_action = Column(Text)
    assigned_to = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))
    attachment_url = Column(String(500))
    comments = Column(Text)
    is_archived = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    updated_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))

    # Relationships
    circle = relationship("Circle", back_populates="incidents")
    vendor = relationship("Vendor", back_populates="incidents")
    creator = relationship("User", foreign_keys=[created_by], back_populates="incidents")
    capa_records = relationship("CAPA", back_populates="incident")

class CAPA(Base):
    __tablename__ = "capa"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    capa_number = Column(String(50), unique=True, nullable=False, index=True)
    incident_id = Column(UUID(as_uuid=True), ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(Enum(CapaStatusEnum), default=CapaStatusEnum.ASSIGNED, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    corrective_action = Column(Text)
    preventive_action = Column(Text)
    assigned_to = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    assigned_date = Column(DateTime, default=datetime.utcnow)
    due_date = Column(DateTime, nullable=False, index=True)
    completed_date = Column(DateTime)
    is_overdue = Column(Boolean, default=False)
    attachment_url = Column(String(500))
    comments = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    updated_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))

    # Relationships
    incident = relationship("Incident", back_populates="capa_records")
    assigned_user = relationship("User", foreign_keys=[assigned_to], back_populates="capa_assignments")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    action = Column(Enum(AuditActionEnum), nullable=False, index=True)
    entity_type = Column(String(100), nullable=False, index=True)
    entity_id = Column(UUID(as_uuid=True))
    entity_details = Column(JSONB)
    ip_address = Column(String(45))
    user_agent = Column(String(500))
    status = Column(String(50))
    error_message = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

class Report(Base):
    __tablename__ = "reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    report_number = Column(String(50), unique=True, nullable=False, index=True)
    report_type = Column(String(50), nullable=False, index=True)
    frequency = Column(String(50))
    circle_id = Column(UUID(as_uuid=True), ForeignKey("circles.id", ondelete="SET NULL"))
    vendor_id = Column(UUID(as_uuid=True), ForeignKey("vendors.id", ondelete="SET NULL"))
    title = Column(String(255), nullable=False)
    description = Column(Text)
    generated_date = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    file_path = Column(String(500))
    file_size = Column(Integer)
    total_incidents = Column(Integer, default=0)
    total_capa = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)

class ExcelImport(Base):
    __tablename__ = "excel_imports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer)
    import_type = Column(String(50))
    total_records = Column(Integer, default=0)
    successful_records = Column(Integer, default=0)
    failed_records = Column(Integer, default=0)
    error_details = Column(JSONB)
    status = Column(String(50), default="pending")
    import_date = Column(DateTime, default=datetime.utcnow)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String(50))
    related_incident_id = Column(UUID(as_uuid=True), ForeignKey("incidents.id", ondelete="SET NULL"))
    related_capa_id = Column(UUID(as_uuid=True), ForeignKey("capa.id", ondelete="SET NULL"))
    is_read = Column(Boolean, default=False, index=True)
    read_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
