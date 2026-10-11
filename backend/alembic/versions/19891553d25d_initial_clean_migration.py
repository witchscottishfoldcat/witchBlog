"""initial_clean_migration

Revision ID: 19891553d25d
Revises:
Create Date: 2026-02-09 16:05:10.331102

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision = "19891553d25d"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    """
    初始干净迁移 - 不执行任何操作

    这个迁移文件作为版本历史的起点。
    数据库已经处于正确状态，无需执行任何变更。
    """
    pass


def downgrade() -> None:
    """
    初始干净迁移 - 不执行任何操作
    """
    pass
