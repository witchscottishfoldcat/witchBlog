import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Upload, Loader2 } from 'lucide-react';
import { Service } from '../services';
import type { LinkCreate, LinkUpdate, Link } from '../services';
import './LinkEdit.css';

export default function LinkEdit() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const imageUploadRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    url: '',
    description: '',
    image_url: '',
    image_type: '',
    tags: '',
    category: '',
    is_active: true,
    sort_order: 0,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
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
      const link: Link = await Service.getLinkApiV1LinksLinkIdGet(Number(id));
      setFormData({
        name: link.name || '',
        url: link.url || '',
        description: link.description || '',
        image_url: link.image_url || '',
        image_type: link.image_type || '',
        tags: link.tags || '',
        category: link.category || '',
        is_active: link.is_active ?? true,
        sort_order: link.sort_order || 0,
      });
    } catch (error) {
      console.error('加载链接失败:', error);
      setError('加载链接失败');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async () => {
    if (!imageUploadRef.current?.files?.[0]) {
      alert('请选择要上传的图片');
      return;
    }

    setUploadingImage(true);
    try {
      const file = imageUploadRef.current.files[0];
      const formData = {
        file: file,
      };
      
      let response;
      if (isEdit && id) {
        // 编辑模式：上传到指定链接
        response = await Service.uploadImageToLinkApiV1LinksLinkIdUploadImagePost(
          Number(id),
          formData
        );
      } else {
        // 新建模式：先上传图片
        response = await Service.uploadLinkImageApiV1LinksUploadImagePost(formData);
      }
      
      // 根据API响应更新表单
      if (response.image_url) {
        setFormData(prev => ({
          ...prev,
          image_url: response.image_url || '',
          image_type: 'minio'
        }));
        alert('图片上传成功！');
      }
      
      if (imageUploadRef.current) {
        imageUploadRef.current.value = '';
      }
    } catch (error) {
      console.error('上传图片失败:', error);
      alert('上传图片失败，请查看控制台');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      if (isEdit && id) {
        const updateData: LinkUpdate = {
          name: formData.name || null,
          url: formData.url || null,
          description: formData.description || null,
          image_url: formData.image_url || null,
          tags: formData.tags || null,
          category: formData.category || null,
          is_active: formData.is_active,
          sort_order: formData.sort_order,
        };
        await Service.updateLinkApiV1LinksLinkIdPut(Number(id), updateData);
      } else {
        const createData: LinkCreate = {
          name: formData.name,
          url: formData.url,
          description: formData.description || null,
          image_url: formData.image_url || null,
          image_type: formData.image_type || null,
          tags: formData.tags || null,
          category: formData.category || undefined,
          is_active: formData.is_active,
          sort_order: formData.sort_order,
        };
        await Service.createLinkApiV1LinksPost(createData);
      }
      navigate('/links');
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
            <h1 className="wc-page-title">{isEdit ? '编辑链接' : '新建链接'}</h1>
            <p className="wc-page-subtitle">填写链接的名称、地址与展示信息。</p>
          </div>
        </div>
        <div className="wc-page-actions">
          <button type="button" onClick={() => navigate('/links')} className="wc-btn wc-btn-ghost">
            取消
          </button>
        </div>
      </div>

      {loading ? (
        <div className="wc-loading" style={{ minHeight: '12rem' }}><Loader2 size={18} className="wc-spinner" />加载中...</div>
      ) : (
        <div className="wc-card wc-card-pad">
          <form onSubmit={handleSubmit} className="wc-form-grid">
            {error && <div className="wc-alert wc-alert-error wc-field-span">{error}</div>}

            <div className="wc-field">
              <label htmlFor="name" className="wc-label">名称<span className="wc-required">*</span></label>
              <input
                id="name"
                type="text"
                className="wc-input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="请输入链接名称"
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

            <div className="wc-field wc-field-span">
              <label htmlFor="description" className="wc-label">描述</label>
              <textarea
                id="description"
                className="wc-textarea"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                placeholder="请输入链接描述"
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

            <div className="wc-field">
              <label htmlFor="image_url" className="wc-label">图片URL</label>
              <div className="wc-input-group">
                <input
                  id="image_url"
                  type="url"
                  className="wc-input"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://example.com/image.png"
                />
                <input
                  ref={imageUploadRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleImageUpload}
                />
                <button
                  type="button"
                  onClick={() => imageUploadRef.current?.click()}
                  disabled={uploadingImage}
                  className="wc-btn wc-btn-secondary"
                >
                  <Upload size={14} /> {uploadingImage ? '上传中...' : '上传图片'}
                </button>
              </div>
              {formData.image_url && (
                <div className="link-edit-preview">
                  {/* 外链图可能被防盗链拦截或受访问者代理影响，预览统一走后端图片代理 */}
                  <img
                    src={`/api/proxy-image?url=${encodeURIComponent(formData.image_url)}`}
                    alt="预览"
                  />
                </div>
              )}
            </div>

            <div className="wc-field">
              <label htmlFor="image_type" className="wc-label">图片类型</label>
              <input
                id="image_type"
                type="text"
                className="wc-input"
                value={formData.image_type}
                onChange={(e) => setFormData({ ...formData, image_type: e.target.value })}
                placeholder="例如: png, jpg"
              />
            </div>

            <div className="wc-field">
              <label htmlFor="sort_order" className="wc-label">排序</label>
              <input
                id="sort_order"
                type="number"
                className="wc-input"
                value={formData.sort_order}
                onChange={(e) => setFormData({ ...formData, sort_order: Number(e.target.value) })}
                min="0"
              />
            </div>

            <div className="wc-field link-edit-check-field">
              <label className="wc-check">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
                激活
              </label>
            </div>

            <div className="wc-form-actions wc-field-span">
              <button type="submit" className="wc-btn wc-btn-primary" disabled={saving}>
                {saving ? '保存中...' : '保存'}
              </button>
              <button
                type="button"
                className="wc-btn wc-btn-ghost"
                onClick={() => navigate('/links')}
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
