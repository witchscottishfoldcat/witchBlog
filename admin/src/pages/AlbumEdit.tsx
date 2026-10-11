import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Service } from '../services';
import type { AlbumCreate, AlbumUpdate } from '../services';
import './AlbumEdit.css';

export default function AlbumEdit() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tags: '',
    is_public: false,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit && id) {
      loadAlbum();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEdit]);

  const loadAlbum = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const album = await Service.getAlbumApiV1AlbumsAlbumIdGet(Number(id));
      setFormData({
        title: album.title || '',
        description: album.description || '',
        tags: Array.isArray(album.tags) ? album.tags.join(',') : '',
        is_public: album.is_public ?? false,
      });
    } catch (error) {
      console.error('加载相册失败:', error);
      setError('加载相册失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const tags = formData.tags.split(',').map((t) => t.trim()).filter(Boolean);
      if (isEdit && id) {
        const updateData: AlbumUpdate = {
          title: formData.title || null,
          description: formData.description || null,
          tags,
          is_public: formData.is_public,
        };
        await Service.updateAlbumApiV1AlbumsAlbumIdPut(Number(id), updateData);
      } else {
        const createData: AlbumCreate = {
          title: formData.title,
          description: formData.description || undefined,
          tags,
          is_public: formData.is_public,
        };
        await Service.createAlbumApiV1AlbumsPost(createData);
      }
      navigate('/albums');
    } catch (error: any) {
      console.error('保存失败:', error);
      setError(error?.body?.detail || error?.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="wc-page">
      <div className="wc-page-header">
        <div className="wc-page-heading">
          <span className="wc-accent-bar" />
          <div>
            <h1 className="wc-page-title">{isEdit ? '编辑相册' : '新建相册'}</h1>
            <p className="wc-page-subtitle">填写相册标题、描述与可见性。</p>
          </div>
        </div>
        <div className="wc-page-actions">
          <button type="button" onClick={() => navigate('/albums')} className="wc-btn wc-btn-ghost">
            取消
          </button>
        </div>
      </div>

      {loading ? (
        <div className="wc-loading" style={{ minHeight: '12rem' }}><Loader2 size={18} className="wc-spinner" />加载中...</div>
      ) : (
        <div className="wc-card wc-card-pad">
          <form onSubmit={handleSubmit} className="wc-form">
            {error && <div className="wc-alert wc-alert-error">{error}</div>}

            <div className="wc-field">
              <label htmlFor="title" className="wc-label">标题<span className="wc-required">*</span></label>
              <input
                id="title"
                type="text"
                className="wc-input"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                placeholder="请输入相册标题"
              />
            </div>

            <div className="wc-field">
              <label htmlFor="description" className="wc-label">描述</label>
              <textarea
                id="description"
                className="wc-textarea"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                placeholder="请输入相册描述"
              />
            </div>

            <div className="wc-field">
              <label htmlFor="tags" className="wc-label">标签</label>
              <input
                id="tags"
                type="text"
                className="wc-input"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="多个标签用逗号分隔"
              />
            </div>

            <div className="wc-field">
              <label className="wc-label">可见性</label>
              <label className="wc-check">
                <input
                  type="checkbox"
                  checked={formData.is_public}
                  onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                />
                <span>{formData.is_public ? '公开（前台「我的相册」可见）' : '私有（仅自己可见）'}</span>
              </label>
            </div>

            <div className="wc-form-actions">
              <button type="submit" className="wc-btn wc-btn-primary" disabled={saving}>
                {saving ? '保存中...' : '保存'}
              </button>
              <button
                type="button"
                className="wc-btn wc-btn-ghost"
                onClick={() => navigate('/albums')}
                disabled={saving}
              >
                取消
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
