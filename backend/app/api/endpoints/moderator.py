# """
# Moderator API Endpoints - წინადადებების მოდერაცია
# """

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db
from app.schemas.sentence import SentenceUpdate, SentenceUpdateResponse
from app.schemas.word import AddWordToTourRequest
from app.api.dependencies import get_current_moderator_user
import json
from pydantic import BaseModel, Field
from typing import List, Optional


router = APIRouter()
# Allowable table names for dedaena data
allowed_tables = ["gogebashvili_1", "gogebashvili_1_test", "gogebashvili_1_with_ids"]


# # ============================================
# # ✅ GET FULL DEDAENA DATA
# # ============================================

@router.get("/dedaena/{table_name}")
async def get_dedaena_data(
    table_name: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_moderator_user)
):
    """
    აბრუნებს ყველა ტურს: id, position, letter და შესაბამისი ელემენტები (words, sentences, proverbs, toread)
    """
    print(f"⚡️ Fetching Dedaena data for moderator: {current_user['username']} from table: {table_name}")
    if not current_user or not isinstance(current_user, dict) or 'username' not in current_user:
        raise HTTPException(status_code=501, detail="Not authenticated as moderator")
    if table_name not in allowed_tables:
        raise HTTPException(status_code=500, detail="Invalid table name")
    
    try:
        # ვიღებთ ყველა ტურს
        result = db.execute(
            text(f"""
                SELECT 
                    id, 
                    position, 
                    letter, 
                    words_ids, 
                    sentences_ids, 
                    proverbs_ids, 
                    toreads_ids
                FROM {table_name} 
                ORDER BY position
            """)
        ).fetchall()
        
        data = []
        for r in result:
            def fetch_items(table, column, ids):
                if not ids:
                    return []
                # ids შეიძლება იყოს array ან სტრინგი
                if isinstance(ids, str):
                    ids = [int(i) for i in ids.split(',') if i.strip().isdigit()]
                items = db.execute(
                    text(f"SELECT * FROM {table} WHERE id = ANY(:ids)"),
                    {"ids": ids}
                ).fetchall()
                # აქ გამოიყენეთ ._mapping რომ მიიღოთ dict
                return [dict(item._mapping) for item in items]
                # return

            words = fetch_items("words","word", r.words_ids)
            sentences = fetch_items("sentences", "sentence", r.sentences_ids)
            proverbs = fetch_items("proverbs", "proverb", r.proverbs_ids)
            toreads = fetch_items("toreads", "toread", r.toreads_ids)


            data.append({
                "id": r.id,
                "position": r.position,
                "letter": r.letter,
                "words": words,
                "sentences": sentences,
                "proverbs": proverbs,
                "toreads": toreads
            })
        
        return {
            "success": True,
            "table_name": table_name,
            "count": len(data),
            "data": data
        }
    
    except Exception as e:
        print(f"   ❌ Error fetching dedaena data: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"An internal server error occurred: {str(e)}"
        )





class TogglePlayableRequest(BaseModel):
    content: str
    is_playable: bool
    # content_type: str  # 'sentences', 'proverbs', 'toreads'

@router.patch("/dedaena/{table_name}/{content_type}/toggle_playable")
async def toggle_is_playable(
    table_name: str,
    content_type: str,
    request: TogglePlayableRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_moderator_user)
):
    table_map = {
        "sentences": ("sentences", "sentence"),
        "proverbs": ("proverbs", "proverb"),
        "toreads": ("toreads", "toread"),
    }
    if content_type not in table_map:
        raise HTTPException(status_code=400, detail="Invalid content_type")
    table_name_db, column_name = table_map[content_type]

    # მოძებნე ჩანაწერი content-ით
    row = db.execute(
        text(f"SELECT id FROM {table_name_db} WHERE {column_name} = :content"),
        {"content": request.content}
    ).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Content not found")

    db.execute(
        text(f"UPDATE {table_name_db} SET is_playable = :is_playable WHERE id = :id"),
        {"is_playable": request.is_playable, "id": row.id}
    )
    db.commit()
    return {"success": True, "id": row.id, "is_playable": request.is_playable}



class DynamicContentRequest(BaseModel):
    """
    დინამიური მოდელი, რომელიც იღებს ყველა შესაძლო ველს.
    ველები, რომლებიც კონკრეტულ მოთხოვნას არ სჭირდება, იქნება None.
    """
    position: int
    content: Optional[str] = None
    arrayIndex: Optional[int] = None # Note the camelCase from frontend
    added_by: Optional[str] = None
    added_at: Optional[str] = None
    edited_by: Optional[str] = None
    edited_at: Optional[str] = None
    deleted_by: Optional[str] = None
    deleted_at: Optional[str] = None


@router.patch("/dedaena/{table_name}/{content_type}/{action}")
async def handle_dynamic_content_action(
    table_name: str,
    content_type: str, # 'word', 'sentence', 'proverb', 'reading'
    action: str,       # 'add', 'update', 'delete'
    request: DynamicContentRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_moderator_user)
):
    # print(f"   Dynamic action request: table={table_name}, content_type={content_type}, action={action}, position={request.position}, arrayIndex={request.arrayIndex}, content={request.content}")
    allowed_tables = ["words", "sentences", "proverbs", "readings"]
    if f"{content_type}s" not in allowed_tables:
        raise HTTPException(status_code=400, detail="Invalid table name")

    db_column = f"{content_type}s"
    if db_column not in ["words", "sentences", "proverbs", "readings"]:
        raise HTTPException(status_code=400, detail="Invalid content type")
    # if db_column == "readings":
    #     db_column = "reading"

    # if db_column == "reading":
    #     ids_column = "toreads_ids"  # თუ ბაზაში ასეა

    ids_column = f"{db_column}_ids"
    try:
        # 1. ამოიღე ids array
        ids_result = db.execute(
            text(f"SELECT {ids_column}, letter FROM {table_name} WHERE position = :pos"),
            {"pos": request.position}
        ).fetchone()
        current_ids = ids_result[0] or []
        tour_letter = ids_result[1]


        # 2. მოქმედება ცალკე ცხრილში და ids განახლება
        if action == "add":
            if not request.content:
                raise HTTPException(status_code=400, detail="Content is required for adding.")

            # დაამატე შესაბამის ცხრილში
            insert_column = "sentence" if content_type == "sentence" else \
                            "proverb" if content_type == "proverb" else \
                            "word" if content_type == "word" else \
                            "toread" if content_type == "reading" else None
            if not insert_column:
                raise HTTPException(status_code=400, detail="Invalid content type for insert.")

            insert_query = text(f"""
                INSERT INTO {db_column} ({insert_column})
                VALUES (:content)
                RETURNING id
            """)
            inserted = db.execute(insert_query, {"content": request.content.strip()}).fetchone()
            if not inserted:
                raise HTTPException(status_code=500, detail="Failed to insert content.")
            new_id = inserted.id

            updated_ids = current_ids + [new_id]
            message = f"'{request.content[:20]}...' წარმატებით დაემატა {db_column} და {ids_column}-ში."

        elif action == "update":
            # განახლება id-ით (content ან id უნდა იყოს მოწოდებული)
            update_id = None
            if hasattr(request, "id") and request.id is not None:
                update_id = request.id
            elif request.content is not None:
                # მოძებნე id content-ით
                # მოძებნე შესაბამისი ჩანაწერი
                update_column = "sentence" if content_type == "sentence" else \
                                "proverb" if content_type == "proverb" else \
                                "word" if content_type == "word" else \
                                "toread" if content_type == "reading" else None
                row = db.execute(
                    text(f"SELECT id FROM {db_column} WHERE {update_column} = :content"),
                    {"content": request.content.strip()}
                ).fetchone()
                if not row:
                    raise HTTPException(status_code=404, detail="Content not found for update.")
                update_id = row.id
            else:
                raise HTTPException(status_code=400, detail="id or content is required for updating.")

            update_column = "sentence" if content_type == "sentence" else \
                            "proverb" if content_type == "proverb" else \
                            "word" if content_type == "word" else \
                            "toread" if content_type == "reading" else None
            update_query = text(f"""
                UPDATE {db_column}
                SET {update_column} = :content
                WHERE id = :id
            """)
            db.execute(update_query, {"content": request.content.strip(), "id": update_id})
            updated_ids = current_ids
            message = f"ელემენტი განახლდა {db_column} ცხრილში და {ids_column}-ში."

        elif action == "delete":
            # წაშლა id-ით (content ან id უნდა იყოს მოწოდებული)
            delete_id = None
            if hasattr(request, "id") and request.id is not None:
                delete_id = request.id
            elif request.content is not None:
                # მოძებნე id content-ით
                delete_column = "sentence" if content_type == "sentence" else \
                                "proverb" if content_type == "proverb" else \
                                "word" if content_type == "word" else \
                                "toread" if content_type == "reading" else None
                row = db.execute(
                    text(f"SELECT id FROM {db_column} WHERE {delete_column} = :content"),
                    {"content": request.content.strip()}
                ).fetchone()
                if not row:
                    raise HTTPException(status_code=404, detail="Content not found for delete.")
                delete_id = row.id
            else:
                raise HTTPException(status_code=400, detail="id or content is required for deleting.")

            # წაშალე შესაბამის ცხრილში
            db.execute(
                text(f"DELETE FROM {db_column} WHERE id = :id"),
                {"id": delete_id}
            )
            # ids-იდან ამოიღე ეს id
            updated_ids = [i for i in current_ids if i != delete_id]
            message = f"ელემენტი წაიშალა {db_column} ცხრილიდან და {ids_column}-დან."

        else:
            raise HTTPException(status_code=400, detail=f"Invalid action: {action}")

        # 3. განაახლე ids array
        db.execute(
            text(f"""
                UPDATE {table_name}
                SET {ids_column} = :ids
                WHERE position = :position
            """),
            {"ids": updated_ids, "position": request.position}
        )

        db.commit()
        print(f"   ✅ წარმატება: {message}")
        return {"success": True, "message": message, "position": request.position, "letter": tour_letter}

    except HTTPException as e:
        db.rollback()
        raise e
    except Exception as e:
        db.rollback()
        print(f"   ❌ Error in dynamic action: {str(e)}")
        raise HTTPException(status_code=500, detail=f"An internal server error occurred: {str(e)}")










