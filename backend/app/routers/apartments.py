# app/routers/apartments.py
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from sqlalchemy.orm import Session

from app.routers.auth import get_current_user
from .. import models, schemas
from ..database import get_db
from ..utils import get_apartment_or_404
from sqlalchemy.orm import joinedload


router = APIRouter(prefix="/apartments", tags=["apartments"])

@router.post("/", response_model=schemas.ApartmentResponse)
def create_apartment(
    apartment: schemas.ApartmentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role.name != "Landlord":
        raise HTTPException(status_code=403, detail="Only landlords can create apartments")

    db_apartment = models.Apartment(
        name=apartment.name,
        address=apartment.address,
        rent_price=apartment.rent_price,
        description=apartment.description,
        status=apartment.status,
        landlord_id=current_user.id
    )

    db.add(db_apartment)
    db.commit()
    db.refresh(db_apartment)
    return db_apartment


@router.get("/", response_model=List[schemas.ApartmentResponse])
def list_apartments(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    apartments = db.query(models.Apartment)\
        .options(joinedload(models.Apartment.landlord))\
        .offset(skip).limit(limit).all()
    return apartments


@router.get("/{apartment_id}", response_model=schemas.ApartmentResponse)
def get_apartment(apartment_id: int, db: Session = Depends(get_db)):
    return get_apartment_or_404(db, apartment_id)

@router.put("/{apartment_id}", response_model=schemas.ApartmentResponse)
def update_apartment(
    apartment_id: int,
    ap: schemas.ApartmentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_ap = get_apartment_or_404(db, apartment_id)

    # Only landlord who owns apartment or admin can update
    if current_user.role.name != "Admin" and db_ap.landlord_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not allowed to update this apartment")

    db_ap.name = ap.name
    db_ap.address = ap.address
    db_ap.rent_price = ap.rent_price
    db_ap.description = ap.description
    db_ap.status = ap.status
    db.add(db_ap)
    db.commit()
    db.refresh(db_ap)
    return db_ap

@router.delete("/{apartment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_apartment(
    apartment_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_ap = get_apartment_or_404(db, apartment_id)

    # Only landlord who owns apartment or admin can delete
    if current_user.role.name != "Admin" and db_ap.landlord_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not allowed to delete this apartment")

    db.delete(db_ap)
    db.commit()
    return None
