"""
Moderator API Endpoints - წინადადებების მოდერაცია
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db
from app.schemas.sentence import SentenceUpdate, SentenceUpdateResponse
from app.api.dependencies import get_current_moderator_user
import json
from pydantic import BaseModel, Field
from typing import Optional

router = APIRouter()


# ===== SCHEMAS =====

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
        if word_data.table_name not in ["gogebashvili_1"]:
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
        if word_data.table_name not in ["gogebashvili_1"]:
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
        if word_data.table_name not in ["gogebashvili_1"]:
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
        if sentence_update.info.table_name not in ["gogebashvili_1"]:
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
    
    if table_name not in ["gogebashvili_1"]:
        raise HTTPException(400, "Invalid table")
    
    result = db.execute(
        text(f"SELECT id, position, letter, words, sentences FROM {table_name} ORDER BY position")
    ).fetchall()
    
    data = []
    for r in result:
        words = r.words if isinstance(r.words, list) else (json.loads(r.words) if r.words else [])
        sentences = r.sentences if isinstance(r.sentences, list) else (json.loads(r.sentences) if r.sentences else [])
        
        data.append({
            "id": r.id,
            "position": r.position,
            "letter": r.letter,
            "words": words,
            "sentences": sentences
        })
    
    return {
        "success": True,
        "table_name": table_name,
        "count": len(data),
        "data": data
    }