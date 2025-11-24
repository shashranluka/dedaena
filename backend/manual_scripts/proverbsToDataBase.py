import psycopg2
from psycopg2.extras import execute_values
import os
from dotenv import load_dotenv

# ✅ Load environment variables
load_dotenv()

# ✅ Database configuration
DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": os.getenv("DB_PORT", "5432"),
    "database": os.getenv("DB_NAME", "dedaena_db"),
    "user": os.getenv("DB_USER", "postgres"),
    "password": os.getenv("DB_PASSWORD", "your_password")
}

def read_proverbs_from_file(file_path):
    """
    ✅ წაიკითხავს ანდაზებს ფაილიდან
    """
    proverbs = []
    
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            for line in file:
                # ✅ გამოტოვე ცარიელი ხაზები
                proverb = line.strip()
                if proverb and not proverb.startswith('#'):
                    proverbs.append(proverb)
        
        print(f"✅ წაკითხულია {len(proverbs)} ანდაზა")
        return proverbs
    
    except FileNotFoundError:
        print(f"❌ ფაილი არ მოიძებნა: {file_path}")
        return []
    except Exception as e:
        print(f"❌ შეცდომა ფაილის წაკითხვისას: {e}")
        return []


def create_proverbs_table(cursor):
    """
    ✅ შექმნის proverbs ცხრილს თუ არ არსებობს
    """
    create_table_query = """
    CREATE TABLE IF NOT EXISTS proverbs (
        id SERIAL PRIMARY KEY,
        content TEXT NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE INDEX IF NOT EXISTS idx_proverbs_content ON proverbs(content);
    """
    
    try:
        cursor.execute(create_table_query)
        print("✅ proverbs ცხრილი მზადაა")
    except Exception as e:
        print(f"❌ ცხრილის შექმნის შეცდომა: {e}")
        raise


def insert_proverbs(cursor, proverbs):
    """
    ✅ ანდაზების ჩაწერა ბაზაში
    """
    if not proverbs:
        print("⚠️ ანდაზები არ არის")
        return 0
    
    # ✅ Prepare data for batch insert
    data = [(proverb,) for proverb in proverbs]
    
    insert_query = """
    INSERT INTO proverbs (content)
    VALUES %s
    ON CONFLICT (content) DO NOTHING
    RETURNING id;
    """
    
    try:
        # ✅ Batch insert with execute_values
        result = execute_values(
            cursor, 
            insert_query, 
            data,
            template="(%s)",
            fetch=True
        )
        
        inserted_count = len(result) if result else 0
        skipped_count = len(proverbs) - inserted_count
        
        print(f"✅ ჩაიწერა: {inserted_count} ანდაზა")
        if skipped_count > 0:
            print(f"⚠️ გამოტოვებულია (დუბლიკატები): {skipped_count}")
        
        return inserted_count
    
    except Exception as e:
        print(f"❌ ჩაწერის შეცდომა: {e}")
        raise


def get_proverbs_stats(cursor):
    """
    ✅ სტატისტიკა ბაზაში არსებული ანდაზების შესახებ
    """
    try:
        cursor.execute("SELECT COUNT(*) FROM proverbs;")
        total = cursor.fetchone()[0]
        
        cursor.execute("""
            SELECT content 
            FROM proverbs 
            ORDER BY created_at DESC 
            LIMIT 5;
        """)
        recent = cursor.fetchall()
        
        print(f"\n📊 სტატისტიკა:")
        print(f"   📝 სულ ანდაზა: {total}")
        print(f"\n   🆕 ბოლო 5 ჩანაწერი:")
        for i, (proverb,) in enumerate(recent, 1):
            preview = proverb[:60] + "..." if len(proverb) > 60 else proverb
            print(f"      {i}. {preview}")
    
    except Exception as e:
        print(f"❌ სტატისტიკის მიღების შეცდომა: {e}")


def main():
    """
    ✅ მთავარი ფუნქცია
    """
    print("=" * 60)
    print("🚀 ანდაზების ბაზაში ჩაწერა")
    print("=" * 60)
    
    # ✅ File path
    script_dir = os.path.dirname(os.path.abspath(__file__))
    file_path = os.path.join(script_dir, "proverbs.txt")
    
    print(f"\n📂 ფაილი: {file_path}")
    
    # ✅ Read proverbs
    proverbs = read_proverbs_from_file(file_path)
    
    if not proverbs:
        print("❌ ანდაზები არ მოიძებნა. პროგრამა დასრულებულია.")
        return
    
    # ✅ Connect to database
    conn = None
    cursor = None
    
    try:
        print(f"\n🔌 დაკავშირება ბაზასთან: {DB_CONFIG['database']}@{DB_CONFIG['host']}")
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        print("✅ დაკავშირება წარმატებული")
        
        # ✅ Create table if not exists
        create_proverbs_table(cursor)
        
        # ✅ Insert proverbs
        print(f"\n📥 იწერება {len(proverbs)} ანდაზა...")
        inserted_count = insert_proverbs(cursor, proverbs)
        
        # ✅ Commit transaction
        conn.commit()
        print("✅ ტრანზაქცია დასრულებულია")
        
        # ✅ Show statistics
        get_proverbs_stats(cursor)
        
        print("\n" + "=" * 60)
        print("🎉 პროცესი წარმატებით დასრულდა!")
        print("=" * 60)
    
    except psycopg2.Error as e:
        print(f"\n❌ ბაზის შეცდომა: {e}")
        if conn:
            conn.rollback()
            print("🔄 ტრანზაქცია გაუქმებულია")
    
    except Exception as e:
        print(f"\n❌ შეცდომა: {e}")
        if conn:
            conn.rollback()
    
    finally:
        # ✅ Close connections
        if cursor:
            cursor.close()
        if conn:
            conn.close()
            print("\n🔌 დაკავშირება დახურულია")


if __name__ == "__main__":
    main()