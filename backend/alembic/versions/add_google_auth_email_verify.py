"""add google oauth and email verification fields

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-03-14
"""
from alembic import op
import sqlalchemy as sa

revision = "b2c3d4e5f6a7"
down_revision = "a1b2c3d4e5f6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Make hashed_password nullable (Google users have no password)
    op.alter_column("users", "hashed_password", nullable=True)

    op.add_column("users", sa.Column("is_email_verified", sa.Boolean(), nullable=False, server_default="false"))
    op.add_column("users", sa.Column("email_verification_token", sa.String(100), nullable=True))
    op.add_column("users", sa.Column("email_verification_token_expires", sa.DateTime(), nullable=True))
    op.add_column("users", sa.Column("google_id", sa.String(128), nullable=True))
    op.add_column("users", sa.Column("auth_provider", sa.String(20), nullable=False, server_default="email"))

    op.create_index("ix_users_email_verification_token", "users", ["email_verification_token"])
    op.create_index("ix_users_google_id", "users", ["google_id"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_users_google_id", table_name="users")
    op.drop_index("ix_users_email_verification_token", table_name="users")
    op.drop_column("users", "auth_provider")
    op.drop_column("users", "google_id")
    op.drop_column("users", "email_verification_token_expires")
    op.drop_column("users", "email_verification_token")
    op.drop_column("users", "is_email_verified")
    op.alter_column("users", "hashed_password", nullable=False)
