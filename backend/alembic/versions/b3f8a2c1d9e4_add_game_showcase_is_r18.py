"""add game_showcase is_r18

Revision ID: b3f8a2c1d9e4
Revises: 9f3c2b1a7d10
Create Date: 2026-08-25
"""

from alembic import op
import sqlalchemy as sa


revision = "b3f8a2c1d9e4"
down_revision = "9f3c2b1a7d10"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "game_showcase",
        sa.Column(
            "is_r18",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("0"),
            comment="是否 R18 成人内容（公开 API 默认过滤）",
        ),
    )


def downgrade() -> None:
    op.drop_column("game_showcase", "is_r18")
