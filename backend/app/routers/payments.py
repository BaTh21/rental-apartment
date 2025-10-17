from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from sqlalchemy.orm import Session
from .. import models, schemas
from ..database import get_db
from ..utils import get_rental_or_404
from sqlalchemy.orm import joinedload

router = APIRouter(prefix="/payments", tags=["payments"])

# 🟢 Create Payment
@router.post("/", response_model=schemas.PaymentResponse, status_code=status.HTTP_201_CREATED)
def create_payment(p: schemas.PaymentCreate, db: Session = Depends(get_db)):
    get_rental_or_404(db, p.rental_id)

    db_p = models.Payment(
        rental_id=p.rental_id,
        payment_date=p.payment_date,
        amount=p.amount,
        payment_method=p.payment_method,
        status=p.status
    )
    db.add(db_p)
    db.commit()
    db.refresh(db_p)
    return db_p

# 🟢 Get All Payments
@router.get("/", response_model=List[schemas.PaymentResponse])
def list_payments(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    payments = (
        db.query(models.Payment)
        .options(joinedload(models.Payment.rental))  # 👈 load rental too
        .offset(skip)
        .limit(limit)
        .all()
    )
    return payments

# 🟢 Get One Payment by ID
@router.get("/", response_model=List[schemas.PaymentResponse])
def get_payments(db: Session = Depends(get_db)):
    payments = (
        db.query(models.Payment)
        .options(joinedload(models.Payment.rental).joinedload(models.Rental.apartment))
        .all()
    )
    return payments

# 🟢 Update Payment (PUT)
@router.put("/{payment_id}", response_model=schemas.PaymentResponse)
def update_payment(payment_id: int, p: schemas.PaymentCreate, db: Session = Depends(get_db)):
    payment = db.get(models.Payment, payment_id)
    if not payment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")

    # Check if rental exists
    get_rental_or_404(db, p.rental_id)

    payment.rental_id = p.rental_id
    payment.payment_date = p.payment_date
    payment.amount = p.amount
    payment.payment_method = p.payment_method
    payment.status = p.status

    db.commit()
    db.refresh(payment)
    return payment

# 🟢 Delete Payment
@router.delete("/{payment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_payment(payment_id: int, db: Session = Depends(get_db)):
    payment = db.get(models.Payment, payment_id)
    if not payment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")
    db.delete(payment)
    db.commit()
    return None
