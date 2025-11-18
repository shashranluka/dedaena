from fastapi import APIRouter, HTTPException, Depends, Header
from typing import List, Optional
from pydantic import BaseModel
from app.schemas.user import UserResponse
from app.core.security import decode_access_token
from app.config import get_db_connection

router = APIRouter()


# ========== HELPER: Get current admin user ==========
async def get_current_admin(authorization: str = Header(None)):
    """
    Dependency: შეამოწმებს JWT token-ს და დაადასტურებს Admin უფლებას
    
    Header: Authorization: Bearer <token>
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    
    token = authorization.replace("Bearer ", "")
    payload = decode_access_token(token)
    
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    username = payload.get("sub")
    
    # Check if user is admin
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT id, username, is_admin, is_moder
                FROM users
                WHERE username = %s AND is_active = TRUE;
            """, (username,))
            
            user_row = cur.fetchone()
            
            if not user_row:
                raise HTTPException(status_code=404, detail="User not found")
            
            # Must be admin or moderator
            if not user_row[2] and not user_row[3]:  # is_admin or is_moder
                raise HTTPException(status_code=403, detail="Admin or Moderator access required")
            
            return {
                "id": user_row[0],
                "username": user_row[1],
                "is_admin": user_row[2],
                "is_moder": user_row[3]
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
    print(f"📥 Admin request: Get all users by {current_user['username']}")
    
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT id, username, email, is_admin, is_moder, is_active, created_at
                FROM users
                ORDER BY created_at DESC;
            """)
            
            rows = cur.fetchall()
            print(f"Fetched {len(rows)} users from database", rows)
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

            print(f"✅ Returned {len(users)} users", users)

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
    # Only admins can toggle active status
    if not current_user['is_admin']:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Can't deactivate yourself
    if user_id == current_user['id']:
        raise HTTPException(status_code=400, detail="Cannot deactivate yourself")
    
    print(f"🔄 Toggling active status for user {user_id} by {current_user['username']}")
    
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
            
            print(f"✅ User {user_id} is now {'active' if new_status else 'inactive'}")
            
            return {
                "success": True,
                "user_id": user_id,
                "is_active": new_status
            }
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        print(f"❌ Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
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
    # Only admins can change roles
    print(f"👑 Updating role for user {user_id} by {current_user['username']}")
    if not current_user['is_admin']:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Can't change your own role
    if user_id == current_user['id']:
        raise HTTPException(status_code=400, detail="Cannot change your own role")
    
    print(f"👑 Updating role for user {user_id} by {current_user['username']}")
    print(f"   New role: is_admin={role_data.is_admin}, is_moder={role_data.is_moder}")
    
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            # Check user exists
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
            
            print(f"✅ User {user_id} role updated")
            
            return {
                "success": True,
                "user_id": user_id,
                "is_admin": role_data.is_admin,
                "is_moder": role_data.is_moder
            }
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        print(f"❌ Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
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
    # Only admins can delete users
    if not current_user['is_admin']:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Can't delete yourself
    if user_id == current_user['id']:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    
    print(f"🗑️  Deleting user {user_id} by {current_user['username']}")
    
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            # Check user exists
            cur.execute("SELECT username FROM users WHERE id = %s;", (user_id,))
            row = cur.fetchone()
            
            if not row:
                raise HTTPException(status_code=404, detail="User not found")
            
            username = row[0]
            
            # Delete user
            cur.execute("DELETE FROM users WHERE id = %s;", (user_id,))
            conn.commit()
            
            print(f"✅ User {user_id} ({username}) deleted")
            
            return {
                "success": True,
                "user_id": user_id,
                "username": username,
                "message": "User deleted successfully"
            }
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        print(f"❌ Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()