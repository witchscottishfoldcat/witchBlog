"""add md file subcategory

Revision ID: 9f3c2b1a7d10
Revises: 669f153c8b6a
Create Date: 2026-07-18
"""

from alembic import op
import sqlalchemy as sa


revision = "9f3c2b1a7d10"
down_revision = "669f153c8b6a"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("md_files", sa.Column("subcategory", sa.String(length=100), nullable=True))
    op.add_column("md_files_archive", sa.Column("subcategory", sa.String(length=100), nullable=True))


def downgrade() -> None:
    op.drop_column("md_files_archive", "subcategory")
    op.drop_column("md_files", "subcategory")
