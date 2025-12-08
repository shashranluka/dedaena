from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
import os
from dotenv import load_dotenv

# ✅ .env ფაილის ჩატვირთვა
load_dotenv()

# ✅ Password hashing context (bcrypt)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ✅ JWT settings .env-დან
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY or len(SECRET_KEY) < 32:
    raise RuntimeError("SECRET_KEY must be set in .env and be at least 32 characters long for security.")

ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES"))


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