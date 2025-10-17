# app/schemas.py
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from datetime import datetime, date
from typing import Optional, List

# ==========================
# USER & AUTH SCHEMAS
# ==========================

class RoleBase(BaseModel):
    name: str
    model_config = ConfigDict(from_attributes=True)

class Role(RoleBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    role_id: int
    model_config = ConfigDict(from_attributes=True)

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

class UserLogin(BaseModel):
    username: str  # can also be email
    password: str

class UserUpdate(BaseModel):
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    email: Optional[EmailStr] = None
    role_id: Optional[int] = None
    password: Optional[str] = Field(None, min_length=8)

class User(UserBase):
    id: int
    created_at: Optional[datetime] = None
    role: Optional[Role] = None

class UserInDB(User):
    hashed_password: str

class UserWithRole(User):
    role: Role

class UserResponse(UserBase):
    id: int
    class Config:
        orm_mode = True


# ==========================
# TOKEN SCHEMAS
# ==========================

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: Optional[int] = None
    username: Optional[str] = None
    role_id: Optional[int] = None

class TokenData(BaseModel):
    email: Optional[str] = None
    user_id: Optional[int] = None
    username: Optional[str] = None
    role_id: Optional[int] = None

class SuccessMessage(BaseModel):
    message: str


# ==========================
# APARTMENT SCHEMAS
# ==========================

class LandlordResponse(BaseModel):
    id: int
    username: str

    class Config:
        orm_mode = True

class ApartmentBase(BaseModel):
    name: str
    address: str
    rent_price: float
    description: Optional[str] = None
    status: str
    model_config = ConfigDict(from_attributes=True) 

class ApartmentCreate(ApartmentBase):
    landlord_id: int  # frontend should send landlord_id (or backend can override with current user.id)

class ApartmentResponse(ApartmentBase):
    id: int
    landlord_id: int
    landlord: Optional[LandlordResponse]
    created_at: Optional[datetime]

    class Config:
        orm_mode = True


# ==========================
# TENANT SCHEMAS
# ==========================

class TenantBase(BaseModel):
    phone: str
    address: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class TenantCreate(TenantBase):
    user_id: int

class TenantUpdate(TenantBase):
    user_id: Optional[int] = None


class TenantResponse(TenantBase):
    id: int
    user_id: int
    user: Optional[UserBase] 
    created_at: Optional[datetime]
    class Config:
        orm_mode = True


# ==========================
# RENTAL SCHEMAS
# ==========================

class RentalBase(BaseModel):
    apartment_id: int
    tenant_id: int
    start_date: date
    end_date: date
    status: str
    total_amount: float
    model_config = ConfigDict(from_attributes=True)

class RentalCreate(RentalBase):
    pass

class RentalUpdate(BaseModel):
    start_date: Optional[date]
    end_date: Optional[date]
    status: Optional[str]
    total_amount: Optional[float]

    model_config = ConfigDict(from_attributes=True)

class RentalResponse(BaseModel):
    id: int
    apartment: Optional[ApartmentResponse]
    tenant: Optional[TenantResponse]       # include tenant with user info
    start_date: date
    end_date: date
    status: str
    total_amount: float
    created_at: Optional[datetime]

    class Config:
        orm_mode = True

# ==========================
# PAYMENT SCHEMAS
# ==========================

class PaymentBase(BaseModel):
    rental_id: int
    payment_date: date
    amount: float
    payment_method: str
    status: str
    model_config = ConfigDict(from_attributes=True)

class PaymentCreate(PaymentBase):
    pass

class PaymentResponse(PaymentBase):
    id: int
    rental: Optional[RentalResponse] = None
    class Config:
        orm_mode = True


# ==========================
# MAINTENANCE REQUEST SCHEMAS
# ==========================

class MaintenanceBase(BaseModel):
    apartment_id: int
    tenant_id: int
    description: str
    request_date: date
    status: str
    model_config = ConfigDict(from_attributes=True)

class MaintenanceCreate(MaintenanceBase):
    pass

class MaintenanceResponse(MaintenanceBase):
    id: int
    apartment: Optional['ApartmentResponse'] = None
    tenant: Optional['TenantResponse'] = None
    class Config:
        orm_mode = True


# ==========================
# COMBINED RELATIONSHIP RESPONSES (Optional)
# ==========================

class RentalWithDetails(RentalResponse):
    apartment: Optional[ApartmentResponse]
    tenant: Optional[TenantResponse]
    payments: Optional[List[PaymentResponse]]

class ApartmentWithDetails(ApartmentResponse):
    rentals: Optional[List[RentalResponse]]
    maintenance_requests: Optional[List[MaintenanceResponse]]

