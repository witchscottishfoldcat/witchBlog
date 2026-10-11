"""Add music libraries and tracks tables

Revision ID: add_music_tables
Revises: 
Create Date: 2026-02-09

"""
from alembic import op
import sqlalchemy as sa


revision = 'add_music_tables'
down_revision = '033c7a317c18'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'music_libraries',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('netease_playlist_id', sa.String(length=50), nullable=False),
        sa.Column('netease_url', sa.String(length=500), nullable=False),
        sa.Column('cover_image_url', sa.String(length=500), nullable=True),
        sa.Column('minio_cover_object_name', sa.String(length=500), nullable=True),
        sa.Column('tags', sa.String(length=200), nullable=True),
        sa.Column('is_public', sa.Boolean(), nullable=True),
        sa.Column('track_count', sa.Integer(), nullable=True),
        sa.Column('view_count', sa.Integer(), nullable=True),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('sort_order', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('netease_playlist_id')
    )
    op.create_index(op.f('ix_music_libraries_id'), 'music_libraries', ['id'], unique=False)
    op.create_index(op.f('ix_music_libraries_netease_playlist_id'), 'music_libraries', ['netease_playlist_id'], unique=False)
    op.create_index(op.f('ix_music_libraries_title'), 'music_libraries', ['title'], unique=False)
    
    op.create_table(
        'music_tracks',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('library_id', sa.Integer(), nullable=True),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('artist', sa.String(length=200), nullable=False),
        sa.Column('album', sa.String(length=200), nullable=True),
        sa.Column('netease_id', sa.String(length=50), nullable=False),
        sa.Column('netease_url', sa.String(length=500), nullable=False),
        sa.Column('cover_image_url', sa.String(length=500), nullable=True),
        sa.Column('minio_cover_object_name', sa.String(length=500), nullable=True),
        sa.Column('duration', sa.Integer(), nullable=True),
        sa.Column('year', sa.Integer(), nullable=True),
        sa.Column('genre', sa.String(length=50), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('lyrics', sa.Text(), nullable=True),
        sa.Column('category', sa.String(length=50), nullable=False),
        sa.Column('tags', sa.String(length=200), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('play_count', sa.Integer(), nullable=True),
        sa.Column('last_played_at', sa.DateTime(), nullable=True),
        sa.Column('rating', sa.Float(), nullable=True),
        sa.Column('is_favorite', sa.Boolean(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('sort_order', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['library_id'], ['music_libraries.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('netease_id')
    )
    op.create_index(op.f('ix_music_tracks_id'), 'music_tracks', ['id'], unique=False)
    op.create_index(op.f('ix_music_tracks_library_id'), 'music_tracks', ['library_id'], unique=False)
    op.create_index(op.f('ix_music_tracks_netease_id'), 'music_tracks', ['netease_id'], unique=False)
    op.create_index(op.f('ix_music_tracks_title'), 'music_tracks', ['title'], unique=False)


def downgrade():
    op.drop_index(op.f('ix_music_tracks_title'), table_name='music_tracks')
    op.drop_index(op.f('ix_music_tracks_netease_id'), table_name='music_tracks')
    op.drop_index(op.f('ix_music_tracks_library_id'), table_name='music_tracks')
    op.drop_index(op.f('ix_music_tracks_id'), table_name='music_tracks')
    op.drop_table('music_tracks')
    
    op.drop_index(op.f('ix_music_libraries_title'), table_name='music_libraries')
    op.drop_index(op.f('ix_music_libraries_netease_playlist_id'), table_name='music_libraries')
    op.drop_index(op.f('ix_music_libraries_id'), table_name='music_libraries')
    op.drop_table('music_libraries')
