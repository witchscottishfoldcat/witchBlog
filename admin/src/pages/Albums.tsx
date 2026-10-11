import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Images, Pencil, Trash2, Loader2, Camera, Globe, Lock } from 'lucide-react';
import { Service } from '../services';
import type { AlbumResponse } from '../services';
import './Albums.css';

export default function Albums() {
  const [albums, setAlbums] = useState<AlbumResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  useEffect(() => {
    loadAlbums();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const loadAlbums = async () => {
    setLoading(true);
    try {
      // publicOnly=false：后台管理需要看到私有相册（后端仅超管放行）
      const response = await Service.getAlbumsApiV1AlbumsGet(
        0,
        1000,
        false,
        undefined,
        'created_at'
      );
      const all = response?.albums ?? [];
      setTotal(all.length);
      const skip = (page - 1) * limit;
      setAlbums(all.slice(skip, skip + limit));
    } catch (error: any) {
      console.error('加载相册失败:', error);
      alert(`加载相册失败: ${error?.body?.detail || error?.message || '未知错误'}`);
      setAlbums([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个相册吗？')) return;

    try {
      await Service.deleteAlbumApiV1AlbumsAlbumIdDelete(id);
      loadAlbums();
    } catch (error) {
      console.error('删除相册失败:', error);
      alert('删除相册失败');
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="wc-page">
      <div className="wc-page-header">
        <div className="wc-page-heading">
          <span className="wc-accent-bar" />
          <div>
            <h1 className="wc-page-title">相册</h1>
            <p className="wc-page-subtitle">管理相册与照片，前台「我的相册」页展示公开相册。</p>
          </div>
        </div>
        <div className="wc-page-actions">
          <Link to="/albums/new" className="wc-btn wc-btn-primary">
            <Plus size={14} /> 新建相册
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="wc-loading"><Loader2 size={18} className="wc-spinner" />加载中...</div>
      ) : (
        <>
          <div className="wc-list">
            {albums.length === 0 ? (
              <div className="wc-empty">
                <span className="wc-empty-icon"><Images size={24} strokeWidth={1.5} /></span>
                <p>暂无相册</p>
              </div>
            ) : (
              albums.map((album) => {
                const coverUrl = album.cover_photo?.thumbnail_url || album.cover_photo?.image_url;
                return (
                  <div key={album.id} className="wc-list-row">
                    <div className="wc-list-row-main albums-row-main">
                      {coverUrl ? (
                        <img src={coverUrl} alt={album.title} className="albums-cover-thumb" />
                      ) : (
                        <div className="albums-cover-thumb albums-cover-placeholder">
                          <Camera size={20} strokeWidth={1.5} />
                        </div>
                      )}
                      <div>
                        <h3 className="wc-list-row-title">
                          {album.title}
                          <span className={`wc-badge ${album.is_public ? 'wc-badge-success' : 'wc-badge-muted'}`}>
                            {album.is_public ? <><Globe size={11} /> 公开</> : <><Lock size={11} /> 私有</>}
                          </span>
                        </h3>
                        {album.description && <p className="wc-list-row-desc">{album.description}</p>}
                        <div className="wc-list-row-meta">
                          <span><Camera size={12} /> {album.photo_count ?? 0} 张照片</span>
                          {album.view_count !== undefined && <span>浏览 {album.view_count}</span>}
                          <span>创建于 {new Date(album.created_at).toLocaleDateString()}</span>
                        </div>
                        {Array.isArray(album.tags) && album.tags.length > 0 && (
                          <div className="wc-tag-row">
                            {album.tags.map((tag, i) => (
                              <span key={i} className="wc-tag">{tag}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="wc-list-row-actions">
                      <Link to={`/albums/${album.id}/photos`} className="wc-btn wc-btn-secondary" title="管理照片">
                        <Images size={14} /> 管理照片
                      </Link>
                      <Link to={`/albums/${album.id}/edit`} className="wc-icon-btn" title="编辑"><Pencil size={15} /></Link>
                      <button type="button" className="wc-icon-btn wc-icon-btn-danger" onClick={() => handleDelete(album.id)} title="删除"><Trash2 size={15} /></button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {totalPages > 1 && (
            <div className="wc-pagination">
              <button type="button" className="wc-pagination-btn" disabled={page === 1} onClick={() => setPage(page - 1)}>上一页</button>
              <span className="wc-pagination-info">{page} / {totalPages}</span>
              <button type="button" className="wc-pagination-btn" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>下一页</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
