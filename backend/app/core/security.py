from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
import os

# ✅ Password hashing context (bcrypt)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ✅ JWT settings
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production-min-32-characters")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days


def get_password_hash(password: str) -> str:
    """
    პაროლის დაშიფვრა bcrypt-ით
    
    Input:  "mypassword123"
    Output: "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7T0nwE7KFG"
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    პაროლის შემოწმება
    
    Input:  plain_password = "mypassword123"
            hashed_password = "$2b$12$LQv3c1yqBWVHxkd0..."
    Output: True or False
    """
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    JWT access token-ის შექმნა
    
    Input:  {"sub": "luka"}
    Output: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJsdWthIiwiZXhwIjoxNjk5NDYzMjAwfQ.xyz..."
    """
    to_encode = data.copy()
    
    # Token-ის ვადის გაწერა
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    
    # JWT encode
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict]:
    """
    JWT token-ის decode
    
    Input:  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    Output: {"sub": "luka", "exp": 1699463200}
            or None (თუ invalid)
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None