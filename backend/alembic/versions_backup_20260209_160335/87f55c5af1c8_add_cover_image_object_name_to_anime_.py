"""add_cover_image_object_name_to_anime_watchlist_table

Revision ID: 87f55c5af1c8
Revises: 73979c83a182
Create Date: 2025-12-09 16:52:45.437613

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '87f55c5af1c8'
down_revision = '73979c83a182'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 添加 cover_image_object_name 字段到 anime_watchlist 表
    op.add_column('anime_watchlist', sa.Column('cover_image_object_name', sa.String(length=500), nullable=True, comment='MinIO中存储的封面图片对象名称'))


def downgrade() -> None:
    # 删除 cover_image_object_name 字段
    op.drop_column('anime_watchlist', 'cover_image_object_name')