# main.py - Enhanced version
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware

from app import models
from .database import engine, Base
from .routers import auth, users
from .routers.auth import get_current_active_user  # Import auth dependency
from .routers import apartments, tenants, rentals, payments, maintenance
from sqlalchemy.orm import Session
# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Apartment Rental API", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers with auth dependencies for protected routes
app.include_router(auth.router)  # Auth routes are public
app.include_router(users.router, dependencies=[Depends(get_current_active_user)])
app.include_router(apartments.router)
app.include_router(tenants.router)
app.include_router(rentals.router)
app.include_router(payments.router)
app.include_router(maintenance.router)

@app.get("/")
def read_root():
    return {"message": "Apartment Rental API is running!"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

def seed_roles(db: Session):
    roles = ["Admin", "Landlord", "Tenant"]
    for i, name in enumerate(roles, start=1):
        if not db.query(models.Role).filter_by(name=name).first():
            db.add(models.Role(id=i, name=name))
    db.commit()


# Make OAuth2 scheme available globally
app.state.oauth2_scheme = auth.oauth2_scheme