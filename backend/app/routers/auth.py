# routers/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlalchemy.orm import Session
from sqlalchemy import or_
from datetime import timedelta
from jose import JWTError
from typing import Optional
from .. import schemas, models, utils
from ..database import get_db
import os

router = APIRouter(prefix="/auth", tags=["Auth"])

# For login endpoint (form data)
oauth2_password_form = OAuth2PasswordRequestForm

# For protected routes (bearer token) - THIS is where tokenUrl goes
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

@router.post("/login", response_model=schemas.Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(oauth2_password_form),
    db: Session = Depends(get_db)
):
    """
    OAuth2 compatible login - works with Swagger UI
    """
    print(f"LOGIN ATTEMPT: username='{form_data.username}'")
    
    # Find user by email (case insensitive)
    normalized_email = form_data.username.lower()
    user = db.query(models.User).filter(
        models.User.username.ilike(normalized_email)
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verify password
    if not utils.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create token with user info
    access_token_expires = timedelta(minutes=utils.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = utils.create_access_token(
        data={
            "sub": user.email,
            "user_id": user.id,
            "username": user.username,
            "role_id": user.role_id
        },
        expires_delta=access_token_expires
    )
    
    return schemas.Token(
        access_token=access_token,
        token_type="bearer",
        user_id=user.id,
        username=user.username,
        role_id=user.role_id
    )

@router.post("/signup", response_model=schemas.User, status_code=status.HTTP_201_CREATED)
def signup(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # Check existing user
    existing_user = db.query(models.User).filter(
        or_(
            models.User.username.ilike(user.username),
            models.User.email.ilike(user.email)
        )
    ).first()
    
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail=f"User already exists with username '{user.username}' or email '{user.email}'"
        )
    
    # Validate role
    role = db.query(models.Role).filter(models.Role.id == user.role_id).first()
    if not role:
        available_roles = db.query(models.Role).all()
        role_list = ", ".join([f"{r.id}:{r.name.value}" for r in available_roles])
        raise HTTPException(
            status_code=400,
            detail=f"Invalid role ID '{user.role_id}'. Available: {role_list}"
        )
    
    # Create user
    hashed_password = utils.get_password_hash(user.password)
    db_user = models.User(
        username=user.username,
        email=user.email.lower(),
        hashed_password=hashed_password,
        role_id=user.role_id
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# JWT dependency using OAuth2PasswordBearer
async def get_current_user(
    token: str = Depends(oauth2_scheme),  # Use the bearer scheme here
    db: Session = Depends(get_db)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = utils.verify_token(token)
    if not payload:
        raise credentials_exception
    
    email: str = payload.get("sub")
    user_id: Optional[int] = payload.get("user_id")
    
    if email is None or user_id is None:
        raise credentials_exception
    
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        raise credentials_exception
    return user

async def get_current_active_user(current_user: models.User = Depends(get_current_user)):
    return current_user

# Export for use in other modules
__all__ = ["get_current_user", "get_current_active_user", "oauth2_scheme", "oauth2_password_form"]