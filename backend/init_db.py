import psycopg2  # PostgreSQL-თან დასაკავშირებლად საჭირო ბიბლიოთეკა

LETTERS = [
    # ასოების და მათი სახელების წყვილების სია
    ("ა", "ან"), ("ბ", "ბან"), ("გ", "გან"), ("დ", "დონ"), ("ე", "ენ"),
    ("ვ", "ვინ"), ("ზ", "ზენ"), ("თ", "თან"), ("ი", "ინ"), ("კ", "კან"),
    ("ლ", "ლას"), ("მ", "მან"), ("ნ", "ნარ"), ("ო", "ონ"), ("პ", "პან"),
    ("ჟ", "ჟან"), ("რ", "რა"), ("ს", "სან"), ("ტ", "ტარ"), ("უ", "უნ"),
    ("ფ", "ფარ"), ("ქ", "ქარ"), ("ღ", "ღამ"), ("ყ", "ყარ"), ("შ", "შინ"),
    ("ჩ", "ჩინ"), ("ც", "ცან"), ("ძ", "ძილ"), ("წ", "წილ"), ("ჭ", "ჭილ"),
    ("ხ", "ხან"), ("ჯ", "ჯან"), ("ჰ", "ჰან"),
    # დამატებითი სიმბოლოები დაკომენტარებულია
    # (" ", "ჰარი"), (".", "წერტილი"), (",", "მძიმე"), ("!", "ძახილის ნიშანი"), ("?", "კითხვის ნიშანი"),
]

conn = psycopg2.connect(
    host="localhost",         # ბაზის ჰოსტი (ლოკალურად)
    dbname="alphabet_db",     # ბაზის სახელი
    user="postgres",          # მომხმარებლის სახელი
    password="postgres"       # პაროლი
)
cur = conn.cursor()  # კურსორის შექმნა SQL ბრძანებების შესასრულებლად

cur.execute("""
CREATE TABLE IF NOT EXISTS alphabet (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(2) NOT NULL,
    name VARCHAR(32) NOT NULL
);
""")  # ცხრილის შექმნა თუ არ არსებობს
conn.commit()  # ცვლილებების შენახვა

cur.execute("DELETE FROM alphabet;")  # ცხრილის გასუფთავება (ყველა ჩანაწერის წაშლა)

for symbol, name in LETTERS:
    cur.execute("INSERT INTO alphabet (symbol, name) VALUES (%s, %s);", (symbol, name))
    # თითოეული ასოს და სახელის ცხრილში ჩასმა

conn.commit()  # ყველა ჩანაწერის საბოლოო შენახვა
###########################




gogebashvili_order = [
    "ი", "ა", "თ", "ს", "ხ", "ო", "ე", "უ", "ძ", "მ", "შ", "კ", "ვ", "ფ", "ნ", "ზ", "რ", "ჩ", "დ", "ღ", "ლ", "ქ", "გ", "ბ", "პ", "ყ", "ც", "ტ", "წ", "ჭ", "ჯ", "ჟ", "ჰ"
]

cur.execute("""
CREATE TABLE IF NOT EXISTS gogebashvili (
    id SERIAL PRIMARY KEY,
    alphabet_id INTEGER NOT NULL REFERENCES alphabet(id),
    position INTEGER NOT NULL
);
""")
conn.commit()

for pos, symbol in enumerate(gogebashvili_order, start=1):
    cur.execute("SELECT id FROM alphabet WHERE symbol = %s;", (symbol,))
    row = cur.fetchone()
    if row:
        alphabet_id = row[0]
        cur.execute(
            "INSERT INTO gogebashvili (alphabet_id, position) VALUES (%s, %s);",
            (alphabet_id, pos)
        )
conn.commit()

cur.close()    # კურსორის დახურვა
conn.close()   # ბაზასთან კავშირის დახურვა
