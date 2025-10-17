from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from sqlalchemy.orm import Session, joinedload
from datetime import date
from .. import models, schemas
from ..database import get_db
from ..utils import get_apartment_or_404, get_tenant_or_404

router = APIRouter(prefix="/maintenance", tags=["Maintenance Requests"])

# ✅ Create Maintenance Request
@router.post("/", response_model=schemas.MaintenanceResponse, status_code=status.HTTP_201_CREATED)
def create_maintenance(req: schemas.MaintenanceCreate, db: Session = Depends(get_db)):
    print("Apartment ID:", req.apartment_id)
    print("Tenant ID:", req.tenant_id)

    apartment = db.get(models.Apartment, req.apartment_id)
    if not apartment:
        raise HTTPException(status_code=404, detail="Apartment not found")

    tenant = db.get(models.Tenant, req.tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    db_req = models.MaintenanceRequest(
        apartment_id=req.apartment_id,
        tenant_id=req.tenant_id,
        description=req.description,
        request_date=req.request_date,
        status=req.status
    )
    db.add(db_req)
    db.commit()
    db.refresh(db_req)
    return db_req

# ✅ Get all Maintenance Requests
@router.get("/", response_model=List[schemas.MaintenanceResponse])
def list_requests(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    reqs = (
        db.query(models.MaintenanceRequest)
        .options(joinedload(models.MaintenanceRequest.apartment))
        .options(joinedload(models.MaintenanceRequest.tenant).joinedload(models.Tenant.user))
        .offset(skip)
        .limit(limit)
        .all()
    )
    return reqs

# ✅ Get Maintenance Request by ID
@router.get("/{request_id}", response_model=schemas.MaintenanceResponse)
def get_request(request_id: int, db: Session = Depends(get_db)):
    req = (
        db.query(models.MaintenanceRequest)
        .options(joinedload(models.MaintenanceRequest.apartment))
        .options(joinedload(models.MaintenanceRequest.tenant).joinedload(models.Tenant.user))
        .filter(models.MaintenanceRequest.id == request_id)
        .first()
    )
    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Maintenance request not found")
    return req

# ✅ Update Maintenance Request
@router.put("/{request_id}", response_model=schemas.MaintenanceResponse)
def update_request(request_id: int, payload: schemas.MaintenanceCreate, db: Session = Depends(get_db)):
    req = db.get(models.MaintenanceRequest, request_id)
    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Maintenance request not found")

    req.apartment_id = payload.apartment_id
    req.tenant_id = payload.tenant_id
    req.description = payload.description
    req.request_date = payload.request_date
    req.status = payload.status

    db.add(req)
    db.commit()
    db.refresh(req)
    return req

# ✅ Delete Maintenance Request
@router.delete("/{request_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_request(request_id: int, db: Session = Depends(get_db)):
    req = db.get(models.MaintenanceRequest, request_id)
    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Maintenance request not found")
    db.delete(req)
    db.commit()
    return None