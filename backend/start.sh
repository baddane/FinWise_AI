#!/bin/bash
set -e

# If alembic_version table doesn't exist, the tables were created by create_all
# (not via migrations). Stamp the first migration as already applied so that
# alembic upgrade head only runs new, pending migrations.
python << 'PYEOF'
import os
from sqlalchemy import create_engine, text

db_url = os.environ.get("DATABASE_URL", "").replace("postgres://", "postgresql://", 1)
if not db_url:
    exit(0)

engine = create_engine(db_url)
with engine.connect() as conn:
    has_alembic = conn.execute(text(
        "SELECT EXISTS(SELECT FROM information_schema.tables WHERE table_name='alembic_version')"
    )).scalar()

    if not has_alembic:
        print("No alembic_version table found. Stamping base migration a1b2c3d4e5f6 ...")
        conn.execute(text(
            "CREATE TABLE alembic_version "
            "(version_num VARCHAR(32) NOT NULL CONSTRAINT alembic_version_pkc PRIMARY KEY)"
        ))
        conn.execute(text("INSERT INTO alembic_version VALUES ('a1b2c3d4e5f6')"))
        conn.commit()
        print("Stamped.")
PYEOF

echo "Running alembic upgrade head ..."
alembic upgrade head
echo "Migrations applied."

exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
