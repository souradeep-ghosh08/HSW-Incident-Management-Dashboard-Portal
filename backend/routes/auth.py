from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta, datetime
from models import User
from schemas import LoginRequest, TokenResponse, ForgotPasswordRequest, ResetPasswordRequest
from security import SecurityManager
from database import get_db
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login", response_model=TokenResponse)
async def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    """
    Login endpoint that authenticates user and returns JWT tokens
    """
    # Find user by email
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Verify password
    if not SecurityManager.verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()
    
    # Create tokens
    access_token = SecurityManager.create_access_token(
        data={"sub": str(user.id), "email": user.email, "role": user.role.value}
    )
    refresh_token = SecurityManager.create_refresh_token(
        data={"sub": str(user.id), "email": user.email}
    )
    
    logger.info(f"User {user.email} logged in successfully")
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer"
    )

@router.post("/logout")
async def logout():
    """
    Logout endpoint (token invalidation handled on client side)
    """
    return {"message": "Logged out successfully"}

@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(request: dict, db: Session = Depends(get_db)):
    """
    Refresh access token using refresh token
    """
    refresh_token = request.get("refresh_token")
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Refresh token required"
        )
    
    payload = SecurityManager.verify_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )
    
    # Create new access token
    new_access_token = SecurityManager.create_access_token(
        data={"sub": str(user.id), "email": user.email, "role": user.role.value}
    )
    
    return TokenResponse(
        access_token=new_access_token,
        token_type="bearer"
    )

@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Request password reset token
    """
    user = db.query(User).filter(User.email == request.email).first()
    if user:
        # Generate reset token
        reset_token = SecurityManager.create_access_token(
            data={"sub": str(user.id), "type": "reset"},
            expires_delta=timedelta(hours=1)
        )
        user.password_reset_token = reset_token
        user.password_reset_expires = datetime.utcnow() + timedelta(hours=1)
        db.commit()
        logger.info(f"Password reset requested for {user.email}")
    
    # Always return success to prevent email enumeration
    return {"message": "Password reset email sent if account exists"}

@router.post("/reset-password")
async def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    """
    Reset password using reset token
    """
    payload = SecurityManager.verify_token(request.token)
    if not payload or payload.get("type") != "reset":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired reset token"
        )
    
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Update password
    user.password_hash = SecurityManager.hash_password(request.password)
    user.password_reset_token = None
    user.password_reset_expires = None
    db.commit()
    
    logger.info(f"Password reset successfully for {user.email}")
    return {"message": "Password reset successfully"}
