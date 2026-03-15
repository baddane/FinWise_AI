"""add savings_monthly and savings_goal to financial_profiles

Revision ID: add_savings_to_profile
Revises: add_custom_charges
Create Date: 2026-03-15
"""
from alembic import op
import sqlalchemy as sa

revision = "add_savings_to_profile"
down_revision = "add_custom_charges"
branch_labels = None
depends_on = None


def upgrade():
    with op.get_context().autocommit_block():
        op.execute("""
            ALTER TABLE financial_profiles
            ADD COLUMN IF NOT EXISTS savings_monthly FLOAT,
            ADD COLUMN IF NOT EXISTS savings_goal FLOAT
        """)


def downgrade():
    op.drop_column("financial_profiles", "savings_goal")
    op.drop_column("financial_profiles", "savings_monthly")
