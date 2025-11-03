from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import psycopg2
import os
import json

# FastAPI აპლიკაციის ინიციალიზაცია
app = FastAPI()

# CORS მიდლვეარის კონფიგურაცია React-ის მხარდაჭერისთვის
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # ყველა ორიჯინიდან მოთხოვნები ნებადართულია
    allow_credentials=True,       # credentials (cookies, auth headers) ნებადართულია
    allow_methods=["*"],          # ყველა HTTP მეთოდი ნებადართულია (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],          # ყველა header ნებადართულია
)

# Database კავშირის პარამეტრები გარემოს ცვლადებიდან ან default მნიშვნელობებით
DB_HOST = os.getenv("POSTGRES_HOST", "localhost")      # PostgreSQL სერვერის მისამართი
DB_NAME = os.getenv("POSTGRES_DB", "dedaena_db")       # მონაცემთა ბაზის სახელი
DB_USER = os.getenv("POSTGRES_USER", "postgres")       # მომხმარებლის სახელი
DB_PASS = os.getenv("POSTGRES_PASSWORD", "postgres")   # პაროლი

# PostgreSQL-თან კავშირის დამყარება
conn = psycopg2.connect(
    host=DB_HOST,     # სერვერის მისამართი
    dbname=DB_NAME,   # ბაზის სახელი
    user=DB_USER,     # მომხმარებელი
    password=DB_PASS  # პაროლი
)

# Pydantic მოდელი ასოს ობიექტისთვის
class StaticInfo(BaseModel):
    letter: str              # ასო (მაგ. "ა", "ბ")
    word_count: int          # სიტყვების რაოდენობა
    sentence_count: int      # წინადადებების რაოდენობა
    has_proverbs: bool       # ანდაზების არსებობა
    has_reading: bool        # კითხვის მასალის არსებობა


# GET endpoint ყველა ასოს მისაღებად
@app.get("/dedaena/{table_name}/static", response_model=List[StaticInfo])
def get_letters(table_name: str):
    print(f"GET /dedaena/{table_name} called")
    with conn.cursor() as cur:
        # table_name პარამეტრის გამოყენება (არა მუდმივად gogebashvili_1)
        cur.execute(f"SELECT letter, word_count, sentence_count, has_proverbs, has_reading FROM {table_name} ORDER BY position ASC;")
        rows = cur.fetchall()
        print(f"Fetched {len(rows)} letters from {table_name}")
    
    # StaticInfo ობიექტების სიის დაბრუნება
    return [
        StaticInfo(
            letter=row[0],
            word_count=row[1] or 0,          # NULL-ის შემთხვევაში 0
            sentence_count=row[2] or 0,      # NULL-ის შემთხვევაში 0
            has_proverbs=row[3] or False,    # NULL-ის შემთხვევაში False
            has_reading=row[4] or False      # NULL-ის შემთხვევაში False
        ) 
        for row in rows
    ]

# GET endpoint კონკრეტული ცხრილიდან კონკრეტული პოზიციის მონაცემების მისაღებად
@app.get("/dedaena/{table_name}/position/{position}")
def get_table_letters(table_name: str, position: int):
    try:
        with conn.cursor() as cur:
            # Debug ინფორმაცია - რა მონაცემებს ვითხოვთ
            
            # პირველი query: position-მდე ყველა ასოს მიღება
            cur.execute(f"SELECT letter, word_count, sentence_count, has_proverbs, has_reading FROM {table_name} WHERE position <= %s ORDER BY position ASC;", (position,))
            letters = [row[0] for row in cur.fetchall()]  # ასოების სიის შექმნა
            
            # მეორე query: კონკრეტული position-ის სრული ინფორმაცია
            cur.execute(f"SELECT * FROM {table_name} WHERE position = %s;", (position,))
            current_position_data = cur.fetchone()  # ერთი ჩანაწერის მიღება
            # print("Current position data fetched:", current_position_data,"letters:", letters)
            # Debug ინფორმაცია - მიღებული მონაცემები
            # print(f"Letters: {letters}")
            # print(f"Position {position} data:", current_position_data)
        
        # position_info ობიექტის ინიციალიზაცია
        position_info = {}
        if current_position_data:
            # print(current_position_data)
            # ბაზიდან მიღებული მონაცემების ობიექტად გარდაქმნა
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
            # Debug ინფორმაცია - გარდაქმნილი ობიექტი
            # print("Position info:", position_info)
        
        # JSON response-ის დაბრუნება
        return {
            "letters": letters,           # ასოების სია
            "position_info": position_info  # დეტალური ინფორმაცია
        }
        
    except Exception as e:
        # შეცდომის შემთხვევაში error handling
        print(f"Error: {e}")  # შეცდომის ლოგირება
        return {
            "letters": [],              # ცარიელი ასოების სია
            "position_info": {},        # ცარიელი ინფორმაცია
            "error": str(e)            # შეცდომის მესიჯი
        }

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
