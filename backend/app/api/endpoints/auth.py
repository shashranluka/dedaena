from fastapi import APIRouter, HTTPException, status
from app.schemas.user import UserRegister, UserLogin, UserResponse, TokenResponse
from app.core.security import get_password_hash, verify_password, create_access_token
from app.config import get_db_connection

router = APIRouter()

# @router.post("/register")
# async def register():
#     print("Registration endpoint called")
#     return {"message": "Registration endpoint placeholder"}


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister):
    """მომხმარებლის რეგისტრაცია"""
    # print("Registration endpoint called")
    conn = get_db_connection()
    
    try:
        with conn.cursor() as cur:
            # შემოწმება: username
            cur.execute("SELECT id FROM users WHERE username = %s", (user_data.username,))
            if cur.fetchone():
                raise HTTPException(status_code=400, detail="ეს მომხმარებელი უკვე არსებობს")
            
            # შემოწმება: email
            cur.execute("SELECT id FROM users WHERE email = %s", (user_data.email,))
            if cur.fetchone():
                raise HTTPException(status_code=400, detail="ეს ელ.ფოსტა უკვე გამოყენებულია")
            # print("User created successfully?", cur.fetchone())
            # მომხმარებლის შექმნა
            hashed_password = get_password_hash(user_data.password)
            # print("Password hashed successfully:", hashed_password)
            # print("Inserting user into database...",user_data)
            cur.execute("""
                INSERT INTO users (username, email, password)
                VALUES (%s, %s, %s)
                RETURNING id, username, email, is_admin, is_moder, created_at;
            """, (user_data.username, user_data.email, hashed_password))
            # print("User created successfully")
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
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail="რეგისტრაცია ვერ მოხერხდა")
    finally:
        conn.close()


@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    """მომხმარებლის ავტორიზაცია"""
    print("Login endpoint called")
    conn = get_db_connection()
    
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT id, username, email, password, is_admin, is_moder, created_at
                FROM users
                WHERE username = %s AND is_active = TRUE;
            """, (credentials.username,))
            
            user_row = cur.fetchone()
            print("Fetched user row:", user_row)
            if not user_row or not verify_password(credentials.password, user_row[3]):
                raise HTTPException(status_code=401, detail="არასწორი მომხმარებლის სახელი ან პაროლი")
            
            access_token = create_access_token(data={"username": user_row[1], "role": "admin" if user_row[4] else "moderator" if user_row[5] else "user"})
            
            return TokenResponse(
                access_token=access_token,
                token_type="bearer",
                user=UserResponse(
                    id=user_row[0],
                    username=user_row[1],
                    email=user_row[2],
                    is_admin=user_row[4],
                    is_moder=user_row[5],
                    created_at=user_row[6]
                )
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="ავტორიზაცია ვერ მოხერხდა")
    finally:
        conn.close()


# @router.get("/me", response_model=UserResponse)
# async def get_current_user(token: str):
#     """მიმდინარე მომხმარებლის მონაცემები"""
    
#     from app.core.security import decode_access_token
    
#     payload = decode_access_token(token)
#     if not payload:
#         raise HTTPException(status_code=401, detail="Invalid token")
    
#     conn = get_db_connection()
#     try:
#         with conn.cursor() as cur:
#             cur.execute("""
#                 SELECT id, username, email, is_admin, is_moder, created_at
#                 FROM users
#                 WHERE username = %s AND is_active = TRUE;
#             """, (payload.get("sub"),))
            
#             user_row = cur.fetchone()
#             if not user_row:
#                 raise HTTPException(status_code=404, detail="User not found")
            
#             return UserResponse(
#                 id=user_row[0],
#                 username=user_row[1],
#                 email=user_row[2],
#                 is_admin=user_row[3],
#                 is_moder=user_row[4],
#                 created_at=user_row[5]
#             )
#     finally:
#         conn.close()