#!/bin/bash
set -e

# Step 1: ensure all tables exist (create_all is idempotent — safe to run every time).
# This must happen BEFORE alembic so migrations can ALTER existing tables.
python << 'PYEOF'
import os, sys

db_url = os.environ.get("DATABASE_URL", "").replace("postgres://", "postgresql://", 1)
if not db_url:
    print("DATABASE_URL not set — skipping DB init.")
    sys.exit(0)

# Import app modules (WORKDIR is /app)
from sqlalchemy import create_engine, text
import app.models  # noqa: F401 — registers all ORM models
from app.database import Base

engine = create_engine(db_url, connect_args={"connect_timeout": 10})
print("Running create_all to ensure base tables exist ...")
Base.metadata.create_all(bind=engine)
print("Tables created/verified.")

# Step 2: if alembic_version is missing, stamp with the LATEST revision so
# alembic knows all migrations have already been applied by create_all.
with engine.connect() as conn:
    has_alembic = conn.execute(text(
        "SELECT EXISTS(SELECT FROM information_schema.tables WHERE table_name='alembic_version')"
    )).scalar()

    if not has_alembic:
        print("No alembic_version table found. Stamping latest migration b2c3d4e5f6a7 ...")
        conn.execute(text(
            "CREATE TABLE alembic_version "
            "(version_num VARCHAR(32) NOT NULL CONSTRAINT alembic_version_pkc PRIMARY KEY)"
        ))
        conn.execute(text("INSERT INTO alembic_version VALUES ('c3d4e5f6a7b8')"))
        conn.commit()
        print("Stamped.")
PYEOF

echo "Running alembic upgrade head ..."
alembic upgrade head
echo "Migrations applied."

exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
