import json
import psycopg2

# JSON ფაილის წაკითხვა
with open('gogebashvili.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# ბაზაში ჩაწერა
conn = psycopg2.connect(host="localhost", dbname="dedaena_db", user="postgres", password="postgres")
cur = conn.cursor()

for item in data['gogebashvili_data']:
    cur.execute("""
        UPDATE gogebashvili_test1 
        SET words = %s, sentences = %s 
        WHERE position = %s;
    """, (item['words'], item['sentences'], item['position']))

conn.commit()
cur.close()
conn.close()