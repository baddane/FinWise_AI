"""
Script de diagnostic DB - lancer avec:
  DATABASE_URL=postgresql://... python check_db.py
"""
import os
import sys
import psycopg2

DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    print("ERROR: DATABASE_URL non défini")
    sys.exit(1)

conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

print("\n=== TABLES ===")
cur.execute("""
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' ORDER BY table_name
""")
tables = [r[0] for r in cur.fetchall()]
print(tables)

print("\n=== alembic_version ===")
try:
    cur.execute("SELECT * FROM alembic_version")
    print(cur.fetchall())
except Exception as e:
    print(f"Pas de table alembic_version: {e}")

print("\n=== users (count + derniers) ===")
try:
    cur.execute("SELECT COUNT(*) FROM users")
    print(f"Total users: {cur.fetchone()[0]}")
    cur.execute("SELECT id, email, created_at FROM users ORDER BY created_at DESC LIMIT 5")
    for r in cur.fetchall():
        print(r)
except Exception as e:
    print(f"Erreur users: {e}")

print("\n=== financial_profiles (columns) ===")
try:
    cur.execute("""
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'financial_profiles'
        ORDER BY ordinal_position
    """)
    for r in cur.fetchall():
        print(r)
    cur.execute("SELECT COUNT(*) FROM financial_profiles")
    print(f"Total financial_profiles: {cur.fetchone()[0]}")
except Exception as e:
    print(f"Erreur financial_profiles: {e}")

cur.close()
conn.close()
print("\nDone.")
