"""
Dedaena Routes
"""
from sqlalchemy import text, bindparam
from sqlalchemy.orm import Session
from fastapi import Depends
from app.api.dependencies import get_db, get_current_moderator_user
import json
from typing import List
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.config import get_db_connection

router = APIRouter()


class StaticInfo(BaseModel):
    position: int
    letter: str
    words_ids: list[int]
    sentences_ids: list[int]
    proverbs_ids: list[int]
    toreads_ids: list[int]


@router.get("/")
async def dedaena_root():
    return {"message": "Dedaena API", "version": "1.0.0"}


@router.get("/{table_name}")
async def get_dedaena_data(
    table_name: str,
    db: Session = Depends(get_db),
    # current_user: dict = Depends(get_current_moderator_user)
):
    # ...existing code...
    print(f"Fetching data for table: {table_name}")
    try:
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
        
        dedaenaData = []
        for r in result:
            def fetch_items(table, column, ids):
                if not ids:
                    return []
                if isinstance(ids, str):
                    ids = [int(i) for i in ids.split(',') if i.strip().isdigit()]
                if not isinstance(ids, list):
                    ids = list(ids)
                if not ids:
                    return []
                # ✅ გამოიყენეთ tuple(ids) და IN :ids
                items = db.execute(
                    text(f"SELECT * FROM {table} WHERE id IN :ids AND is_playable = true").bindparams(bindparam("ids", expanding=True)),
                    {"ids": tuple(ids)}
                ).fetchall()
                return [dict(item._mapping) for item in items]

            words = fetch_items("words", "word", r.words_ids)
            sentences = fetch_items("sentences", "sentence", r.sentences_ids)
            proverbs = fetch_items("proverbs", "proverb", r.proverbs_ids)
            toreads = fetch_items("toreads", "toread", r.toreads_ids)

            dedaenaData.append({
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
            "count": len(dedaenaData),
            "data": dedaenaData
        }
    except Exception as e:
        # ...error handling...
        raise
@router.get("/{table_name}/position/{position}")
def get_position_data(table_name: str, position: int):
    """Get position data"""
    
    # allowed_tables = ["gogebashvili_1", "gogebashvili_test1"]
    # if table_name not in allowed_tables:
    #     raise HTTPException(status_code=400, detail="Invalid table")
    


    print(f"table_name: {table_name}, position: {position}")
    
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(f"SELECT letter, word_count, sentence_count, has_proverbs, has_reading FROM {table_name} WHERE position <= %s ORDER BY position ASC;", (position,))
            letters = [row[0] for row in cur.fetchall()]  # ასოების სიის შექმნა
            
            cur.execute(f"SELECT * FROM {table_name} WHERE position = %s;", (position,))
            current_position_data = cur.fetchone()
            print(f"row: {current_position_data}")

            if not current_position_data:
                raise HTTPException(status_code=404, detail="Not found")
            
            position_info = {
                "id": current_position_data[0],                                    # უნიკალური ID
                "position": current_position_data[1],                              # პოზიცია ანბანში
                "letter": current_position_data[2],                                # ასო
                "words": safe_json_parse(current_position_data[3]),                # სიტყვების სია (JSON -> list)
                "sentences": safe_json_parse(current_position_data[4]),            # წინადადებების სია (JSON -> list)
                "proverbs": safe_json_parse(current_position_data[5]),             # ანდაზების სია (JSON -> list)
                "reading": current_position_data[6] if current_position_data[6] else "",  # კითხვის ტექსტი
                "word_count": current_position_data[7] if current_position_data[7] else 0,  # სიტყვების რაოდენობა
                "sentence_count": current_position_data[8] if current_position_data[8] else 0,  # წინადადებების რაოდენობა
                "has_proverbs": current_position_data[9] if current_position_data[9] else False,  # ანდაზების არსებობა
                "has_reading": current_position_data[10] if current_position_data[10] else False  # კითხვის მასალის არსებობა
            }

            return {"position": position, "letters": letters, "table": table_name, "position_info": position_info}
    finally:
        conn.close()



def safe_json_parse(data):
    """JSON-ის უსაფრთხო დამუშავება - სხვადასხვა ტიპის მონაცემების list-ად გარდაქმნა"""
    if data is None:
        return []  # NULL მნიშვნელობისთვის ცარიელი სია
    if isinstance(data, list):
        return data  # უკვე list-ია, ისე დაბრუნება
    if isinstance(data, str):
        try:
            return json.loads(data)  # JSON string-ის parse-ება list-ად
        except json.JSONDecodeError:
            return []  # არასწორი JSON-ის შემთხვევაში ცარიელი სია
    return []  # სხვა ტიპებისთვის ცარიელი სია


