"""
Dedaena Routes
"""

import json
from typing import List
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.config import get_db_connection

router = APIRouter()


class StaticInfo(BaseModel):
    letter: str
    word_count: int
    sentence_count: int
    has_proverbs: bool
    has_reading: bool


@router.get("/")
async def dedaena_root():
    return {"message": "Dedaena API", "version": "1.0.0"}


@router.get("/{table_name}/general-info", response_model=List[StaticInfo])
def get_general_info(table_name: str):
    """Get all letters"""
    
    allowed_tables = ["gogebashvili_1", "gogebashvili_1_test"]
    if table_name not in allowed_tables:
        raise HTTPException(status_code=400, detail="Invalid table")
    
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(f"""
                SELECT letter, word_count, sentence_count, has_proverbs, has_reading 
                FROM {table_name} 
                ORDER BY position ASC;
            """)
            rows = cur.fetchall()
            print(f"rows: {rows}")
        
        return [
            StaticInfo(
                letter=row[0],
                word_count=row[1] or 0,
                sentence_count=row[2] or 0,
                has_proverbs=row[3] or False,
                has_reading=row[4] or False
            ) 
            for row in rows
        ]
        print("static_info returned successfully")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        conn.close()


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


