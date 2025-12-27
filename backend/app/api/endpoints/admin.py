import os
import logging
from fastapi import APIRouter, HTTPException, Depends, Header
from typing import List, Optional
from pydantic import BaseModel
from app.schemas.user import UserResponse
from app.core.security import decode_access_token
from app.config import get_db_connection
from dotenv import load_dotenv
from time import time

# ✅ .env ფაილის ჩატვირთვა
load_dotenv()

router = APIRouter()

# ✅ Logging კონფიგურაცია (production-ში INFO ან WARNING)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger("admin_api")

# ✅ Rate limiting (მარტივი in-memory, მხოლოდ მაგალითისთვის)
RATE_LIMIT = int(os.getenv("ADMIN_RATE_LIMIT", 10))  # მოთხოვნები წუთში
rate_limit_cache = {}

def check_rate_limit(user_id):
    now = int(time())
    window = now // 60  # წუთის window
    key = f"{user_id}:{window}"
    count = rate_limit_cache.get(key, 0)
    if count >= RATE_LIMIT:
        raise HTTPException(status_code=429, detail="Too many requests, please wait.")
    rate_limit_cache[key] = count + 1


# ========== HELPER: Get current admin user ==========
async def get_current_admin(authorization: str = Header(None)):
    """
    Dependency: შეამოწმებს JWT token-ს და დაადასტურებს მხოლოდ Admin უფლებას
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    token = authorization.replace("Bearer ", "")
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    username = payload.get("username")
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT id, username, is_admin
                FROM users
                WHERE username = %s AND is_active = TRUE;
            """, (username,))
            user_row = cur.fetchone()
            if not user_row:
                raise HTTPException(status_code=404, detail="User not found")
            # ✅ მხოლოდ admin
            if not user_row[2]:
                raise HTTPException(status_code=403, detail="Admin access required")
            return {
                "id": user_row[0],
                "username": user_row[1],
                "is_admin": user_row[2]
            }
    finally:
        conn.close()


# ========== 1. GET /api/admin/users - ყველა მომხმარებელი ==========
class UsersListResponse(BaseModel):
    total: int
    users: List[UserResponse]


@router.get("/users", response_model=UsersListResponse)
async def get_all_users(current_user: dict = Depends(get_current_admin)):
    """
    ყველა მომხმარებლის სია
    
    Requires: Admin or Moderator
    """
    check_rate_limit(current_user['id'])
    logger.info(f"Admin request: Get all users by {current_user['username']}")
    
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT id, username, email, is_admin, is_moder, is_active, created_at
                FROM users
                ORDER BY created_at DESC;
            """)
            
            rows = cur.fetchall()
            users = [
                UserResponse(
                    id=row[0],
                    username=row[1],
                    email=row[2],
                    is_admin=row[3],
                    is_moder=row[4],
                    is_active=row[5],
                    created_at=row[6]
                )
                for row in rows
            ]
            logger.info(f"Returned {len(users)} users")
            # ✅ Audit log
            logger.info(f"AUDIT: {current_user['username']} viewed all users")

            return UsersListResponse(
                total=len(users),
                users=users
            )
    finally:
        conn.close()


# ========== 2. PATCH /api/admin/users/{user_id}/toggle-active ==========
@router.patch("/users/{user_id}/toggle-active")
async def toggle_user_active(
    user_id: int,
    current_user: dict = Depends(get_current_admin)
):
    """
    მომხმარებლის აქტივაცია/დეაქტივაცია
    
    Requires: Admin
    """
    check_rate_limit(current_user['id'])
    if not current_user['is_admin']:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Can't deactivate yourself
    if user_id == current_user['id']:
        raise HTTPException(status_code=400, detail="Cannot deactivate yourself")
    
    logger.info(f"Toggling active status for user {user_id} by {current_user['username']}")
    
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            # Get current status
            cur.execute("SELECT is_active FROM users WHERE id = %s;", (user_id,))
            row = cur.fetchone()
            
            if not row:
                raise HTTPException(status_code=404, detail="User not found")
            
            new_status = not row[0]
            
            # Update status
            cur.execute("""
                UPDATE users 
                SET is_active = %s, updated_at = CURRENT_TIMESTAMP
                WHERE id = %s;
            """, (new_status, user_id))
            
            conn.commit()
            
            logger.info(f"User {user_id} is now {'active' if new_status else 'inactive'}")
            # ✅ Audit log
            logger.info(f"AUDIT: {current_user['username']} toggled active status for user {user_id} to {new_status}")
            
            return {
                "success": True,
                "user_id": user_id,
                "is_active": new_status
            }
    except HTTPException:
        raise
    except Exception:
        conn.rollback()
        logger.error(f"Unexpected error in toggle_user_active")
        raise HTTPException(status_code=500, detail="Internal server error")
    finally:
        conn.close()


# ========== 3. PATCH /api/admin/users/{user_id}/role ==========
class UpdateRoleRequest(BaseModel):
    is_admin: Optional[bool] = None
    is_moder: Optional[bool] = None


@router.patch("/users/{user_id}/role")
async def update_user_role(
    user_id: int,
    role_data: UpdateRoleRequest,
    current_user: dict = Depends(get_current_admin)
):
    
    """
    მომხმარებლის როლის შეცვლა (Admin/Moderator)
    
    Requires: Admin
    """
    check_rate_limit(current_user['id'])
    if not current_user['is_admin']:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Can't change your own role
    if user_id == current_user['id']:
        raise HTTPException(status_code=400, detail="Cannot change your own role")
    
    logger.info(f"Updating role for user {user_id} by {current_user['username']}")
    logger.info(f"   New role: is_admin={role_data.is_admin}, is_moder={role_data.is_moder}")
    
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM users WHERE id = %s;", (user_id,))
            if not cur.fetchone():
                raise HTTPException(status_code=404, detail="User not found")
            
            # Build UPDATE query dynamically
            updates = []
            params = []
            
            if role_data.is_admin is not None:
                updates.append("is_admin = %s")
                params.append(role_data.is_admin)
            
            if role_data.is_moder is not None:
                updates.append("is_moder = %s")
                params.append(role_data.is_moder)
            
            if not updates:
                raise HTTPException(status_code=400, detail="No role changes provided")
            
            updates.append("updated_at = CURRENT_TIMESTAMP")
            params.append(user_id)
            
            query = f"UPDATE users SET {', '.join(updates)} WHERE id = %s;"
            cur.execute(query, params)
            
            conn.commit()
            
            logger.info(f"User {user_id} role updated")
            # ✅ Audit log
            logger.info(f"AUDIT: {current_user['username']} updated role for user {user_id}: {role_data.dict()}")
            
            return {
                "success": True,
                "user_id": user_id,
                "is_admin": role_data.is_admin,
                "is_moder": role_data.is_moder
            }
    except HTTPException:
        raise
    except Exception:
        conn.rollback()
        logger.error(f"Unexpected error in update_user_role")
        raise HTTPException(status_code=500, detail="Internal server error")
    finally:
        conn.close()


# ========== 4. DELETE /api/admin/users/{user_id} ==========
@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    current_user: dict = Depends(get_current_admin)
):
    """
    მომხმარებლის წაშლა
    
    Requires: Admin
    WARNING: შეუქცევადი ოპერაცია!
    """
    check_rate_limit(current_user['id'])
    if not current_user['is_admin']:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Can't delete yourself
    if user_id == current_user['id']:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    
    logger.info(f"Deleting user {user_id} by {current_user['username']}")
    
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT username FROM users WHERE id = %s;", (user_id,))
            row = cur.fetchone()
            
            if not row:
                raise HTTPException(status_code=404, detail="User not found")
            
            username = row[0]
            
            # Delete user
            cur.execute("DELETE FROM users WHERE id = %s;", (user_id,))
            conn.commit()
            
            logger.info(f"User {user_id} ({username}) deleted")
            # ✅ Audit log
            logger.info(f"AUDIT: {current_user['username']} deleted user {user_id} ({username})")
            
            return {
                "success": True,
                "user_id": user_id,
                "username": username,
                "message": "User deleted successfully"
            }
    except HTTPException:
        raise
    except Exception:
        conn.rollback()
        logger.error(f"Unexpected error in delete_user")
        raise HTTPException(status_code=500, detail="Internal server error")
    finally:
        conn.close()