"""
Moderator API Endpoints - წინადადებების მოდერაცია
"""

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

# ✅ დამატებული imports ანდაზებისთვის
import psycopg2
from psycopg2.extras import RealDictCursor
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()



# from .. import schemas, database, auth

# router = APIRouter(
#     prefix="/moderator",
#     tags=["Moderator"],
#     dependencies=[Depends(auth.get_current_moderator)] # ✅ იცავს ყველა როუტს ამ ფაილში
# )

# ===== HELPER FUNCTION =====
def get_db_connection():
    """
    ✅ PostgreSQL connection helper for proverbs endpoints
    """
    return psycopg2.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=os.getenv("DB_PORT", "5432"),
        database=os.getenv("DB_NAME", "dedaena_db"),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD", "your_password")
    )


# ===== SCHEMAS =====
allowed_tables = ["gogebashvili_1", "gogebashvili_1_test"]

class WordAddWithTourRequest(BaseModel):
    """სიტყვის დამატება ზოგად ბაზაში + კონკრეტულ ტურში"""
    normalized_word: str = Field(..., description="დასამატებელი სიტყვა", min_length=1, max_length=100)
    original_word: str = Field(..., description="დასამატებელი სიტყვა", min_length=1, max_length=100)
    part_of_speech: str = Field(..., description="წინადადების ნაწილი", min_length=1, max_length=100)
    position: int = Field(..., description="ტურის პოზიცია", ge=1)
    table_name: str = Field(..., description="ცხრილის სახელი")
    added_by: str = Field(..., description="მოდერატორის username")
    added_at: str = Field(..., description="დამატების თარიღი (ISO ფორმატი)")


class WordAddWithTourResponse(BaseModel):
    """სიტყვის დამატების პასუხი (ბაზა + ტური)"""
    success: bool
    message: str
    normalized_word: str
    original_word: str
    part_of_speech: str
    word_id: int = Field(..., description="ID ზოგად ბაზაში")
    position: int
    letter: str
    words_count: int = Field(..., description="ამ ტურში სიტყვების რაოდენობა")
    added_at: str


class WordUpdateRequest(BaseModel):
    """სიტყვის განახლება კონკრეტულ ტურში"""
    position: int = Field(..., description="ტურის პოზიცია", ge=1)
    word_index: int = Field(..., description="სიტყვის ინდექსი array-ში", ge=0)
    new_word: str = Field(..., description="ახალი სიტყვა", min_length=1, max_length=100)
    table_name: str = Field(..., description="ცხრილის სახელი")
    edited_by: str = Field(..., description="მოდერატორის username")
    edited_at: str = Field(..., description="რედაქტირების თარიღი (ISO ფორმატი)")


class WordUpdateResponse(BaseModel):
    """სიტყვის განახლების პასუხი"""
    success: bool
    message: str
    old_word: str
    new_word: str
    position: int
    letter: str
    word_index: int
    words_count: int
    edited_at: str


class WordDeleteRequest(BaseModel):
    """სიტყვის წაშლა კონკრეტული ტურიდან"""
    position: int = Field(..., description="ტურის პოზიცია", ge=1)
    word_index: int = Field(..., description="სიტყვის ინდექსი array-ში", ge=0)
    table_name: str = Field(..., description="ცხრილის სახელი")
    deleted_by: str = Field(..., description="მოდერატორის username")
    deleted_at: str = Field(..., description="წაშლის თარიღი (ISO ფორმატი)")


class WordDeleteResponse(BaseModel):
    """სიტყვის წაშლის პასუხი"""
    success: bool
    message: str
    deleted_word: str
    position: int
    letter: str
    word_index: int
    words_count: int = Field(..., description="დარჩენილი სიტყვების რაოდენობა")
    deleted_at: str


# ✅ 1. ADD NEW SCHEMA FOR ADDING A SENTENCE
class SentenceAddRequest(BaseModel):
    position: int
    content: str
    table_name: str
    added_by: str
    added_at: str


# ===== ENDPOINTS =====

@router.post("/word/add", response_model=WordAddWithTourResponse)
async def add_word_with_tour(
    word_data: WordAddWithTourRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_moderator_user)
):
    """
    სიტყვის დამატება ზოგად ბაზაში + კონკრეტულ ტურში
    
    1. ამატებს სიტყვას `words` ცხრილში (ზოგადი ბაზა)
    2. ამატებს სიტყვას `gogebashvili_1.words` JSONB array-ში (კონკრეტული ტური)
    """
    print(f"➕ Add word request from: {current_user['username']}")
    print(f"   Position: {word_data.position}")
    
    try:
        # ✅ Table validation
        if word_data.table_name not in allowed_tables:
            raise HTTPException(400, "Invalid table name")
        
        # ✅ სიტყვის ნორმალიზაცია
        normalized_word = word_data.normalized_word.strip().lower()
        original_word = word_data.original_word.strip()
        
        # ===== STEP 1: დამატება ზოგად ბაზაში =====
        
        check_general = text("""
            SELECT id, original 
            FROM words 
            WHERE LOWER(deconstructed) = LOWER(:normalized)
        """)
        
        existing_general = db.execute(check_general, {"normalized": normalized_word}).fetchone()
        word_id = None
        
        if existing_general:
            word_id = existing_general.id
            print(f"   ℹ️ Word exists in DB (ID: {word_id})")
        else:
            insert_general = text("""
                INSERT INTO words (deconstructed, original, part_of_speech, source_table, added_by, added_at, created_at)
                VALUES (:normalized_word, :original_word, :part_of_speech, :source_table, :added_by, :added_at, NOW())
                RETURNING id
            """)
            
            result_general = db.execute(insert_general, {
                "normalized_word": normalized_word,
                "original_word": original_word,
                "part_of_speech": word_data.part_of_speech,
                "source_table": word_data.table_name,
                "added_by": word_data.added_by,
                "added_at": word_data.added_at
            }).fetchone()
            
            word_id = result_general.id
            print(f"   ✅ Added to DB (ID: {word_id})")
        
        # ===== STEP 2: დამატება ტურში =====
        
        result_tour = db.execute(
            text(f"SELECT position, letter, words FROM {word_data.table_name} WHERE position = :pos"),
            {"pos": word_data.position}
        ).fetchone()
        
        if not result_tour:
            raise HTTPException(404, f"Position {word_data.position} not found")
        
        position, letter, words = result_tour
        
        print(f"   Tour: {letter} (pos {position})")
        
        # JSONB → Python list
        if isinstance(words, str):
            words = json.loads(words)
        elif not isinstance(words, list):
            words = []
        
        # დუბლიკატის შემოწმება
        if normalized_word in [w.lower() for w in words]:
            print(f"   ℹ️ Word exists in tour")
            
            db.commit()
            
            return WordAddWithTourResponse(
                success=True,
                message=f'სიტყვა "{normalized_word}" უკვე არსებობს {letter} ტურში',
                normalized_word=normalized_word,
                original_word=original_word,
                part_of_speech=word_data.part_of_speech,
                word_id=word_id,
                position=position,
                letter=letter,
                words_count=len(words),
                added_at=word_data.added_at
            )
        
        # დამატება
        words.append(normalized_word)
        
        print(f"   Adding to tour...")
        
        # JSON string
        words_json = json.dumps(words, ensure_ascii=False)
        
        # UPDATE
        update_tour = text(f"""
            UPDATE {word_data.table_name}
            SET words = CAST(:words_json AS jsonb)
            WHERE position = :position
        """)
        
        db.execute(update_tour, {
            "words_json": words_json,
            "position": word_data.position
        })
        
        db.commit()
        
        print(f"   ✅ Success! Total words: {len(words)}")
        
        return WordAddWithTourResponse(
            success=True,
            message=f'სიტყვა "{normalized_word}" დაემატა ბაზაში და {letter} ტურში',
            normalized_word=normalized_word,
            original_word=original_word,
            part_of_speech=word_data.part_of_speech,
            word_id=word_id,
            position=position,
            letter=letter,
            words_count=len(words),
            added_at=word_data.added_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
        db.rollback()
        raise HTTPException(500, f"Error: {str(e)}")


# ✅ 2. ADD THE NEW ENDPOINT FOR ADDING A SENTENCE
@router.post("/sentence/add", status_code=status.HTTP_201_CREATED)
async def add_sentence(
    request: SentenceAddRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_moderator_user)
):
    """ახალი წინადადების დამატება კონკრეტულ ტურში"""
    print(f"➕ Add sentence request from: {current_user['username']} to position {request.position}")

    try:
        if request.table_name not in allowed_tables:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid table name")

        # Fetch the tour to update
        result = db.execute(
            text(f"SELECT sentences, letter FROM {request.table_name} WHERE position = :pos"),
            {"pos": request.position}
        ).fetchone()

        if not result:
            raise HTTPException(status.HTTP_404_NOT_FOUND, f"Tour with position {request.position} not found")

        current_sentences = result[0] or []
        tour_letter = result[1]

        # Add the new sentence
        new_sentence = request.content.strip()
        if not new_sentence:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Sentence content cannot be empty")
        
        updated_sentences = current_sentences + [new_sentence]
        
        # Convert to JSON string and update the database
        sentences_json = json.dumps(updated_sentences, ensure_ascii=False)
        
        update_query = text(f"""
            UPDATE {request.table_name}
            SET sentences = CAST(:sentences_json AS jsonb)
            WHERE position = :position
        """)
        
        db.execute(update_query, {
            "sentences_json": sentences_json,
            "position": request.position
        })
        
        db.commit()
        
        print(f"   ✅ Sentence added successfully. Total sentences: {len(updated_sentences)}")

        return {
            "success": True,
            "message": "Sentence added successfully",
            "position": request.position,
            "letter": tour_letter,
            "added_content": new_sentence,
            "total_sentences": len(updated_sentences)
        }

    except HTTPException as e:
        db.rollback()
        raise e
    except Exception as e:
        db.rollback()
        print(f"   ❌ Error adding sentence: {str(e)}")
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, f"Error: {str(e)}")


@router.patch("/word/update", response_model=WordUpdateResponse)
async def update_word_in_tour(
    word_data: WordUpdateRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_moderator_user)
):
    """
    სიტყვის განახლება კონკრეტულ ტურში
    
    განაახლებს სიტყვას `gogebashvili_1.words` JSONB array-ში
    """
    print(f"✏️ Update word request from: {current_user['username']}")
    print(f"   Position: {word_data.position}, Index: {word_data.word_index}")
    print(f"   New word: {word_data.new_word}")
    
    try:
        # ✅ Table validation
        if word_data.table_name not in allowed_tables:
            raise HTTPException(400, "Invalid table name")
        
        # ✅ მონაცემების მიღება
        result = db.execute(
            text(f"SELECT position, letter, words FROM {word_data.table_name} WHERE position = :pos"),
            {"pos": word_data.position}
        ).fetchone()
        
        if not result:
            raise HTTPException(404, f"Position {word_data.position} not found")
        
        position, letter, words = result
        
        print(f"   Tour: {letter} (pos {position})")
        
        # ✅ JSONB → Python list
        if isinstance(words, str):
            words = json.loads(words)
        elif not isinstance(words, list):
            words = []
        
        # ✅ Index validation
        if not (0 <= word_data.word_index < len(words)):
            raise HTTPException(404, f"Word index {word_data.word_index} out of range (0-{len(words)-1})")
        
        # ✅ ძველი სიტყვის შენახვა
        old_word = words[word_data.word_index]
        
        # ✅ განახლება
        new_word = word_data.new_word.strip().lower()
        words[word_data.word_index] = new_word
        
        print(f"   Old: {old_word}")
        print(f"   New: {new_word}")
        
        # ✅ Python list → JSON string
        words_json = json.dumps(words, ensure_ascii=False)
        
        # ✅ UPDATE
        update_query = text(f"""
            UPDATE {word_data.table_name}
            SET words = CAST(:words_json AS jsonb)
            WHERE position = :position
        """)
        
        db.execute(update_query, {
            "words_json": words_json,
            "position": word_data.position
        })
        
        db.commit()
        
        print(f"   ✅ Updated successfully!")
        
        return WordUpdateResponse(
            success=True,
            message=f'სიტყვა "{old_word}" შეიცვალა "{new_word}"-ით',
            old_word=old_word,
            new_word=new_word,
            position=position,
            letter=letter,
            word_index=word_data.word_index,
            words_count=len(words),
            edited_at=word_data.edited_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
        db.rollback()
        raise HTTPException(500, f"Error: {str(e)}")


@router.delete("/word/delete", response_model=WordDeleteResponse)
async def delete_word_from_tour(
    word_data: WordDeleteRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_moderator_user)
):
    """
    სიტყვის წაშლა კონკრეტული ტურიდან
    
    შლის სიტყვას `gogebashvili_1.words` JSONB array-დან
    """
    print(f"🗑️ Delete word request from: {current_user['username']}")
    print(f"   Position: {word_data.position}, Index: {word_data.word_index}")
    
    try:
        # ✅ Table validation
        if word_data.table_name not in allowed_tables:
            raise HTTPException(400, "Invalid table name")
        
        # ✅ მონაცემების მიღება
        result = db.execute(
            text(f"SELECT position, letter, words FROM {word_data.table_name} WHERE position = :pos"),
            {"pos": word_data.position}
        ).fetchone()
        
        if not result:
            raise HTTPException(404, f"Position {word_data.position} not found")
        
        position, letter, words = result
        
        print(f"   Tour: {letter} (pos {position})")
        
        # ✅ JSONB → Python list
        if isinstance(words, str):
            words = json.loads(words)
        elif not isinstance(words, list):
            words = []
        
        # ✅ Index validation
        if not (0 <= word_data.word_index < len(words)):
            raise HTTPException(404, f"Word index {word_data.word_index} out of range (0-{len(words)-1})")
        
        # ✅ წაშლილი სიტყვის შენახვა
        deleted_word = words[word_data.word_index]
        
        # ✅ წაშლა
        words.pop(word_data.word_index)
        
        print(f"   Deleted: {deleted_word}")
        print(f"   Remaining: {len(words)} words")
        
        # ✅ Python list → JSON string
        words_json = json.dumps(words, ensure_ascii=False)
        
        # ✅ UPDATE
        update_query = text(f"""
            UPDATE {word_data.table_name}
            SET words = CAST(:words_json AS jsonb)
            WHERE position = :position
        """)
        
        db.execute(update_query, {
            "words_json": words_json,
            "position": word_data.position
        })
        
        db.commit()
        
        print(f"   ✅ Deleted successfully!")
        
        return WordDeleteResponse(
            success=True,
            message=f'სიტყვა "{deleted_word}" წაიშალა {letter} ტურიდან',
            deleted_word=deleted_word,
            position=position,
            letter=letter,
            word_index=word_data.word_index,
            words_count=len(words),
            deleted_at=word_data.deleted_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
        db.rollback()
        raise HTTPException(500, f"Error: {str(e)}")


@router.patch("/sentence/{sentence_id}", response_model=SentenceUpdateResponse)
async def update_sentence_in_table(
    sentence_id: str,
    sentence_update: SentenceUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_moderator_user)
):
    """
    წინადადების განახლება gogebashvili_1 ცხრილში
    """
    print(f"📝 Update from: {current_user['username']}, ID: {sentence_id}")
    
    try:
        # ✅ 1. Parse sentence_id
        if sentence_id.startswith("sentence-"):
            sentence_index = int(sentence_id.split("-")[1])
        else:
            sentence_index = int(sentence_id)
        
        # ✅ 2. Table validation
        if sentence_update.info.table_name not in allowed_tables:
            raise HTTPException(400, "Invalid table")
        
        # ✅ 3. მონაცემების მიღება
        result = db.execute(
            text(f"SELECT position, letter, sentences FROM {sentence_update.info.table_name} WHERE position = :pos"),
            {"pos": sentence_update.info.position}
        ).fetchone()
        
        if not result:
            raise HTTPException(404, "Position not found")
        
        position, letter, sentences = result
        
        print(f"   Position: {position}, Letter: {letter}")
        
        # ✅ 4. JSONB → Python list
        if isinstance(sentences, str):
            sentences = json.loads(sentences)
        elif not isinstance(sentences, list):
            sentences = []
        
        # ✅ 5. Index validation
        if not (0 <= sentence_index < len(sentences)):
            raise HTTPException(404, "Index out of range")
        
        # ✅ 6. Update
        old_content = sentences[sentence_index]
        sentences[sentence_index] = sentence_update.content
        
        print(f"   Old: {old_content}")
        print(f"   New: {sentence_update.content}")
        
        # ✅ 7. Python list → JSON string
        sentences_json = json.dumps(sentences, ensure_ascii=False)
        
        # ✅ 8. UPDATE with CAST() function
        update_query = text(f"""
            UPDATE {sentence_update.info.table_name}
            SET sentences = CAST(:sentences_json AS jsonb)
            WHERE position = :position
        """)
        
        db.execute(update_query, {
            "sentences_json": sentences_json,
            "position": sentence_update.info.position
        })
        
        db.commit()
        
        print(f"   ✅ Updated successfully!")
        
        return SentenceUpdateResponse(
            success=True,
            message="წინადადება წარმატებით განახლდა",
            sentence_id=sentence_index,
            updated_content=sentence_update.content,
            position=position,
            letter=letter
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
        db.rollback()
        raise HTTPException(500, f"Error: {str(e)}")


@router.get("/dedaena/{table_name}")
async def get_dedaena_data(
    table_name: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_moderator_user)
):
    """დედაენას მონაცემების მიღება"""
    
    if table_name not in allowed_tables:
        raise HTTPException(400, "Invalid table")
    
    result = db.execute(
        text(f"SELECT id, position, letter, words, sentences, proverbs, reading FROM {table_name} ORDER BY position")
    ).fetchall()
    print(f"   Retrieved {len(result)} records from {table_name}")
    data = []
    for r in result:
        print(f"   Position: {r.position}, Letter: {r.letter}, reading: {r.reading}")
        words = r.words if isinstance(r.words, list) else (json.loads(r.words) if r.words else [])
        sentences = r.sentences if isinstance(r.sentences, list) else (json.loads(r.sentences) if r.sentences else [])
        proverbs = r.proverbs if isinstance(r.proverbs, list) else (json.loads(r.proverbs) if r.proverbs else [])
        # reading = r.reading if isinstance(r.reading, list) else (json.loads(r.reading) if r.reading else [])
        # if r.reading:
        #     # Check if it's already a list (shouldn't be)
        #     if isinstance(r.reading, list):
        #         reading = r.reading
        #     # Check if it's a string that looks like JSON
        #     elif isinstance(r.reading, str):
        #         # Try to parse as JSON
        #         try:
        #             reading = json.loads(r.reading)
        #         except (json.JSONDecodeError, ValueError):
        #             # It's plain text, return as single string
        #             reading = r.reading
        #     else:
        #         reading = r.reading
        data.append({
            "id": r.id,
            "position": r.position,
            "letter": r.letter,
            "words": words,
            "sentences": sentences,
            "proverbs": proverbs,
            # "reading": reading
        })
    
    return {
        "success": True,
        "table_name": table_name,
        "count": len(data),
        "data": data
    }


# ============================================
# PROVERB MODELS
# ============================================

class ProverbAddRequest(BaseModel):
    position: int
    proverb: str
    table_name: str
    added_by: str
    added_at: str

class ProverbUpdateRequest(BaseModel):
    position: int
    proverb_index: int
    new_proverb: str
    table_name: str
    edited_by: str
    edited_at: str

class ProverbDeleteRequest(BaseModel):
    position: int
    proverb_index: int
    table_name: str
    deleted_by: str
    deleted_at: str


# ============================================
# PROVERB ENDPOINTS - FIXED
# ============================================

@router.post("/proverb/add")
async def add_proverb(
    request: ProverbAddRequest,
    current_user: dict = Depends(get_current_moderator_user)
):
    """✅ ახალი ანდაზის დამატება"""
    conn = None
    cursor = None
    
    try:
        if request.table_name not in allowed_tables:
            raise HTTPException(400, f"Invalid table name: {request.table_name}")
        
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        cursor.execute(
            f"SELECT proverbs FROM {request.table_name} WHERE position = %s;",
            (request.position,)
        )
        result = cursor.fetchone()
        
        if not result:
            raise HTTPException(404, f"Tour with position {request.position} not found")
        
        current_proverbs = result['proverbs'] or []
        
        if request.proverb.strip() in current_proverbs:
            raise HTTPException(400, "This proverb already exists in this tour")
        
        updated_proverbs = current_proverbs + [request.proverb.strip()]
        
        # ✅ Convert to JSON string
        proverbs_json = json.dumps(updated_proverbs, ensure_ascii=False)
        
        # ✅ CAST to JSONB
        cursor.execute(
            f"""UPDATE {request.table_name} 
                SET proverbs = CAST(%s AS jsonb) 
                WHERE position = %s 
                RETURNING id, position, letter, proverbs;""",
            (proverbs_json, request.position)
        )
        updated_tour = cursor.fetchone()
        
        conn.commit()
        
        print(f"✅ Proverb added by {request.added_by} to position {request.position}")
        
        return {
            "message": "Proverb added successfully",
            "tour": {
                "id": updated_tour['id'],
                "position": updated_tour['position'],
                "letter": updated_tour['letter'],
                "proverbs_count": len(updated_tour['proverbs'])
            },
            "added_proverb": request.proverb.strip(),
            "added_by": request.added_by,
            "added_at": request.added_at
        }
    
    except HTTPException:
        raise
    except psycopg2.Error as e:
        if conn:
            conn.rollback()
        print(f"❌ Database error: {e}")
        raise HTTPException(500, f"Database error: {str(e)}")
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"❌ Error: {e}")
        raise HTTPException(500, str(e))
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@router.patch("/proverb/update")
async def update_proverb(
    request: ProverbUpdateRequest,
    current_user: dict = Depends(get_current_moderator_user)
):
    """✅ ანდაზის განახლება"""
    conn = None
    cursor = None
    
    try:
        if request.table_name not in allowed_tables:
            raise HTTPException(400, f"Invalid table name: {request.table_name}")
        
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        cursor.execute(
            f"SELECT proverbs FROM {request.table_name} WHERE position = %s;",
            (request.position,)
        )
        result = cursor.fetchone()
        
        if not result:
            raise HTTPException(404, f"Tour with position {request.position} not found")
        
        current_proverbs = result['proverbs'] or []
        
        if request.proverb_index < 0 or request.proverb_index >= len(current_proverbs):
            raise HTTPException(400, f"Invalid proverb index: {request.proverb_index}")
        
        old_proverb = current_proverbs[request.proverb_index]
        current_proverbs[request.proverb_index] = request.new_proverb.strip()
        
        # ✅ Convert to JSON string
        proverbs_json = json.dumps(current_proverbs, ensure_ascii=False)
        
        # ✅ CAST to JSONB
        cursor.execute(
            f"""UPDATE {request.table_name} 
                SET proverbs = CAST(%s AS jsonb) 
                WHERE position = %s 
                RETURNING id, position, letter;""",
            (proverbs_json, request.position)
        )
        updated_tour = cursor.fetchone()
        
        conn.commit()
        
        print(f"✅ Proverb updated by {request.edited_by} at position {request.position}")
        
        return {
            "message": "Proverb updated successfully",
            "tour": {
                "id": updated_tour['id'],
                "position": updated_tour['position'],
                "letter": updated_tour['letter']
            },
            "old_proverb": old_proverb,
            "new_proverb": request.new_proverb.strip(),
            "edited_by": request.edited_by,
            "edited_at": request.edited_at
        }
    
    except HTTPException:
        raise
    except psycopg2.Error as e:
        if conn:
            conn.rollback()
        print(f"❌ Database error: {e}")
        raise HTTPException(500, f"Database error: {str(e)}")
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"❌ Error: {e}")
        raise HTTPException(500, str(e))
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@router.delete("/proverb/delete")
async def delete_proverb(
    request: ProverbDeleteRequest,
    current_user: dict = Depends(get_current_moderator_user)
):
    """✅ ანდაზის წაშლა"""
    conn = None
    cursor = None
    
    try:
        if request.table_name not in allowed_tables:
            raise HTTPException(400, f"Invalid table name: {request.table_name}")
        
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        cursor.execute(
            f"SELECT proverbs FROM {request.table_name} WHERE position = %s;",
            (request.position,)
        )
        result = cursor.fetchone()
        
        if not result:
            raise HTTPException(404, f"Tour with position {request.position} not found")
        
        current_proverbs = result['proverbs'] or []
        
        if request.proverb_index < 0 or request.proverb_index >= len(current_proverbs):
            raise HTTPException(400, f"Invalid proverb index: {request.proverb_index}")
        
        deleted_proverb = current_proverbs.pop(request.proverb_index)
        
        # ✅ Convert to JSON string
        proverbs_json = json.dumps(current_proverbs, ensure_ascii=False)
        
        # ✅ CAST to JSONB
        cursor.execute(
            f"""UPDATE {request.table_name} 
                SET proverbs = CAST(%s AS jsonb) 
                WHERE position = %s 
                RETURNING id, position, letter;""",
            (proverbs_json, request.position)
        )
        updated_tour = cursor.fetchone()
        
        conn.commit()
        
        print(f"✅ Proverb deleted by {request.deleted_by} from position {request.position}")
        
        return {
            "message": "Proverb deleted successfully",
            "tour": {
                "id": updated_tour['id'],
                "position": updated_tour['position'],
                "letter": updated_tour['letter'],
                "remaining_proverbs": len(current_proverbs)
            },
            "deleted_proverb": deleted_proverb,
            "deleted_by": request.deleted_by,
            "deleted_at": request.deleted_at
        }
    
    except HTTPException:
        raise
    except psycopg2.Error as e:
        if conn:
            conn.rollback()
        print(f"❌ Database error: {e}")
        raise HTTPException(500, f"Database error: {str(e)}")
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"❌ Error: {e}")
        raise HTTPException(500, str(e))
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


# ============================================
# GET PROVERBS BY POSITION (Optional - for debugging)
# ============================================

@router.get("/proverbs/{table_name}/{position}")
async def get_proverbs_by_position(
    table_name: str,
    position: int,
    current_user: dict = Depends(get_current_moderator_user)
):
    """
    ✅ კონკრეტული ტურის ანდაზების მიღება
    """
    conn = None
    cursor = None
    
    try:
        # ✅ Validate table name
        allowed_tables = ["gogebashvili_1", "gogebashvili_1_test"]
        if table_name not in allowed_tables:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid table name: {table_name}"
            )
        
        # ✅ Connect to database
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # ✅ Get proverbs
        query = f"""
        SELECT 
            id,
            position,
            letter,
            proverbs
        FROM {table_name}
        WHERE position = %s;
        """
        cursor.execute(query, (position,))
        result = cursor.fetchone()
        
        if not result:
            raise HTTPException(
                status_code=404,
                detail=f"Tour with position {position} not found"
            )
        
        return {
            "tour": {
                "id": result['id'],
                "position": result['position'],
                "letter": result['letter']
            },
            "proverbs": result['proverbs'] or [],
            "count": len(result['proverbs'] or [])
        }
    
    except psycopg2.Error as e:
        print(f"❌ Database error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Database error: {str(e)}"
        )
    
    except Exception as e:
        print(f"❌ Error: {e}")
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
    
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


# ============================================
# READING MODELS
# ============================================

class ReadingAddRequest(BaseModel):
    position: int
    reading_text: str
    table_name: str
    added_by: str
    added_at: str

class ReadingUpdateRequest(BaseModel):
    position: int
    reading_index: int
    new_reading: str
    table_name: str
    edited_by: str
    edited_at: str

class ReadingDeleteRequest(BaseModel):
    position: int
    reading_index: int
    table_name: str
    deleted_by: str
    deleted_at: str


# ============================================
# READING ENDPOINTS
# ============================================

@router.post("/reading/add")
async def add_reading(
    request: ReadingAddRequest,
    current_user: dict = Depends(get_current_moderator_user)
):
    """✅ ახალი reading პარაგრაფის დამატება"""
    conn = None
    cursor = None
    
    try:
        if request.table_name not in allowed_tables:
            raise HTTPException(400, f"Invalid table name: {request.table_name}")
        
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Get current reading array
        cursor.execute(
            f"SELECT reading FROM {request.table_name} WHERE position = %s;",
            (request.position,)
        )
        result = cursor.fetchone()
        
        if not result:
            raise HTTPException(404, f"Tour with position {request.position} not found")
        
        current_reading = result['reading'] or []
        updated_reading = current_reading + [request.reading_text.strip()]
        
        reading_json = json.dumps(updated_reading, ensure_ascii=False)
        
        # Update with JSONB cast
        cursor.execute(
            f"""UPDATE {request.table_name} 
                SET reading = CAST(%s AS jsonb) 
                WHERE position = %s 
                RETURNING id, position, letter;""",
            (reading_json, request.position)
        )
        updated_tour = cursor.fetchone()
        
        conn.commit()
        
        print(f"✅ Reading added by {request.added_by} to position {request.position}")
        
        return {
            "success": True,
            "message": "Reading added successfully",
            "tour": {
                "id": updated_tour['id'],
                "position": updated_tour['position'],
                "letter": updated_tour['letter']
            },
            "added_reading": request.reading_text.strip(),
            "added_by": request.added_by,
            "added_at": request.added_at
        }
    
    except HTTPException:
        raise
    except psycopg2.Error as e:
        if conn:
            conn.rollback()
        print(f"❌ Database error: {e}")
        raise HTTPException(500, f"Database error: {str(e)}")
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"❌ Error: {e}")
        raise HTTPException(500, str(e))
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@router.patch("/reading/update")
async def update_reading(
    request: ReadingUpdateRequest,
    current_user: dict = Depends(get_current_moderator_user)
):
    """✅ reading პარაგრაფის განახლება"""
    conn = None
    cursor = None
    
    try:
        if request.table_name not in allowed_tables:
            raise HTTPException(400, f"Invalid table name: {request.table_name}")
        
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Get current reading array
        cursor.execute(
            f"SELECT reading FROM {request.table_name} WHERE position = %s;",
            (request.position,)
        )
        result = cursor.fetchone()
        
        if not result:
            raise HTTPException(404, f"Tour with position {request.position} not found")
        
        current_reading = result['reading'] or []
        
        # Validate index
        if request.reading_index < 0 or request.reading_index >= len(current_reading):
            raise HTTPException(400, f"Invalid reading index: {request.reading_index}")
        
        old_reading = current_reading[request.reading_index]
        current_reading[request.reading_index] = request.new_reading.strip()
        
        reading_json = json.dumps(current_reading, ensure_ascii=False)
        
        # Update with JSONB cast
        cursor.execute(
            f"""UPDATE {request.table_name} 
                SET reading = CAST(%s AS jsonb) 
                WHERE position = %s 
                RETURNING id, position, letter;""",
            (reading_json, request.position)
        )
        updated_tour = cursor.fetchone()
        
        conn.commit()
        
        print(f"✅ Reading updated by {request.edited_by} at position {request.position}")
        
        return {
            "success": True,
            "message": "Reading updated successfully",
            "tour": {
                "id": updated_tour['id'],
                "position": updated_tour['position'],
                "letter": updated_tour['letter']
            },
            "old_reading": old_reading,
            "new_reading": request.new_reading.strip(),
            "edited_by": request.edited_by,
            "edited_at": request.edited_at
        }
    
    except HTTPException:
        raise
    except psycopg2.Error as e:
        if conn:
            conn.rollback()
        print(f"❌ Database error: {e}")
        raise HTTPException(500, f"Database error: {str(e)}")
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"❌ Error: {e}")
        raise HTTPException(500, str(e))
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@router.delete("/reading/delete")
async def delete_reading(
    request: ReadingDeleteRequest,
    current_user: dict = Depends(get_current_moderator_user)
):
    """✅ reading პარაგრაფის წაშლა"""
    conn = None
    cursor = None
    
    try:
        if request.table_name not in allowed_tables:
            raise HTTPException(400, f"Invalid table name: {request.table_name}")
        
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Get current reading array
        cursor.execute(
            f"SELECT reading FROM {request.table_name} WHERE position = %s;",
            (request.position,)
        )
        result = cursor.fetchone()
        
        if not result:
            raise HTTPException(404, f"Tour with position {request.position} not found")
        
        current_reading = result['reading'] or []
        
        # Validate index
        if request.reading_index < 0 or request.reading_index >= len(current_reading):
            raise HTTPException(400, f"Invalid reading index: {request.reading_index}")
        
        deleted_reading = current_reading.pop(request.reading_index)
        
        reading_json = json.dumps(current_reading, ensure_ascii=False)
        
        # Update with JSONB cast
        cursor.execute(
            f"""UPDATE {request.table_name} 
                SET reading = CAST(%s AS jsonb) 
                WHERE position = %s 
                RETURNING id, position, letter;""",
            (reading_json, request.position)
        )
        updated_tour = cursor.fetchone()
        
        conn.commit()
        
        print(f"✅ Reading deleted by {request.deleted_by} from position {request.position}")
        
        return {
            "success": True,
            "message": "Reading deleted successfully",
            "tour": {
                "id": updated_tour['id'],
                "position": updated_tour['position'],
                "letter": updated_tour['letter'],
                "remaining_readings": len(current_reading)
            },
            "deleted_reading": deleted_reading,
            "deleted_by": request.deleted_by,
            "deleted_at": request.deleted_at
        }
    
    except HTTPException:
        raise
    except psycopg2.Error as e:
        if conn:
            conn.rollback()
        print(f"❌ Database error: {e}")
        raise HTTPException(500, f"Database error: {str(e)}")
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"❌ Error: {e}")
        raise HTTPException(500, str(e))
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@router.get("/reading/{table_name}/{position}")
async def get_reading_by_position(
    table_name: str,
    position: int,
    current_user: dict = Depends(get_current_moderator_user)
):
    """✅ კონკრეტული ტურის reading-ის მიღება"""
    conn = None
    cursor = None
    
    try:
        if table_name not in allowed_tables:
            raise HTTPException(400, f"Invalid table name: {table_name}")
        
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        cursor.execute(
            f"SELECT id, position, letter, reading FROM {table_name} WHERE position = %s;",
            (position,)
        )
        result = cursor.fetchone()
        
        if not result:
            raise HTTPException(404, f"Tour with position {position} not found")
        
        return {
            "success": True,
            "tour": {
                "id": result['id'],
                "position": result['position'],
                "letter": result['letter']
            },
            "reading": result['reading'] or [],
            "count": len(result['reading'] or [])
        }
    
    except HTTPException:
        raise
    except psycopg2.Error as e:
        print(f"❌ Database error: {e}")
        raise HTTPException(500, f"Database error: {str(e)}")
    except Exception as e:
        print(f"❌ Error: {e}")
        raise HTTPException(500, str(e))
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@router.post("/tour/add-word", status_code=status.HTTP_200_OK)
def add_word_to_tour(
    request: AddWordToTourRequest, 
    db: Session = Depends(get_db)
):
    """
    ამატებს სიტყვას კონკრეტული ტურის 'words' მასივში.
    ეს არ ამატებს სიტყვას ზოგად ლექსიკონში, არამედ მხოლოდ
    განაახლებს ტურის JSONB ველს.
    """
    
    # ✅ უსაფრთხოებისთვის, ვამოწმებთ, რომ table_name ვალიდურია
    if not request.table_name.isidentifier():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid table name format."
        )

    try:
        # 1. მოვძებნოთ შესაბამისი ტური (row)
        # ვიყენებთ text()-ს, რომ პარამეტრი უსაფრთხოდ ჩაჯდეს
        query = text(f"""
            SELECT words FROM {request.table_name} WHERE position = :position
        """)
        
        result = db.execute(query, {"position": request.position}).fetchone()

        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Tour with position {request.position} not found."
            )

        # 2. ავიღოთ არსებული words მასივი (თუ ცარიელია, შევქმნათ)
        current_words = result[0] if result[0] is not None else []
        
        new_word = request.word_data.normalized_word

        # 3. შევამოწმოთ, სიტყვა უკვე ხომ არ არის მასივში
        if new_word in current_words:
            # შეგვიძლია დავაბრუნოთ 200 OK, რადგან სასურველი მდგომარეობა უკვე მიღწეულია
            return {"message": f"Word '{new_word}' already exists in tour."}

        # 4. დავამატოთ ახალი სიტყვა და განვაახლოთ ჩანაწერი
        updated_words = current_words + [new_word]
        
        # ✅ FIX: Convert Python list to JSON string before updating the database
        words_json = json.dumps(updated_words, ensure_ascii=False)
        
        update_query = text(f"""
            UPDATE {request.table_name}
            SET words = CAST(:words_json AS jsonb)
            WHERE position = :position
        """)
        
        db.execute(update_query, {
            "words_json": words_json, # ✅ Pass the JSON string, not the Python list
            "position": request.position
        })
        
        db.commit()

        return {"message": "Word successfully added to the tour."}

    except HTTPException as e:
        db.rollback()
        raise e # ხელახლა ვაბრუნებთ HTTP შეცდომას
    except Exception as e:
        db.rollback()
        print(f"An unexpected error occurred: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An internal server error occurred while adding the word."
        )