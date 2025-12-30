"""
FastAPI Dependencies - ავტორიზაცია და authentication
"""

from fastapi import Depends, HTTPException, status, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import get_db
from jose import JWTError, jwt   # ✅ შეიცვალა: jwt → jose
import os
from app.core.security import decode_access_token


# ✅ Bearer Token-ის scheme (Authorization: Bearer <token>)
security = HTTPBearer()


async def get_current_moderator_user(
    authorization: str = Header(None)
):
    """JWT token-დან moderator user-ის ამოღება"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    
    token = authorization.replace("Bearer ", "")
    payload = decode_access_token(token)
    
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    # ✅ ᲓᲐᲐᲛᲐᲢᲔ: moderator/admin შემოწმება
    is_admin = payload.get("is_admin", False)
    is_moder = payload.get("is_moder", False)
    
    if not (is_admin or is_moder):
        raise HTTPException(
            status_code=403, 
            detail="Access denied: moderator privileges required"
        )
    
    return {
        "id": payload.get("id"),
        "username": payload.get("username"),
        "role": payload.get("role"),
        "is_admin": is_admin,
        "is_moder": is_moder
    }