"""add savings_monthly and savings_goal to financial_profiles

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-03-15
"""
from alembic import op

revision = "d4e5f6a7b8c9"
down_revision = "c3d4e5f6a7b8"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE financial_profiles ADD COLUMN IF NOT EXISTS savings_monthly FLOAT")
    op.execute("ALTER TABLE financial_profiles ADD COLUMN IF NOT EXISTS savings_goal FLOAT")


def downgrade() -> None:
    op.execute("ALTER TABLE financial_profiles DROP COLUMN IF EXISTS savings_monthly")
    op.execute("ALTER TABLE financial_profiles DROP COLUMN IF EXISTS savings_goal")
