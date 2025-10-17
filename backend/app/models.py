
import enum
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Date,
    DateTime,
    DECIMAL,
    ForeignKey,
    func,
    Enum as SQLEnum,   # use this for DB enum columns
)
from sqlalchemy.orm import relationship
from .database import Base

class UserRole(str, enum.Enum):
    admin = "admin"
    landlord = "landlord"
    tenant = "tenant"

class ApartmentStatus(enum.Enum):
    available = "available"
    rented = "rented"
    maintenance = "maintenance"

class RentalStatus(enum.Enum):
    active = "active"
    ended = "ended"
    cancelled = "cancelled"

class PaymentStatus(enum.Enum):
    pending = "pending"
    completed = "completed"
    failed = "failed"

class PaymentMethod(enum.Enum):
    cash = "cash"
    credit_card = "credit_card"
    bank_transfer = "bank_transfer"

class MaintenanceStatus(enum.Enum):
    pending = "pending"
    in_progress = "in_progress"
    completed = "completed"

class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)

    users = relationship("User", back_populates="role")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    role = relationship("Role", back_populates="users")
    apartments = relationship("Apartment", back_populates="landlord")
    tenant_profile = relationship("Tenant", back_populates="user", uselist=False)



class Apartment(Base):
    __tablename__ = "apartments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    address = Column(Text)
    rent_price = Column(DECIMAL(10, 2))
    description = Column(Text)
    status = Column(SQLEnum(ApartmentStatus, name="apartment_status"), default=ApartmentStatus.available)
    landlord_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    landlord = relationship("User", back_populates="apartments")  # ✅ allows access to landlord.username
    rentals = relationship("Rental", back_populates="apartment", cascade="all, delete-orphan")
    maintenance_requests = relationship("MaintenanceRequest", back_populates="apartment", cascade="all, delete-orphan")


class Tenant(Base):
    __tablename__ = "tenants"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    phone = Column(String(20))
    address = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="tenant_profile")
    rentals = relationship("Rental", back_populates="tenant", cascade="all, delete-orphan")
    maintenance_requests = relationship("MaintenanceRequest", back_populates="tenant", cascade="all, delete-orphan")


class Rental(Base):
    __tablename__ = "rentals"

    id = Column(Integer, primary_key=True, index=True)
    apartment_id = Column(Integer, ForeignKey("apartments.id"), nullable=False)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    start_date = Column(Date)
    end_date = Column(Date)
    status = Column(SQLEnum(RentalStatus, name="rental_status"), default=RentalStatus.active)
    total_amount = Column(DECIMAL(10, 2))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    apartment = relationship("Apartment", back_populates="rentals")
    tenant = relationship("Tenant", back_populates="rentals")
    payments = relationship("Payment", back_populates="rental", cascade="all, delete-orphan")


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    rental_id = Column(Integer, ForeignKey("rentals.id"), nullable=False)
    payment_date = Column(Date, nullable=False)
    amount = Column(DECIMAL(10, 2), nullable=False)
    payment_method = Column(SQLEnum(PaymentMethod, name="payment_method"), nullable=False)
    status = Column(SQLEnum(PaymentStatus, name="payment_status"), nullable=False)

    rental = relationship("Rental", back_populates="payments")


class MaintenanceRequest(Base):
    __tablename__ = "maintenance_requests"

    id = Column(Integer, primary_key=True, index=True)
    apartment_id = Column(Integer, ForeignKey("apartments.id"), nullable=False)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    description = Column(Text, nullable=False)
    request_date = Column(Date, nullable=False)
    status = Column(SQLEnum(MaintenanceStatus, name="maintenance_status"), default=MaintenanceStatus.pending)

    apartment = relationship("Apartment", back_populates="maintenance_requests")
    tenant = relationship("Tenant", back_populates="maintenance_requests")


# class Role(Base):
#     __tablename__ = "roles"
    
#     id = Column(Integer, primary_key=True, index=True)
#     name = Column(String, unique=True, nullable=False)
#     # Relationship
#     users = relationship("User", back_populates="role")

# class User(Base):
#     __tablename__ = "users"
    
#     id = Column(Integer, primary_key=True, index=True)
#     username = Column(String, unique=True, index=True, nullable=False)
#     email = Column(String, unique=True, index=True, nullable=False)
#     hashed_password = Column(String, nullable=False)
#     role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
#     created_at = Column(DateTime(timezone=True), server_default=func.now())
    
#     # Relationships
#     role = relationship("Role", back_populates="users")

