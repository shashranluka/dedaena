import psycopg2
import os
import json

# ბაზის კონფიგურაცია
DB_HOST = os.getenv("POSTGRES_HOST", "localhost")
DB_NAME = os.getenv("POSTGRES_DB", "dedaena_db")  # თქვენი ბაზის სახელი
DB_USER = os.getenv("POSTGRES_USER", "postgres")
DB_PASS = os.getenv("POSTGRES_PASSWORD", "postgres")

# ასოები და მათი სახელები
LETTERS = [
    ("ა", "ან"), ("ბ", "ბან"), ("გ", "გან"), ("დ", "დონ"), ("ე", "ენ"),
    ("ვ", "ვინ"), ("ზ", "ზენ"), ("თ", "თან"), ("ი", "ინ"), ("კ", "კან"),
    ("ლ", "ლას"), ("მ", "მან"), ("ნ", "ნარ"), ("ო", "ონ"), ("პ", "პან"),
    ("ჟ", "ჟან"), ("რ", "რა"), ("ს", "სან"), ("ტ", "ტარ"), ("უ", "უნ"),
    ("ფ", "ფარ"), ("ქ", "ქარ"), ("ღ", "ღამ"), ("ყ", "ყარ"), ("შ", "შინ"),
    ("ჩ", "ჩინ"), ("ც", "ცან"), ("ძ", "ძილ"), ("წ", "წილ"), ("ჭ", "ჭილ"),
    ("ხ", "ხან"), ("ჯ", "ჯან"), ("ჰ", "ჰან"),
]

# გოგებაშვილის მეთოდის თანმიმდევრობა
# gogebashvili_order = [
#     ("ი", "სიტყვები: ისარი, ინდო\nწინადადებები: ის არის ისარი."),
#     ("ა", "სიტყვები: არა, ანა\nწინადადებები: ანა არ ისვამს."),
#     ("თ", "სიტყვები: თოვა, თითი\nწინადადებები: თოვს თოვლი."),
#     ("ს", "სიტყვები: სახლი, სისხლი\nწინადადებები: სახლში სიცხეა."),
#     ("ხ", "სიტყვები: ხარი, ხე\nწინადადებები: ხეზე ხარია."),
#     # დანარჩენი ასოები...
# ]

# try:
# ბაზასთან დაკავშირება
conn = psycopg2.connect(
    host=DB_HOST,
    dbname=DB_NAME,
    user=DB_USER,
    password=DB_PASS
)
cur = conn.cursor()

print(f"დაკავშირება {DB_NAME} ბაზასთან წარმატებით შესრულდა")

# ძირითადი ალფაბეტის ცხრილი
cur.execute("""
CREATE TABLE IF NOT EXISTS alphabet (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(2) NOT NULL UNIQUE,
    name VARCHAR(32) NOT NULL
);
""")

# გოგებაშვილის მეთოდის ცხრილი
cur.execute("""
CREATE TABLE IF NOT EXISTS gogebashvili (
    id SERIAL PRIMARY KEY,
    letter VARCHAR(2) NOT NULL,
    position INTEGER NOT NULL UNIQUE,
    words JSONB,
    sentences JSONB
);
""")

# ცხრილების შექმნის დადასტურება
conn.commit()
print("ცხრილები წარმატებით შეიქმნა")

# მონაცემების შევსება
cur.execute("DELETE FROM alphabet;")
cur.execute("DELETE FROM gogebashvili;")

# ალფაბეტის შევსება
for symbol, name in LETTERS:
    cur.execute("INSERT INTO alphabet (symbol, name) VALUES (%s, %s);", (symbol, name))

# გოგებაშვილის მეთოდის მონაცემების შევსება
gogebashvili_data = [
    ("ი", 1, [], []),
    ("ა", 2, ["ია", "აი"], ["აი ია."]),
    ("თ", 3, ["ათი", "თითი", "თითა", "თათი"], ["აი თითი.", "აი თითა.", "აი თათი.", "ათი ია.", "ათი თითი.", "ათი თითა.", "ათი თათი."]),
    ("ს", 4, [], []),
    ("ხ", 5, [], []),
    ("ო", 6, [], []),
    ("ე", 7, [], []),
    ("უ", 8, [], []),
    ("ძ", 9, [], []),
    ("მ", 10, [], []),
    ("შ", 11, [], []),
    ("კ", 12, [], []),
    ("ვ", 13, [], []),
    ("ფ", 14, [], []),
    ("ნ", 15, [], []),
    ("ზ", 16, [], []),
    ("რ", 17, [], []),
    ("ჩ", 18, [], []),
    ("დ", 19, [], []),
    ("ღ", 20, [], []),
    ("ლ", 21, [], []),
    ("ქ", 22, [], []),
    ("გ", 23, [], []),
    ("ბ", 24, [], []),
    ("პ", 25, [], []),
    ("ყ", 26, [], []),
    ("ც", 27, [], []),
    ("ტ", 28, [], []),
    ("წ", 29, [], []),
    ("ჭ", 30, [], []),
    ("ჯ", 31, [], []),
    ("ჟ", 32, [], []),
    ("ჰ", 33, [], []),
]

for data in gogebashvili_data:
    letter, position, words, sentences = data
    
    cur.execute(
        "INSERT INTO gogebashvili (letter, position, words, sentences) VALUES (%s, %s, %s, %s);",
        (letter, position, json.dumps(words, ensure_ascii=False), json.dumps(sentences, ensure_ascii=False))
    )

conn.commit()
print("მონაცემები წარმატებით შეივსო")

cur.close()
conn.close()