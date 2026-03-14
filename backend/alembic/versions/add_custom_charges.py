"""add custom_charges to financial_profiles

Revision ID: a1b2c3d4e5f6
Revises:
Create Date: 2026-03-14
"""
from alembic import op
import sqlalchemy as sa

revision = "a1b2c3d4e5f6"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "financial_profiles",
        sa.Column("custom_charges", sa.JSON(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("financial_profiles", "custom_charges")
