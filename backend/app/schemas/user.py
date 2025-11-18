from pydantic import BaseModel, Field, field_validator
import re
from datetime import datetime


class UserRegister(BaseModel):
    """მომხმარებლის რეგისტრაციის schema"""
    username: str = Field(..., min_length=3, max_length=50)
    email: str  # ✅ EmailStr-ის ნაცვლად უბრალო str
    password: str = Field(..., min_length=6)
    
    # ✅ Manual email validation
    @field_validator('email')
    @classmethod
    def validate_email(cls, v):
        email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_regex, v):
            raise ValueError('არასწორი ელ.ფოსტის ფორმატი')
        return v.lower()  # lowercase email
    
    class Config:
        json_schema_extra = {
            "example": {
                "username": "luka",
                "email": "luka@example.com",
                "password": "mypassword123"
            }
        }


class UserLogin(BaseModel):
    """მომხმარებლის ავტორიზაციის schema"""
    username: str
    password: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "username": "luka",
                "password": "mypassword123"
            }
        }


class UserResponse(BaseModel):
    """მომხმარებლის response schema"""
    id: int
    username: str
    email: str
    is_active: bool = True
    is_admin: bool = False
    is_moder: bool = False
    created_at: datetime
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": 1,
                "username": "luka",
                "email": "luka@example.com",
                "is_admin": False,
                "is_moder": False,
                "created_at": "2025-11-08T10:30:00"
            }
        }


class TokenResponse(BaseModel):
    """JWT Token response schema"""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
    
    class Config:
        json_schema_extra = {
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer",
                "user": {
                    "id": 1,
                    "username": "luka",
                    "email": "luka@example.com",
                    "is_admin": False,
                    "is_moder": False,
                    "created_at": "2025-11-08T10:30:00"
                }
            }
        }