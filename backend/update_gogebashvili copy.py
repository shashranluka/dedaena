import psycopg2
import json

# ბაზასთან დაკავშირება
conn = psycopg2.connect(
    host="localhost",
    dbname="dedaena_db", 
    user="postgres",
    password="postgres"
)
cur = conn.cursor()

# კონკრეტული ჩანაწერის განახლება ID-ით
def update_arrays_by_id(table_name, record_id, words_array, sentences_array):
    cur.execute(f"""
        UPDATE {table_name} 
        SET words = %s, sentences = %s 
        WHERE id = %s;
    """, (json.dumps(words_array), json.dumps(sentences_array), record_id))
    conn.commit()

# კონკრეტული პოზიციის განახლება
def update_arrays_by_position(table_name, position, words_array, sentences_array):
    cur.execute(f"""
        UPDATE {table_name} 
        SET words = %s, sentences = %s 
        WHERE position = %s;
    """, (json.dumps(words_array, ensure_ascii=False), json.dumps(sentences_array, ensure_ascii=False), position))
    conn.commit()

# ასოს მიხედვით განახლება
def update_arrays_by_letter(table_name, letter, words_array, sentences_array):
    cur.execute(f"""
        UPDATE {table_name} 
        SET words = %s, sentences = %s 
        WHERE letter = %s;
    """, (json.dumps(words_array, ensure_ascii=False), json.dumps(sentences_array, ensure_ascii=False), letter))
    conn.commit()

# მაგალითი გამოყენება:
# პოზიცია 4 (ს) განახლება
update_arrays_by_position("gogebashvili_test1", 4, 
    ["სია", "სითა", "სასა"], 
    ["სია სითა.", "ათი სასა."])

# პოზიცია 5 (ხ) განახლება  
update_arrays_by_letter("gogebashvili_test1", "ხ", 
    ["ხია", "ხათი", "ხითი"],
    ["ხია ხათი.", "ათი ხითი."])

print("მასივები წარმატებით განახლდა")

cur.close()
conn.close()