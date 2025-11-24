#!/usr/bin/env python3
# // filepath: /Users/luka/dev/dedaena/backend/manual_scripts/proverbsToDedaena.py

import psycopg2
from psycopg2.extras import RealDictCursor
import os
import sys
from pathlib import Path
import re

# ✅ Add parent directory to path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.append(str(backend_dir))

from dotenv import load_dotenv

# ✅ Load .env
env_path = backend_dir / '.env'
load_dotenv(dotenv_path=env_path)

# ✅ Database configuration
DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": os.getenv("DB_PORT", "5432"),
    "database": os.getenv("DB_NAME", "dedaena_db"),
    "user": os.getenv("DB_USER", "postgres"),
    "password": os.getenv("DB_PASSWORD", "your_password")
}

# ✅ Table name
TABLE_NAME = "gogebashvili_1_test"


def read_proverbs_from_file(file_path):
    """
    ✅ წაიკითხავს ანდაზებს ფაილიდან
    """
    proverbs = []
    
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            for line_num, line in enumerate(file, 1):
                proverb = line.strip()
                if proverb and not proverb.startswith('#'):
                    proverbs.append({
                        'content': proverb,
                        'line_number': line_num
                    })
        
        print(f"✅ წაკითხულია {len(proverbs)} ანდაზა")
        return proverbs
    
    except FileNotFoundError:
        print(f"❌ ფაილი არ მოიძებნა: {file_path}")
        return []
    except Exception as e:
        print(f"❌ შეცდომა ფაილის წაკითხვისას: {e}")
        return []


def get_dedaena_tours(cursor):
    """
    ✅ მიიღებს დედაენის ტურებს თანმიმდევრობით
    """
    query = f"""
    SELECT 
        id,
        position,
        letter,
        words,
        sentences,
        proverbs
    FROM {TABLE_NAME}
    ORDER BY position ASC;
    """
    
    try:
        cursor.execute(query)
        tours = cursor.fetchall()
        print(f"✅ ჩატვირთულია {len(tours)} ტური")
        return tours
    except Exception as e:
        print(f"❌ ტურების ჩატვირთვის შეცდომა: {e}")
        raise


def normalize_word(word):
    """
    ✅ ნორმალიზაცია: lowercase + პუნქტუაციის წაშლა
    """
    word = re.sub(r'[^\u10A0-\u10FF]', '', word)
    return word.lower().strip()


def get_all_known_words(tours, up_to_position):
    """
    ✅ დააბრუნებს ყველა ცნობილ სიტყვას მითითებულ პოზიციამდე
    """
    known_words = set()
    
    for tour in tours:
        if tour['position'] < up_to_position:
            for word in tour['words']:
                normalized = normalize_word(word)
                if normalized:
                    known_words.add(normalized)
    
    return known_words


def find_appropriate_tour(proverb_text, tours):
    """
    ✅ პოულობს შესაბამის ტურს ანდაზისთვის
    """
    words = proverb_text.split()
    
    for tour in tours:
        known_words = get_all_known_words(tours, tour['position'])
        
        for word in words:
            normalized = normalize_word(word)
            
            if not normalized:
                continue
            
            if normalized in known_words:
                continue
            
            first_letter = normalized[0]
            
            if tour['letter'].lower() == first_letter:
                return tour, word, normalized
    
    return tours[-1] if tours else None, None, None


def insert_proverb_to_tour(conn, cursor, tour, proverb_text):
    """
    ✅ ჩაწერს ანდაზას შესაბამის ტურში PROVERBS სვეტში
    """
    try:
        # ✅ მიიღე არსებული ანდაზები
        current_proverbs = tour.get('proverbs', []) or []
        
        # ✅ დაამატე ახალი ანდაზა
        updated_proverbs = current_proverbs + [proverb_text]
        
        # ✅ UPDATE query - proverbs სვეტში
        update_query = f"""
        UPDATE {TABLE_NAME}
        SET proverbs = %s
        WHERE id = %s
        RETURNING id, position, letter;
        """
        
        cursor.execute(update_query, (updated_proverbs, tour['id']))
        result = cursor.fetchone()
        
        # ✅ Commit immediately
        conn.commit()
        
        return result
        
    except Exception as e:
        conn.rollback()
        print(f"❌ ანდაზის ჩაწერის შეცდომა: {e}")
        raise


def process_proverbs(conn, cursor, proverbs):
    """
    ✅ ყველა ანდაზის დამუშავება
    """
    tours = get_dedaena_tours(cursor)
    
    if not tours:
        print("❌ ტურები არ მოიძებნა!")
        return {'inserted': 0, 'failed': 0, 'details': []}
    
    print(f"\n📊 დედაენის სტრუქტურა:")
    print(f"   პირველი ტური: {tours[0]['letter']} (პოზიცია {tours[0]['position']})")
    print(f"   ბოლო ტური: {tours[-1]['letter']} (პოზიცია {tours[-1]['position']})")
    
    results = {
        'inserted': 0,
        'failed': 0,
        'details': [],
        'errors': []
    }
    
    print(f"\n🔄 დამუშავება იწყება...\n")
    
    for idx, proverb in enumerate(proverbs, 1):
        proverb_text = proverb['content']
        
        try:
            appropriate_tour, trigger_word, normalized_word = find_appropriate_tour(
                proverb_text, 
                tours
            )
            
            if not appropriate_tour:
                print(f"❌ [{idx}] ვერ მოიძებნა შესაბამისი ტური")
                results['failed'] += 1
                results['errors'].append({
                    'index': idx,
                    'proverb': proverb_text,
                    'error': 'ვერ მოიძებნა შესაბამისი ტური'
                })
                continue
            
            result = insert_proverb_to_tour(conn, cursor, appropriate_tour, proverb_text)
            
            if result:
                results['inserted'] += 1
                
                detail = {
                    'index': idx,
                    'proverb': proverb_text[:50] + "..." if len(proverb_text) > 50 else proverb_text,
                    'tour_letter': result['letter'],
                    'tour_position': result['position'],
                    'trigger_word': trigger_word or '(ყველა ცნობილი)'
                }
                results['details'].append(detail)
                
                print(f"✅ [{idx:2d}] {result['letter']:2s} (პოზ.{result['position']:2d}) | "
                      f"'{trigger_word or '✓'}' → {proverb_text[:40]}...")
            else:
                results['failed'] += 1
                print(f"❌ [{idx}] ჩაწერა ვერ მოხერხდა")
                results['errors'].append({
                    'index': idx,
                    'proverb': proverb_text,
                    'error': 'ჩაწერა ვერ მოხერხდა'
                })
        
        except Exception as e:
            results['failed'] += 1
            error_msg = str(e)
            print(f"❌ [{idx}] შეცდომა: {error_msg}")
            results['errors'].append({
                'index': idx,
                'proverb': proverb_text,
                'error': error_msg
            })
    
    return results


def print_results(results):
    """
    ✅ საბოლოო შედეგების ჩვენება
    """
    print("\n" + "=" * 70)
    print("📊 საბოლოო შედეგები:")
    print("=" * 70)
    print(f"✅ წარმატებით ჩაწერილი: {results['inserted']}")
    print(f"❌ წარუმატებელი: {results['failed']}")
    print(f"📝 სულ: {results['inserted'] + results['failed']}")
    
    if results.get('errors'):
        print(f"\n⚠️  შეცდომები ({len(results['errors'])}):")
        for err in results['errors'][:5]:
            print(f"   [{err['index']}] {err['proverb'][:40]}...")
            print(f"        → {err['error']}")
    
    if results['details']:
        print(f"\n📋 დეტალური განაწილება ტურების მიხედვით:")
        
        by_tour = {}
        for detail in results['details']:
            tour_key = f"{detail['tour_letter']} (პოზ.{detail['tour_position']})"
            if tour_key not in by_tour:
                by_tour[tour_key] = []
            by_tour[tour_key].append(detail)
        
        for tour_key, items in sorted(by_tour.items(), key=lambda x: items[0]['tour_position']):
            print(f"\n   🎯 {tour_key}: {len(items)} ანდაზა")
            for item in items:
                print(f"      • {item['proverb']}")
                if item['trigger_word'] and item['trigger_word'] != '(ყველა ცნობილი)':
                    print(f"        ↳ trigger: '{item['trigger_word']}'")


def main():
    """
    ✅ მთავარი ფუნქცია
    """
    print("=" * 70)
    print("🚀 ანდაზების დედაენაში ჩაწერა (გოგებაშვილი)")
    print("=" * 70)
    
    script_dir = Path(__file__).resolve().parent
    file_path = script_dir / "proverbs.txt"
    
    print(f"\n📂 ფაილი: {file_path}")
    print(f"📂 .env: {env_path}")
    print(f"🗄️  ცხრილი: {TABLE_NAME}")
    
    proverbs = read_proverbs_from_file(file_path)
    
    if not proverbs:
        print("❌ ანდაზები არ მოიძებნა. პროგრამა დასრულებულია.")
        return
    
    print(f"\n⚠️  გაფრთხილება: {len(proverbs)} ანდაზა დაემატება {TABLE_NAME} ცხრილში!")
    print(f"📍 სვეტი: proverbs (არა sentences)")
    response = input("📝 გსურთ გაგრძელება? (yes/no): ").strip().lower()
    
    if response not in ['yes', 'y', 'კი']:
        print("❌ ოპერაცია გაუქმებულია.")
        return
    
    conn = None
    cursor = None
    
    try:
        print(f"\n🔌 დაკავშირება ბაზასთან: {DB_CONFIG['database']}@{DB_CONFIG['host']}")
        
        conn = psycopg2.connect(**DB_CONFIG, cursor_factory=RealDictCursor)
        conn.autocommit = False
        cursor = conn.cursor()
        
        print("✅ დაკავშირება წარმატებული")
        
        results = process_proverbs(conn, cursor, proverbs)
        
        print_results(results)
        
        print("\n" + "=" * 70)
        print("🎉 პროცესი დასრულებულია!")
        print("=" * 70)
    
    except psycopg2.Error as e:
        print(f"\n❌ ბაზის შეცდომა: {e}")
        if conn:
            conn.rollback()
            print("🔄 ტრანზაქცია გაუქმებულია")
    
    except KeyboardInterrupt:
        print(f"\n\n⚠️  ოპერაცია შეწყვეტილია მომხმარებლის მიერ")
        if conn:
            conn.rollback()
    
    except Exception as e:
        print(f"\n❌ შეცდომა: {e}")
        import traceback
        traceback.print_exc()
        if conn:
            conn.rollback()
    
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
            print("\n🔌 დაკავშირება დახურულია")


if __name__ == "__main__":
    main()