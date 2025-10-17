from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from sqlalchemy.orm import Session, joinedload
from .. import models, schemas
from ..database import get_db
from ..utils import get_apartment_or_404, get_rental_or_404

router = APIRouter(prefix="/rentals", tags=["rentals"])

@router.post("/", response_model=schemas.RentalResponse, status_code=status.HTTP_201_CREATED)
def create_rental(payload: schemas.RentalCreate, db: Session = Depends(get_db)):
    # Make sure apartment exists
    apartment = get_apartment_or_404(db, payload.apartment_id)

    # ✅ Create new rental without overlap check
    db_r = models.Rental(**payload.model_dump())
    db.add(db_r)
    db.commit()
    db.refresh(db_r)
    return db_r


@router.get("/", response_model=List[schemas.RentalResponse])
def list_rentals(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    rentals = db.query(models.Rental).options(
        joinedload(models.Rental.apartment),
        joinedload(models.Rental.tenant).joinedload(models.Tenant.user)
    ).offset(skip).limit(limit).all()
    return rentals

@router.get("/{rental_id}", response_model=schemas.RentalResponse)
def get_rental(rental_id: int, db: Session = Depends(get_db)):
    rental = get_rental_or_404(db, rental_id)
    return rental

@router.put("/{rental_id}", response_model=schemas.RentalResponse)
def update_rental(rental_id: int, payload: schemas.RentalUpdate, db: Session = Depends(get_db)):
    db_r = get_rental_or_404(db, rental_id)

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(db_r, field, value)

    # free apartment if rental ends
    if payload.status and db_r.status in (models.RentalStatus.ended, models.RentalStatus.cancelled):
        apartment = get_apartment_or_404(db, db_r.apartment_id)
        apartment.status = models.ApartmentStatus.available
        db.add(apartment)

    db.add(db_r)
    db.commit()
    db.refresh(db_r)
    return db_r

@router.delete("/{rental_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_rental(rental_id: int, db: Session = Depends(get_db)):
    db_r = get_rental_or_404(db, rental_id)
    if db_r.status == models.RentalStatus.active:
        apartment = get_apartment_or_404(db, db_r.apartment_id)
        apartment.status = models.ApartmentStatus.available
        db.add(apartment)
    db.delete(db_r)
    db.commit()
    return None
