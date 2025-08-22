import psycopg2

LETTERS = [
    (" ", "ჰარი"),
    ("ა", "ან"), ("ბ", "ბან"), ("გ", "გან"), ("დ", "დონ"), ("ე", "ენ"),
    ("ვ", "ვინ"), ("ზ", "ზენ"), ("თ", "თან"), ("ი", "ინ"), ("კ", "კან"),
    ("ლ", "ლას"), ("მ", "მან"), ("ნ", "ნარ"), ("ო", "ონ"), ("პ", "პან"),
    ("ჟ", "ჟან"), ("რ", "რა"), ("ს", "სან"), ("ტ", "ტარ"), ("უ", "უნ"),
    ("ფ", "ფარ"), ("ქ", "ქარ"), ("ღ", "ღამ"), ("ყ", "ყარ"), ("შ", "შინ"),
    ("ჩ", "ჩინ"), ("ც", "ცან"), ("ძ", "ძილ"), ("წ", "წილ"), ("ჭ", "ჭილ"),
    ("ხ", "ხან"), ("ჯ", "ჯან"), ("ჰ", "ჰან")
]

conn = psycopg2.connect(
    host="localhost",
    dbname="alphabet_db",
    user="postgres",
    password="postgres"
)
cur = conn.cursor()
cur.execute("""
CREATE TABLE IF NOT EXISTS letters (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(2) NOT NULL,
    name VARCHAR(32) NOT NULL
);
""")
conn.commit()
cur.execute("DELETE FROM letters;")
for symbol, name in LETTERS:
    cur.execute("INSERT INTO letters (symbol, name) VALUES (%s, %s);", (symbol, name))
conn.commit()
cur.close()
conn.close()
