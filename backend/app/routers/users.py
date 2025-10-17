from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List
from .. import schemas, models, utils
from ..database import get_db

router = APIRouter(prefix="/users", tags=["users"])

# PUBLIC: Get roles
@router.get("/roles", response_model=List[schemas.Role])
def get_roles(db: Session = Depends(get_db)):
    roles = db.query(models.Role).all()
    return roles

# CREATE - Role
@router.post("/roles", response_model=schemas.Role, status_code=status.HTTP_201_CREATED)
def create_role(
    role: schemas.RoleBase,
    db: Session = Depends(get_db)
):
    print(f"Creating role: {role.name}")
    
    # Check existing role
    existing_role = db.query(models.Role).filter(
        models.Role.name == role.name
    ).first()
    if existing_role:
        raise HTTPException(status_code=400, detail=f"Role '{role.name}' already exists")
    
    # Create role
    db_role = models.Role(name=role.name)
    db.add(db_role)
    db.commit()
    db.refresh(db_role)
    print(f"Role created: ID {db_role.id}")
    return db_role

# UPDATE - Role
@router.put("/roles/{role_id}", response_model=schemas.Role)
def update_role(
    role_id: int,
    role_update: schemas.RoleBase,
    db: Session = Depends(get_db)
):
    print(f"Updating role {role_id}")
    
    db_role = db.query(models.Role).filter(models.Role.id == role_id).first()
    if not db_role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    # Check for duplicate name
    existing_role = db.query(models.Role).filter(
        models.Role.name == role_update.name,
        models.Role.id != role_id
    ).first()
    if existing_role:
        raise HTTPException(status_code=400, detail=f"Role '{role_update.name}' already exists")
    
    # Update role
    db_role.name = role_update.name
    db.commit()
    db.refresh(db_role)
    print(f"Role {role_id} updated")
    return db_role

# DELETE - Role
@router.delete("/roles/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_role(
    role_id: int,
    db: Session = Depends(get_db)
):
    print(f"Deleting role {role_id}")
    
    db_role = db.query(models.Role).filter(models.Role.id == role_id).first()
    if not db_role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    # Prevent deletion of roles with associated users
    if db.query(models.User).filter(models.User.role_id == role_id).count() > 0:
        raise HTTPException(status_code=400, detail="Cannot delete role with associated users")
    
    db.delete(db_role)
    db.commit()
    print(f"Role {role_id} deleted")
    return None

# CREATE - User
@router.post("/", response_model=schemas.User, status_code=status.HTTP_201_CREATED)
def create_user(
    user: schemas.UserCreate,
    db: Session = Depends(get_db)
):
    print(f"Creating user: {user.username}")
    
    # Check existing
    existing_user = db.query(models.User).filter(
        or_(
            models.User.username.ilike(user.username),
            models.User.email.ilike(user.email)
        )
    ).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username or email already registered")

    # Validate role
    role = db.query(models.Role).filter(models.Role.id == user.role_id).first()
    if not role:
        available = db.query(models.Role).all()
        role_list = ", ".join([f"{r.id}:{r.name}" for r in available])
        raise HTTPException(status_code=400, detail=f"Invalid role_id. Available: {role_list}")

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
    print(f"User created: ID {db_user.id}")
    return db_user

# READ ALL - Users
@router.get("/", response_model=List[schemas.User])
def read_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    print("Requesting users")
    users = (
        db.query(models.User)
        .join(models.Role, models.User.role_id == models.Role.id)
        .offset(skip)
        .limit(limit)
        .all()
    )
    return users

# READ SINGLE - User
@router.get("/{user_id}", response_model=schemas.User)
def read_user(
    user_id: int,
    db: Session = Depends(get_db)
):
    print(f"Requesting user {user_id}")
    
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user

# UPDATE - User
@router.put("/{user_id}", response_model=schemas.User)
def update_user(
    user_id: int,
    user_update: schemas.UserUpdate,
    db: Session = Depends(get_db)
):
    print(f"Updating user {user_id}")
    
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    update_data = user_update.dict(exclude_unset=True)
    
    # Password handling
    if "password" in update_data:
        update_data["hashed_password"] = utils.get_password_hash(update_data.pop("password"))
    
    # Email validation
    if "email" in update_data and update_data["email"].lower() != db_user.email:
        email_exists = db.query(models.User).filter(
            models.User.email.ilike(update_data["email"].lower()),
            models.User.id != user_id
        ).first()
        if email_exists:
            raise HTTPException(status_code=400, detail="Email already registered")
    
    # Role validation
    if "role_id" in update_data and update_data["role_id"] != db_user.role_id:
        role = db.query(models.Role).filter(models.Role.id == update_data["role_id"]).first()
        if not role:
            raise HTTPException(status_code=400, detail="Invalid role_id")
    
    # Apply updates
    for field, value in update_data.items():
        setattr(db_user, field, value.lower() if field == "email" else value)
    
    db.commit()
    db.refresh(db_user)
    print(f"User {user_id} updated")
    return db_user

# DELETE - User
@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db)
):
    print(f"Deleting user {user_id}")
    
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.delete(db_user)
    db.commit()
    print(f"User {user_id} deleted")
    return None