"""
Audit Logging Utility
"""

import logging
from typing import Optional
from app.config import get_db_connection

logger = logging.getLogger("audit")


def log_audit_event(
    user_id: int,
    username: str,
    action: str,
    table_name: str,
    record_id: Optional[int] = None,
    old_value: Optional[str] = None,
    new_value: Optional[str] = None,
    ip_address: Optional[str] = None
):
    """
    Log audit event to database
    
    Args:
        user_id: ID of user performing action
        username: Username of user
        action: Action type (CREATE, UPDATE, DELETE, TOGGLE_PLAYABLE)
        table_name: Table being modified (words, sentences, proverbs, toreads)
        record_id: ID of record being modified
        old_value: Previous value (for updates/deletes)
        new_value: New value (for creates/updates)
        ip_address: IP address of request
    """
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO audit_logs 
                (user_id, username, action, table_name, record_id, old_value, new_value, ip_address)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, (user_id, username, action, table_name, record_id, old_value, new_value, ip_address))
            conn.commit()
            logger.info(f"Audit: {username} performed {action} on {table_name} (record_id: {record_id})")
    except Exception as e:
        logger.error(f"Failed to log audit event: {e}")
        conn.rollback()
    finally:
        conn.close()
