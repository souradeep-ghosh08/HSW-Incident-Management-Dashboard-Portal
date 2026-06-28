from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from database import get_db
from models import User, Incident, Circle, Vendor, ExcelImport
from dependencies import get_current_active_user
from datetime import datetime
import uuid
import logging
import pandas as pd
import io
from typing import List
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/excel", tags=["excel"])

# ==================== Excel Schemas ====================

class ExcelImportResponse(BaseModel):
    id: uuid.UUID
    file_name: str
    import_type: str
    total_records: int
    successful_records: int
    failed_records: int
    status: str
    import_date: datetime

    class Config:
        from_attributes = True

# ==================== Routes ====================

@router.post("/import-incidents")
async def import_incidents(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Import incidents from Excel file
    Expected columns: incident_type, title, description, circle_code, vendor_code, location, severity
    """
    try:
        contents = await file.read()
        df = pd.read_excel(io.BytesIO(contents))
        
        successful = 0
        failed = 0
        errors = []
        
        for index, row in df.iterrows():
            try:
                # Get circle by code
                circle = db.query(Circle).filter(Circle.code == row['circle_code']).first()
                if not circle:
                    errors.append(f"Row {index + 1}: Circle code not found")
                    failed += 1
                    continue
                
                # Get vendor by code (optional)
                vendor_id = None
                if pd.notna(row.get('vendor_code')):
                    vendor = db.query(Vendor).filter(Vendor.code == row['vendor_code']).first()
                    if vendor:
                        vendor_id = vendor.id
                
                # Generate incident number
                from sqlalchemy import func
                incident_count = db.query(func.count(Incident.id)).scalar() + 1
                incident_number = f"INC-{datetime.utcnow().strftime('%Y%m%d')}-{incident_count:05d}"
                
                incident = Incident(
                    incident_number=incident_number,
                    incident_type=row['incident_type'],
                    circle_id=circle.id,
                    vendor_id=vendor_id,
                    title=row['title'],
                    description=row['description'],
                    location=row.get('location'),
                    severity=row.get('severity'),
                    incident_date=datetime.utcnow(),
                    created_by=current_user.id,
                    updated_by=current_user.id
                )
                
                db.add(incident)
                successful += 1
            except Exception as e:
                errors.append(f"Row {index + 1}: {str(e)}")
                failed += 1
        
        db.commit()
        
        # Create import log
        excel_import = ExcelImport(
            file_name=file.filename,
            file_path=f"/uploads/{file.filename}",
            import_type="incidents",
            total_records=len(df),
            successful_records=successful,
            failed_records=failed,
            error_details={"errors": errors},
            status="completed",
            created_by=current_user.id
        )
        db.add(excel_import)
        db.commit()
        
        logger.info(f"Excel import completed: {successful} successful, {failed} failed")
        
        return {
            "message": "Import completed",
            "total_records": len(df),
            "successful": successful,
            "failed": failed,
            "errors": errors
        }
    except Exception as e:
        logger.error(f"Excel import error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Import failed: {str(e)}"
        )

@router.get("/export-incidents")
async def export_incidents(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Export incidents to Excel file
    """
    try:
        incidents = db.query(Incident).all()
        
        data = []
        for incident in incidents:
            data.append({
                'Incident Number': incident.incident_number,
                'Type': incident.incident_type,
                'Title': incident.title,
                'Description': incident.description,
                'Status': incident.status,
                'Location': incident.location,
                'Severity': incident.severity,
                'Incident Date': incident.incident_date,
                'Reported Date': incident.reported_date,
                'Created At': incident.created_at
            })
        
        df = pd.DataFrame(data)
        
        # Create Excel file
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='Incidents', index=False)
        
        output.seek(0)
        
        logger.info(f"Incidents exported by {current_user.email}")
        
        return {
            "message": "Export completed",
            "total_records": len(data)
        }
    except Exception as e:
        logger.error(f"Excel export error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Export failed: {str(e)}"
        )
