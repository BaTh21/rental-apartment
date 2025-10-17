# app/routers/tenants.py
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from sqlalchemy.orm import Session, joinedload

from .. import models, schemas
from ..database import get_db
from ..utils import get_tenant_or_404

router = APIRouter(prefix="/tenants", tags=["tenants"])

@router.post("/", response_model=schemas.TenantResponse, status_code=status.HTTP_201_CREATED)
def create_tenant(t: schemas.TenantCreate, db: Session = Depends(get_db)):
    # Ensure user exists
    user = db.query(models.User).filter(models.User.id == t.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check phone is not null
    if not t.phone or t.phone.strip() == "":
        raise HTTPException(status_code=400, detail="Phone number is required")
    
    # Check if phone is unique
    existing_tenant = db.query(models.Tenant).filter(models.Tenant.phone == t.phone).first()
    if existing_tenant:
        raise HTTPException(status_code=400, detail="Phone number already exists")
    
    # Create tenant profile
    db_t = models.Tenant(user_id=t.user_id, phone=t.phone, address=t.address)
    db.add(db_t)
    db.commit()
    db.refresh(db_t)
    return db_t

@router.get("/", response_model=List[schemas.TenantResponse])
def list_tenants(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    tenants = (
        db.query(models.Tenant)
        .options(joinedload(models.Tenant.user))  # load related user
        .offset(skip)
        .limit(limit)
        .all()
    )
    return tenants

@router.get("/{tenant_id}", response_model=schemas.TenantResponse)
def get_tenant(tenant_id: int, db: Session = Depends(get_db)):
    tenant = (
        db.query(models.Tenant)
        .options(joinedload(models.Tenant.user))  # load related user
        .filter(models.Tenant.id == tenant_id)
        .first()
    )
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return tenant

@router.put("/{tenant_id}", response_model=schemas.TenantResponse)
def update_tenant(tenant_id: int, t: schemas.TenantUpdate, db: Session = Depends(get_db)):
    db_t = get_tenant_or_404(db, tenant_id)
    if t.phone is not None:
        db_t.phone = t.phone
    if t.address is not None:
        db_t.address = t.address
    if t.user_id is not None:
        user = db.query(models.User).filter(models.User.id == t.user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        db_t.user_id = t.user_id
    db.add(db_t)
    db.commit()
    db.refresh(db_t)
    return db_t

@router.delete("/{tenant_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tenant(tenant_id: int, db: Session = Depends(get_db)):
    db_t = get_tenant_or_404(db, tenant_id)
    db.delete(db_t)
    db.commit()
    return None
