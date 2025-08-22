from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import psycopg2
import os

app = FastAPI()

# CORS setup for React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database connection
DB_HOST = os.getenv("POSTGRES_HOST", "localhost")
DB_NAME = os.getenv("POSTGRES_DB", "alphabet_db")
DB_USER = os.getenv("POSTGRES_USER", "postgres")
DB_PASS = os.getenv("POSTGRES_PASSWORD", "postgres")

conn = psycopg2.connect(
    host=DB_HOST,
    dbname=DB_NAME,
    user=DB_USER,
    password=DB_PASS
)

class Letter(BaseModel):
    symbol: str
    name: str

@app.get("/letters", response_model=List[Letter])
def get_letters():
    with conn.cursor() as cur:
        cur.execute("SELECT symbol, name FROM letters ORDER BY id ASC;")
        rows = cur.fetchall()
    return [Letter(symbol=row[0], name=row[1]) for row in rows]

@app.post("/letters")
def add_letter(letter: Letter):
    with conn.cursor() as cur:
        cur.execute("INSERT INTO letters (symbol, name) VALUES (%s, %s);", (letter.symbol, letter.name))
        conn.commit()
    return {"status": "success"}
