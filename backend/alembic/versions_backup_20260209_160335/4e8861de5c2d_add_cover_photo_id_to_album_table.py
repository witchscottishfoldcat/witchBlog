"""add_cover_photo_id_to_album_table

Revision ID: 4e8861de5c2d
Revises: 1e9f92c085f3
Create Date: 2025-12-16 12:27:30.391364

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '4e8861de5c2d'
down_revision = '1e9f92c085f3'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 添加 cover_photo_id 字段到 albums 表
    op.add_column('albums', sa.Column('cover_photo_id', sa.Integer(), nullable=True))
    # 创建外键约束
    op.create_foreign_key('fk_album_cover_photo', 'albums', 'photos', ['cover_photo_id'], ['id'])


def downgrade() -> None:
    # 删除外键约束
    op.drop_constraint('fk_album_cover_photo', 'albums', type_='foreignkey')
    # 删除 cover_photo_id 字段
    op.drop_column('albums', 'cover_photo_id')