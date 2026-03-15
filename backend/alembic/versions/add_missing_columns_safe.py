"""add missing columns safely (IF NOT EXISTS)

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-03-15
"""
from alembic import op
import sqlalchemy as sa

revision = "c3d4e5f6a7b8"
down_revision = "b2c3d4e5f6a7"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Use raw SQL with IF NOT EXISTS so this migration is safe to run on any DB state
    # regardless of whether previous migrations ran or create_all() was used.

    # financial_profiles.custom_charges (added in a1b2c3d4e5f6 but may have been skipped)
    op.execute("ALTER TABLE financial_profiles ADD COLUMN IF NOT EXISTS custom_charges JSON")

    # users columns added in b2c3d4e5f6a7 (may also be missing)
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN NOT NULL DEFAULT false")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(100)")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_token_expires TIMESTAMP")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(128)")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(20) NOT NULL DEFAULT 'email'")

    # Make hashed_password nullable for Google users (IF NOT ALREADY)
    op.execute("""
        DO $$
        BEGIN
            ALTER TABLE users ALTER COLUMN hashed_password DROP NOT NULL;
        EXCEPTION WHEN others THEN NULL;
        END $$;
    """)

    # Indexes (IF NOT EXISTS)
    op.execute("CREATE INDEX IF NOT EXISTS ix_users_email_verification_token ON users (email_verification_token)")
    op.execute("CREATE UNIQUE INDEX IF NOT EXISTS ix_users_google_id ON users (google_id)")


def downgrade() -> None:
    pass
