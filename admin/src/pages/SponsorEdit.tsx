import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { sponsorsApi, type SponsorCreate } from '../services/sponsorsApi';
import './SponsorEdit.css';

/* ISO 时间 ↔ datetime-local 输入框格式互转 */
function toLocalInputValue(value?: string | null): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toIsoValue(local: string): string | null {
  if (!local) return null;
  const d = new Date(local);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export default function SponsorEdit() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    message: '',
    amount: '',
    source: 'other',
    is_anonymous: false,
    is_active: true,
    sort_order: 0,
    sponsored_at_local: '',
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit && id) {
      loadSponsor();
    }
  }, [id, isEdit]);

  const loadSponsor = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const item = await sponsorsApi.get(Number(id));
      setFormData({
        name: item.name || '',
        message: item.message || '',
        amount: item.amount === null || item.amount === undefined ? '' : String(item.amount),
        source: item.source || 'other',
        is_anonymous: item.is_anonymous || false,
        is_active: item.is_active ?? true,
        sort_order: item.sort_order ?? 0,
        sponsored_at_local: toLocalInputValue(item.sponsored_at),
      });
    } catch (e) {
      console.error('加载赞助记录失败:', e);
      setError('加载赞助记录失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    const payload: SponsorCreate = {
      name: formData.name.trim(),
      message: formData.message.trim() || null,
      amount: formData.amount === '' ? null : Number(formData.amount),
      source: formData.source,
      is_anonymous: formData.is_anonymous,
      is_active: formData.is_active,
      sort_order: Number(formData.sort_order) || 0,
      sponsored_at: toIsoValue(formData.sponsored_at_local),
    };

    try {
      if (isEdit && id) {
        await sponsorsApi.update(Number(id), payload);
      } else {
        await sponsorsApi.create(payload);
      }
      navigate('/sponsors');
    } catch (e: unknown) {
      console.error('保存失败:', e);
      const err = e as { response?: { data?: { detail?: string } }; message?: string };
      setError(err?.response?.data?.detail || err?.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="wc-page sponsor-edit-page">
      <div className="wc-page-header">
        <div className="wc-page-heading">
          <span className="wc-accent-bar" />
          <div>
            <h1 className="wc-page-title">{isEdit ? '编辑赞助鸣谢' : '新增赞助鸣谢'}</h1>
            <p className="wc-page-subtitle">记录一位支持者，保存后出现在博客支持页的鸣谢列表。</p>
          </div>
        </div>
        <div className="wc-page-actions">
          <button type="button" onClick={() => navigate('/sponsors')} className="wc-btn wc-btn-ghost">
            返回列表
          </button>
        </div>
      </div>

      {loading ? (
        <div className="wc-loading">
          <Loader2 size={18} className="wc-spinner" /> 加载中...
        </div>
      ) : (
        <div className="wc-card wc-card-pad">
          <form onSubmit={handleSubmit} className="wc-form">
            {error && <div className="wc-alert wc-alert-error">{error}</div>}

            <div className="wc-form-grid">
              <div className="wc-field">
                <label htmlFor="name" className="wc-label">
                  昵称<span className="wc-required">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  className="wc-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  maxLength={50}
                  placeholder="赞助者怎么称呼"
                />
              </div>

              <div className="wc-field">
                <label htmlFor="amount" className="wc-label">
                  金额（元）
                </label>
                <input
                  id="amount"
                  type="number"
                  className="wc-input"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  min="0"
                  step="0.01"
                  placeholder="留空则不展示金额"
                />
              </div>

              <div className="wc-field">
                <label htmlFor="source" className="wc-label">
                  赞助渠道
                </label>
                <select
                  id="source"
                  className="wc-select"
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                >
                  <option value="alipay">支付宝</option>
                  <option value="wechat">微信</option>
                  <option value="other">其他</option>
                </select>
              </div>

              <div className="wc-field">
                <label htmlFor="sponsored_at" className="wc-label">
                  赞助时间
                </label>
                <input
                  id="sponsored_at"
                  type="datetime-local"
                  className="wc-input"
                  value={formData.sponsored_at_local}
                  onChange={(e) => setFormData({ ...formData, sponsored_at_local: e.target.value })}
                />
                <p className="wc-field-hint">留空则按创建时间排序展示</p>
              </div>

              <div className="wc-field wc-field-span">
                <label htmlFor="message" className="wc-label">
                  留言
                </label>
                <textarea
                  id="message"
                  className="wc-textarea"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={3}
                  maxLength={500}
                  placeholder="赞助者留下的鼓励（可空）"
                />
              </div>

              <div className="wc-field">
                <label htmlFor="sort_order" className="wc-label">
                  排序权重
                </label>
                <input
                  id="sort_order"
                  type="number"
                  className="wc-input"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: Number(e.target.value) })}
                  step="1"
                />
                <p className="wc-field-hint">越大越靠前</p>
              </div>
            </div>

            <div className="wc-check-row">
              <label className="wc-check">
                <input
                  type="checkbox"
                  checked={formData.is_anonymous}
                  onChange={(e) => setFormData({ ...formData, is_anonymous: e.target.checked })}
                />
                匿名展示（前台只显示留言）
              </label>

              <label className="wc-check">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
                在前台展示
              </label>
            </div>

            <div className="wc-form-actions">
              <button type="submit" className="wc-btn wc-btn-primary" disabled={saving}>
                {saving ? '保存中...' : '保存'}
              </button>
              <button
                type="button"
                className="wc-btn wc-btn-ghost"
                onClick={() => navigate('/sponsors')}
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
