"""
FastAPI Dependencies - ავტორიზაცია და authentication
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import get_db
from jose import JWTError, jwt   # ✅ შეიცვალა: jwt → jose
import os
from app.core.security import decode_access_token


# ✅ Bearer Token-ის scheme (Authorization: Bearer <token>)
security = HTTPBearer()


async def get_current_moderator_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """
    მოდერატორის ავტორიზაცია
    
    Args:
        credentials: HTTP Bearer Token (Authorization header-იდან)
        db: Database session
    
    Returns:
        dict: მომხმარებლის ინფორმაცია (username, role)
    
    Raises:
        HTTPException 401: თუ token არასწორია ან ვადაგასულია
        HTTPException 403: თუ მომხმარებელს არ აქვს moderator/admin უფლებები
    """

    try:
        # ✅ Token-ის ამოღება Authorization header-იდან
        token = credentials.credentials
        
        print(f"🔑 Received token: {token[:30]}...", credentials.credentials)
        
        # ✅ JWT Secret Key გარემოს ცვლადიდან
        SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")
        ALGORITHM = "HS256"
        
        print(f"🔐 Using SECRET_KEY: {SECRET_KEY[:10]}...")
        
        payload = decode_access_token(token)
        print(f"🔐 Decoded payload1: {payload}")
        # ✅ Token-ის დეკოდირება და ვალიდაცია
        # payload = jwt.decode(
        #     token, 
        #     SECRET_KEY, 
        #     algorithms=[ALGORITHM]
        # )
        
        print(f"✅ Token decoded successfully!")
        
        # ✅ მომხმარებლის ინფორმაციის ამოღება
        username: str = payload.get("username")
        role: str = payload.get("role")
        
        if username is None or role is None:
            print(f"❌ Missing username or role in token payload")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload"
            )
        
        print(f"🔐 Authenticated user: {username} (role: {role})")
        
        # ✅ Role-ის შემოწმება (მხოლოდ moderator ან admin)
        if role not in ["moderator", "admin"]:
            print(f"❌ Insufficient permissions: role={role}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Not enough permissions. Moderator role required. Current role: {role}"
            )
        
        # ✅ მომხმარებლის დაბრუნება
        return {
            "username": username,
            "role": role
        }
        
    except JWTError as e:
        # ❌ JWT-ის ნებისმიერი შეცდომა (expired, invalid signature, etc.)
        print(f"❌ JWT Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate credentials: {str(e)}"
        )
    except Exception as e:
        # ❌ სხვა შეცდომები
        print(f"❌ Unexpected error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Authentication error: {str(e)}"
        )