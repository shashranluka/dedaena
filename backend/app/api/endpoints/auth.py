from fastapi import APIRouter, HTTPException, status
from app.schemas.user import UserRegister, UserLogin, UserResponse, TokenResponse
from app.core.security import get_password_hash, verify_password, create_access_token
from app.config import get_db_connection

router = APIRouter()

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister):
    """მომხმარებლის რეგისტრაცია"""
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            # Username და email უნიკალურობა
            cur.execute("SELECT id FROM users WHERE username = %s", (user_data.username,))
            if cur.fetchone():
                raise HTTPException(status_code=400, detail="ეს მომხმარებელი უკვე არსებობს")
            cur.execute("SELECT id FROM users WHERE email = %s", (user_data.email,))
            if cur.fetchone():
                raise HTTPException(status_code=400, detail="ეს ელ.ფოსტა უკვე გამოყენებულია")
            # პაროლის ჰეშირება
            hashed_password = get_password_hash(user_data.password)
            cur.execute("""
                INSERT INTO users (username, email, password)
                VALUES (%s, %s, %s)
                RETURNING id, username, email, is_admin, is_moder, created_at;
            """, (user_data.username, user_data.email, hashed_password))
            user_row = cur.fetchone()
            conn.commit()
            return UserResponse(
                id=user_row[0],
                username=user_row[1],
                email=user_row[2],
                is_admin=user_row[3],
                is_moder=user_row[4],
                created_at=user_row[5]
            )
    except HTTPException:
        raise
    except Exception:
        conn.rollback()
        raise HTTPException(status_code=500, detail="რეგისტრაცია ვერ მოხერხდა")
    finally:
        conn.close()

@router.post("/login")
async def login(credentials: UserLogin):
    """მომხმარებლის ავტორიზაცია"""
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT id, username, password, is_admin, is_moder 
                FROM users 
                WHERE username = %s AND is_active = TRUE;
            """, (credentials.username,))
            user = cur.fetchone()
            
            if not user or not verify_password(credentials.password, user[2]):
                raise HTTPException(status_code=401, detail="Invalid credentials")
            
            # ✅ Token payload-ში ID-ს ჩართვა
            access_token = create_access_token(data={
                "id": user[0],              # ✅ user ID
                "username": user[1],
                "is_admin": user[3],
                "is_moder": user[4],
                "role": "admin" if user[3] else "moderator" if user[4] else "user"
            })
            
            return {
                "access_token": access_token,
                "token_type": "bearer",
                "user": {
                    "id": user[0],          # ✅ ID
                    "username": user[1],
                    "is_admin": user[3],
                    "is_moder": user[4]
                }
            }
    finally:
        conn.close()

# უსაფრთხოების რეკომენდაციები:
# - პაროლი არასდროს ინახება ან იგზავნება დაუშიფრავად
# - JWT გასაღები .env-ში უნდა იყოს (მაგ: SECRET_KEY)
# - ყველა კონფიდენციალური პარამეტრი .env-ში უნდა იყოს
# - შეცდომის ტექსტი არ უნდა შეიცავდეს სენსიტიურ ინფორმაციას