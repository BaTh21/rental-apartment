import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
from app.database import Base
from app.models import Role, RoleEnum

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL not found in .env")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

def test_connection():
    """Test database connection"""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print("Database connection successful")
        return True
    except Exception as e:
        print(f"Database connection failed: {e}")
        return False

def create_tables():
    """Create all tables"""
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully")

def seed_roles():
    """Seed roles and return their IDs"""
    db = SessionLocal()
    try:
        # Clear existing roles (optional - comment out to preserve)
        db.query(Role).delete()
        db.commit()
        
        # Create roles
        admin_role = Role(name=RoleEnum.admin)
        landlord_role = Role(name=RoleEnum.landlord)
        tenant_role = Role(name=RoleEnum.tenant)
        
        db.add_all([admin_role, landlord_role, tenant_role])
        db.commit()
        
        # Refresh to get IDs
        db.refresh(admin_role)
        db.refresh(landlord_role)
        db.refresh(tenant_role)
        
        role_mapping = {
            "admin": admin_role.id,
            "landlord": landlord_role.id,
            "tenant": tenant_role.id
        }
        
        print("\nROLES CREATED SUCCESSFULLY:")
        print(f"Admin ID:    {admin_role.id}")
        print(f"Landlord ID: {landlord_role.id}")
        print(f"Tenant ID:   {tenant_role.id}")
        
        return role_mapping
        
    except Exception as e:
        db.rollback()
        print(f"Error seeding roles: {e}")
        raise
    finally:
        db.close()

def main():
    print("Setting up Apartment Rental Database...")
    
    if not test_connection():
        print("Cannot connect to database. Check:")
        print("1. PostgreSQL is running")
        print("2. Database 'apartment_rental' exists")
        print("3. DATABASE_URL in .env is correct")
        return
    
    create_tables()
    role_ids = seed_roles()
    
    print(f"\nSetup complete! Use these role IDs for signup:")
    print(f"   Admin:    {role_ids['admin']}")
    print(f"   Landlord: {role_ids['landlord']}")
    print(f"   Tenant:   {role_ids['tenant']}")
    print("\nNext steps:")
    print("1. Start server: uvicorn app.main:app --reload")
    print("2. Test roles: curl http://localhost:8000/users/roles")
    print("3. Create admin: POST /auth/signup with role_id=1")

if __name__ == "__main__":
    main()