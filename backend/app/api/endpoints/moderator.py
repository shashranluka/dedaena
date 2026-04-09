# """
# Moderator API Endpoints - წინადადებების მოდერაცია
# """

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db
from app.schemas.sentence import SentenceUpdate, SentenceUpdateResponse
from app.schemas.word import AddWordToTourRequest
from app.schemas.story import StoryCreateRequest, StoryUpdateRequest, StoryTogglePlayableRequest
from app.api.dependencies import get_current_moderator_user
# from app.core.audit import log_audit_event
import json
import re
from pydantic import BaseModel, Field
from typing import List, Optional
from app.core.audit import log_audit_event


def split_story_into_sentences(story_text: str) -> list:
    """ისტორიის ტექსტის წინადადებებად დაშლა (ფრონტენდის ლოგიკის იდენტური)"""
    if not story_text or not story_text.strip():
        return []
    sentences = re.split(r'(?<=[.!?])\s+|\n+', story_text.strip())
    return [s.strip() for s in sentences if s.strip()]


def insert_sentences_for_story(db, sentences: list, user_id: int) -> list:
    """წინადადებების ჩასმა sentences ცხრილში, დაბრუნებული ID-ების სია"""
    sentence_ids = []
    for sentence in sentences:
        result = db.execute(
            text("""
                INSERT INTO sentences (sentence, created_by, updated_by, is_playable)
                VALUES (:sentence, :user_id, :user_id, false)
                RETURNING id
            """),
            {"sentence": sentence, "user_id": user_id}
        ).fetchone()
        if result:
            sentence_ids.append(result.id)
    return sentence_ids


def delete_sentences_by_ids(db, sentence_ids: list):
    """წინადადებების წაშლა ID-ების მიხედვით"""
    if not sentence_ids:
        return
    db.execute(
        text("DELETE FROM sentences WHERE id = ANY(:ids)"),
        {"ids": sentence_ids}
    )


DEDAENA_TABLE = "gogebashvili_1_with_ids"


def assign_sentences_to_tours(db, sentence_ids: list, sentences: list):
    """წინადადებების ID-ების მინიჭება შესაბამის ტურებს gogebashvili ცხრილში"""
    if not sentence_ids or not sentences:
        return
    # ტურების წამოღება (მაღალი position-იდან დაბალისკენ - იდენტური ფრონტენდის ლოგიკასთან)
    tours = db.execute(
        text(f"SELECT position, letter, sentences_ids FROM {DEDAENA_TABLE} ORDER BY position DESC")
    ).fetchall()

    # ყოველი წინადადისთვის ტურის გამოცნობა
    tour_new_ids = {}  # position -> [new sentence ids]
    for sentence, sid in zip(sentences, sentence_ids):
        for tour in tours:
            if tour.letter in sentence:
                tour_new_ids.setdefault(tour.position, []).append(sid)
                break

    # თითოეული ტურის sentences_ids განახლება
    for tour in tours:
        if tour.position in tour_new_ids:
            current_ids = list(tour.sentences_ids or [])
            updated_ids = current_ids + tour_new_ids[tour.position]
            db.execute(
                text(f"UPDATE {DEDAENA_TABLE} SET sentences_ids = :ids WHERE position = :position"),
                {"ids": updated_ids, "position": tour.position}
            )


def remove_sentences_from_tours(db, sentence_ids: list):
    """წინადადებების ID-ების ამოღება gogebashvili ცხრილის ტურებიდან"""
    if not sentence_ids:
        return
    ids_set = set(sentence_ids)
    tours = db.execute(
        text(f"SELECT position, sentences_ids FROM {DEDAENA_TABLE} WHERE sentences_ids && :ids"),
        {"ids": sentence_ids}
    ).fetchall()
    for tour in tours:
        current_ids = list(tour.sentences_ids or [])
        updated_ids = [i for i in current_ids if i not in ids_set]
        db.execute(
            text(f"UPDATE {DEDAENA_TABLE} SET sentences_ids = :ids WHERE position = :position"),
            {"ids": updated_ids, "position": tour.position}
        )


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
        "words": ("words", "word"),
        "sentences": ("sentences", "sentence"),
        "proverbs": ("proverbs", "proverb"),
        "toreads": ("toreads", "toread"),
    }
    if content_type not in table_map:
        raise HTTPException(status_code=400, detail="Invalid content_type")
    table_name_db, column_name = table_map[content_type]

    # მოძებნე ჩანაწერი content-ით
    row = db.execute(
        text(f"SELECT id, is_playable FROM {table_name_db} WHERE {column_name} = :content"),
        {"content": request.content}
    ).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Content not found")

    old_value = str(row.is_playable) if row.is_playable is not None else "None"
    
    db.execute(
        text(f"UPDATE {table_name_db} SET is_playable = :is_playable, updated_by = :user_id WHERE id = :id"),
        {"is_playable": request.is_playable, "id": row.id, "user_id": current_user["id"]}
    )
    db.commit()
    
    # ✅ Audit log
    try:
        log_audit_event(
            user_id=current_user['id'],
            username=current_user['username'],
            action="TOGGLE_PLAYABLE",
            table_name=table_name_db,
            record_id=row.id,
            old_value=old_value,
            new_value=str(request.is_playable)
        )
    except Exception as audit_err:
        print(f"⚠️ Failed to log audit event: {audit_err}")
    
    return {"success": True, "id": row.id, "is_playable": request.is_playable}



class DynamicContentRequest(BaseModel):
    """
    დინამიური მოდელი, რომელიც იღებს ყველა შესაძლო ველს.
    ველები, რომლებიც კონკრეტულ მოთხოვნას არ სჭირდება, იქნება None.
    """
    position: int
    content: Optional[str] = None
    arrayIndex: Optional[int] = None # Note the camelCase from frontend
    id: Optional[str] = None
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
    print(f"⚡️ Dynamic action request by moderator: {current_user}")
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
                INSERT INTO {db_column} ({insert_column}, created_by, updated_by)
                VALUES (:content, :user_id, :user_id)
                RETURNING id
            """)
            inserted = db.execute(insert_query, {"content": request.content.strip(), "user_id": current_user["id"]}).fetchone()
            if not inserted:
                raise HTTPException(status_code=500, detail="Failed to insert content.")
            new_id = inserted.id

            updated_ids = current_ids + [new_id]
            message = f"'{request.content[:20]}...' წარმატებით დაემატა {db_column} და {ids_column}-ში."
            
            # Audit log for CREATE
            try:
                log_audit_event(
                    user_id=current_user['id'],
                    username=current_user['username'],
                    action="CREATE",
                    table_name=db_column,
                    record_id=new_id,
                    new_value=request.content.strip()
                )
            except Exception as audit_err:
                print(f"⚠️ Failed to log audit event: {audit_err}")

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
                # row = db.execute(
                #     text(f"SELECT id FROM {db_column} WHERE {update_column} = :content"),
                #     {"content": request.content.strip()}
                # ).fetchone()
                # if not row:
                #     raise HTTPException(status_code=404, detail="Content not found for update.")
                update_id = request.id
            else:
                raise HTTPException(status_code=400, detail="id or content is required for updating.")

            update_column = "sentence" if content_type == "sentence" else \
                            "proverb" if content_type == "proverb" else \
                            "word" if content_type == "word" else \
                            "toread" if content_type == "reading" else None
            
            # Get old value before update
            old_row = db.execute(
                text(f"SELECT {update_column} FROM {db_column} WHERE id = :id"),
                {"id": update_id}
            ).fetchone()
            old_value = old_row[0] if old_row else None
            
            update_query = text(f"""
                UPDATE {db_column}
                SET 
                    {update_column} = :content,
                    updated_by = :user_id
                WHERE id = :id
            """)
            db.execute(update_query, {"content": request.content.strip(), "user_id": current_user["id"], "id": update_id})
            updated_ids = current_ids
            message = f"ელემენტი განახლდა {db_column} ცხრილში და {ids_column}-ში."
            
            # Audit log for UPDATE
            try:
                log_audit_event(
                    user_id=current_user['id'],
                    username=current_user['username'],
                    action="UPDATE",
                    table_name=db_column,
                    record_id=update_id,
                    old_value=old_value,
                    new_value=request.content.strip()
                )
            except Exception as audit_err:
                print(f"⚠️ Failed to log audit event: {audit_err}")

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

            # Get old value before delete
            delete_column = "sentence" if content_type == "sentence" else \
                           "proverb" if content_type == "proverb" else \
                           "word" if content_type == "word" else \
                           "toread" if content_type == "reading" else None
            old_row = db.execute(
                text(f"SELECT {delete_column} FROM {db_column} WHERE id = :id"),
                {"id": delete_id}
            ).fetchone()
            old_value = old_row[0] if old_row else None
            
            # წაშალე შესაბამის ცხრილში
            db.execute(
                text(f"DELETE FROM {db_column} WHERE id = :id"),
                {"id": delete_id}
            )
            # ids-იდან ამოიღე ეს id
            updated_ids = [i for i in current_ids if i != delete_id]
            message = f"ელემენტი წაიშალა {db_column} ცხრილიდან და {ids_column}-დან."
            
            # Audit log for DELETE
            try:
                log_audit_event(
                    user_id=current_user['id'],
                    username=current_user['username'],
                    action="DELETE",
                    table_name=db_column,
                    record_id=delete_id,
                    old_value=old_value
                )
            except Exception as audit_err:
                print(f"⚠️ Failed to log audit event: {audit_err}")

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


# ============================================
# ✅ STORIES CRUD ENDPOINTS
# ============================================

@router.get("/stories")
async def get_stories(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_moderator_user)
):
    try:
        result = db.execute(
            text("SELECT * FROM stories ORDER BY id DESC")
        ).fetchall()
        stories = [dict(row._mapping) for row in result]
        return {"success": True, "count": len(stories), "data": stories}
    except Exception as e:
        print(f"   ❌ Error fetching stories: {str(e)}")
        raise HTTPException(status_code=500, detail=f"An internal server error occurred: {str(e)}")


@router.post("/stories")
async def create_story(
    request: StoryCreateRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_moderator_user)
):
    try:
        # 1. ისტორიის ჩასმა
        result = db.execute(
            text("""
                INSERT INTO stories (title, story, story_type, source, created_by, updated_by, is_playable)
                VALUES (:title, :story, :story_type, :source, :user_id, :user_id, false)
                RETURNING *
            """),
            {
                "title": request.title.strip(),
                "story": request.story.strip(),
                "story_type": request.story_type or "სხვა",
                "source": request.source.strip() if request.source else None,
                "user_id": current_user["id"],
            }
        ).fetchone()
        story = dict(result._mapping)

        # 2. ტექსტის წინადადებებად დაშლა და sentences ცხრილში ჩასმა
        sentences = split_story_into_sentences(request.story.strip())
        sentence_ids = insert_sentences_for_story(db, sentences, current_user["id"])

        # 3. sentences_ids განახლება stories ცხრილში
        if sentence_ids:
            db.execute(
                text("UPDATE stories SET sentences_ids = :ids WHERE id = :id"),
                {"ids": sentence_ids, "id": story["id"]}
            )
            story["sentences_ids"] = sentence_ids

        # 4. წინადადებების მინიჭება შესაბამის ტურებს gogebashvili ცხრილში
        assign_sentences_to_tours(db, sentence_ids, sentences)

        db.commit()

        try:
            log_audit_event(
                user_id=current_user['id'],
                username=current_user['username'],
                action="CREATE",
                table_name="stories",
                record_id=story["id"],
                new_value=request.title.strip()
            )
        except Exception as audit_err:
            print(f"⚠️ Failed to log audit event: {audit_err}")

        return {"success": True, "message": f"ისტორია წარმატებით შეიქმნა ({len(sentence_ids)} წინადადება)", "data": story}

    except Exception as e:
        db.rollback()
        print(f"   ❌ Error creating story: {str(e)}")
        raise HTTPException(status_code=500, detail=f"An internal server error occurred: {str(e)}")


@router.patch("/stories/{story_id}")
async def update_story(
    story_id: int,
    request: StoryUpdateRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_moderator_user)
):
    try:
        existing = db.execute(
            text("SELECT * FROM stories WHERE id = :id"),
            {"id": story_id}
        ).fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="ისტორია ვერ მოიძებნა")

        old_data = dict(existing._mapping)

        fields_to_update = {}
        if request.title is not None:
            fields_to_update["title"] = request.title.strip()
        if request.story is not None:
            fields_to_update["story"] = request.story.strip()
        if request.story_type is not None:
            fields_to_update["story_type"] = request.story_type
        if request.source is not None:
            fields_to_update["source"] = request.source.strip()

        if not fields_to_update:
            raise HTTPException(status_code=400, detail="განახლებისთვის ველები არ არის მითითებული")

        # თუ ტექსტი შეიცვალა, ძველი წინადადებები წაიშლება და ახლები ჩაემატება
        if request.story is not None:
            old_sentence_ids = old_data.get("sentences_ids") or []
            remove_sentences_from_tours(db, old_sentence_ids)
            delete_sentences_by_ids(db, old_sentence_ids)

            new_sentences = split_story_into_sentences(request.story.strip())
            new_sentence_ids = insert_sentences_for_story(db, new_sentences, current_user["id"])
            fields_to_update["sentences_ids"] = new_sentence_ids
            assign_sentences_to_tours(db, new_sentence_ids, new_sentences)

        fields_to_update["updated_by"] = current_user["id"]

        set_clause = ", ".join(f"{k} = :{k}" for k in fields_to_update)
        fields_to_update["id"] = story_id

        db.execute(
            text(f"UPDATE stories SET {set_clause}, updated_at = NOW() WHERE id = :id"),
            fields_to_update
        )
        db.commit()

        updated = db.execute(
            text("SELECT * FROM stories WHERE id = :id"),
            {"id": story_id}
        ).fetchone()
        story = dict(updated._mapping)

        try:
            log_audit_event(
                user_id=current_user['id'],
                username=current_user['username'],
                action="UPDATE",
                table_name="stories",
                record_id=story_id,
                old_value=old_data.get("title", ""),
                new_value=story.get("title", "")
            )
        except Exception as audit_err:
            print(f"⚠️ Failed to log audit event: {audit_err}")

        return {"success": True, "message": "ისტორია წარმატებით განახლდა", "data": story}

    except HTTPException as e:
        raise e
    except Exception as e:
        db.rollback()
        print(f"   ❌ Error updating story: {str(e)}")
        raise HTTPException(status_code=500, detail=f"An internal server error occurred: {str(e)}")


@router.delete("/stories/{story_id}")
async def delete_story(
    story_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_moderator_user)
):
    try:
        existing = db.execute(
            text("SELECT * FROM stories WHERE id = :id"),
            {"id": story_id}
        ).fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="ისტორია ვერ მოიძებნა")

        old_data = dict(existing._mapping)

        # ისტორიის წინადადებების წაშლა sentences ცხრილიდან და gogebashvili ტურებიდან
        old_sentence_ids = old_data.get("sentences_ids") or []
        remove_sentences_from_tours(db, old_sentence_ids)
        delete_sentences_by_ids(db, old_sentence_ids)

        db.execute(
            text("DELETE FROM stories WHERE id = :id"),
            {"id": story_id}
        )
        db.commit()

        try:
            log_audit_event(
                user_id=current_user['id'],
                username=current_user['username'],
                action="DELETE",
                table_name="stories",
                record_id=story_id,
                old_value=old_data.get("title", "")
            )
        except Exception as audit_err:
            print(f"⚠️ Failed to log audit event: {audit_err}")

        return {"success": True, "message": "ისტორია წარმატებით წაიშალა"}

    except HTTPException as e:
        raise e
    except Exception as e:
        db.rollback()
        print(f"   ❌ Error deleting story: {str(e)}")
        raise HTTPException(status_code=500, detail=f"An internal server error occurred: {str(e)}")


@router.patch("/stories/{story_id}/toggle_playable")
async def toggle_story_playable(
    story_id: int,
    request: StoryTogglePlayableRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_moderator_user)
):
    try:
        existing = db.execute(
            text("SELECT id, is_playable, sentences_ids FROM stories WHERE id = :id"),
            {"id": story_id}
        ).fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="ისტორია ვერ მოიძებნა")

        old_value = str(existing.is_playable) if existing.is_playable is not None else "None"

        db.execute(
            text("UPDATE stories SET is_playable = :is_playable, updated_by = :user_id, updated_at = NOW() WHERE id = :id"),
            {"is_playable": request.is_playable, "user_id": current_user["id"], "id": story_id}
        )

        # შესაბამისი წინადადებების is_playable-ც განახლდეს
        story_sentence_ids = existing.sentences_ids or []
        if story_sentence_ids:
            db.execute(
                text("UPDATE sentences SET is_playable = :is_playable, updated_by = :user_id WHERE id = ANY(:ids)"),
                {"is_playable": request.is_playable, "user_id": current_user["id"], "ids": story_sentence_ids}
            )

        db.commit()

        try:
            log_audit_event(
                user_id=current_user['id'],
                username=current_user['username'],
                action="TOGGLE_PLAYABLE",
                table_name="stories",
                record_id=story_id,
                old_value=old_value,
                new_value=str(request.is_playable)
            )
        except Exception as audit_err:
            print(f"⚠️ Failed to log audit event: {audit_err}")

        return {"success": True, "id": story_id, "is_playable": request.is_playable}

    except HTTPException as e:
        raise e
    except Exception as e:
        db.rollback()
        print(f"   ❌ Error toggling story playable: {str(e)}")
        raise HTTPException(status_code=500, detail=f"An internal server error occurred: {str(e)}")










