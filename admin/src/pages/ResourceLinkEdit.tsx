import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Service } from '../services';
import type { ResourceLinkCreate, ResourceLinkUpdate, ResourceLink } from '../services';
import './ResourceLinkEdit.css';

export default function ResourceLinkEdit() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    url: '',
    description: '',
    category: '',
    tags: '',
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit && id) {
      loadLink();
    }
  }, [id, isEdit]);

  const loadLink = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const link: ResourceLink = await Service.getResourceLinkApiV1ResourceLinksLinkIdGet(Number(id));
      setFormData({
        title: link.title || '',
        url: link.url || '',
        description: link.description || '',
        category: link.category || '',
        tags: Array.isArray(link.tags) ? link.tags.join(',') : (link.tags || ''),
      });
    } catch (error) {
      console.error('加载资源链接失败:', error);
      setError('加载资源链接失败');
    } finally {
      setLoading(false);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      if (isEdit && id) {
        const updateData: ResourceLinkUpdate = {
          title: formData.title || null,
          url: formData.url || null,
          description: formData.description || null,
          category: formData.category || null,
          tags: formData.tags || null,
        };
        await Service.updateResourceLinkApiV1ResourceLinksLinkIdPut(Number(id), updateData);
      } else {
        const createData: ResourceLinkCreate = {
          title: formData.title,
          url: formData.url,
          description: formData.description || undefined,
          category: formData.category || undefined,
          tags: formData.tags || undefined,
        };
        await Service.createResourceLinkApiV1ResourceLinksPost(createData);
      }
      navigate('/resource-links');
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
            <h1 className="wc-page-title">{isEdit ? '编辑资源链接' : '新建资源链接'}</h1>
            <p className="wc-page-subtitle">填写资源链接的标题、地址与分类信息。</p>
          </div>
        </div>
        <div className="wc-page-actions">
          <button type="button" onClick={() => navigate('/resource-links')} className="wc-btn wc-btn-ghost">
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
                placeholder="请输入标题"
              />
            </div>

            <div className="wc-field">
              <label htmlFor="url" className="wc-label">URL<span className="wc-required">*</span></label>
              <input
                id="url"
                type="url"
                className="wc-input"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                required
                placeholder="https://example.com"
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
                placeholder="请输入描述"
              />
            </div>

            <div className="wc-field">
              <label htmlFor="category" className="wc-label">分类</label>
              <input
                id="category"
                type="text"
                className="wc-input"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="请输入分类"
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

            <div className="wc-form-actions">
              <button type="submit" className="wc-btn wc-btn-primary" disabled={saving}>
                {saving ? '保存中...' : '保存'}
              </button>
              <button
                type="button"
                className="wc-btn wc-btn-ghost"
                onClick={() => navigate('/resource-links')}
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
