import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { Service } from '../services';
import { getCurrentUser } from '../utils/auth';
import type { User } from '../services/models/User';
import type { UserUpdate } from '../services/models/UserUpdate';
import './Profile.css';

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    is_active: true,
  });

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await getCurrentUser();
      setUser(userData);
      setFormData({
        email: userData.email || '',
        full_name: userData.full_name || '',
        is_active: userData.is_active ?? true,
      });
    } catch (err: any) {
      console.error('加载用户信息失败:', err);
      if (err?.response?.status === 500) {
        setError('服务器错误，无法加载用户信息。请稍后重试。');
      } else if (err?.response?.status !== 401) {
        setError('加载用户信息失败，请刷新页面重试。');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const updateData: UserUpdate = {
        email: formData.email || null,
        full_name: formData.full_name || null,
        is_active: formData.is_active,
      };
      await Service.updateUserMeApiV1UsersMePut(updateData);
      loadUser();
    } catch (err: any) {
      console.error('更新失败:', err);
      setError(err?.body?.detail || err?.message || '更新失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="wc-page profile-page">
      <div className="wc-page-header">
        <div>
          <button type="button" className="wc-btn wc-btn-ghost wc-btn-sm profile-back" onClick={() => navigate('/dashboard')}>
            <ChevronLeft size={14} /> 返回
          </button>
          <div className="wc-page-heading">
            <span className="wc-accent-bar" />
            <div>
              <h1 className="wc-page-title">个人资料</h1>
              <p className="wc-page-subtitle">查看账户信息并编辑你的资料。</p>
            </div>
          </div>
        </div>
      </div>

      {error && !user && (
        <div className="wc-alert wc-alert-error profile-alert">{error}</div>
      )}

      {loading ? <div className="wc-loading profile-loading"><Loader2 size={18} className="wc-spinner" /> 加载中...</div> : user && (
        <div className="profile-grid">
          {/* 只读信息组 */}
          <section className="wc-card">
            <div className="wc-card-header">
              <div>
                <h2 className="wc-card-title">账户信息</h2>
                <p className="wc-card-subtitle">只读，如需修改请联系管理员</p>
              </div>
            </div>
            <div className="profile-info-list">
              <div className="profile-info-row">
                <span className="profile-info-label">用户名</span>
                <span className="profile-info-value">{user.username}</span>
              </div>
              <div className="profile-info-row">
                <span className="profile-info-label">用户 ID</span>
                <span className="profile-info-value">{user.id}</span>
              </div>
              <div className="profile-info-row">
                <span className="profile-info-label">创建时间</span>
                <span className="profile-info-value">{new Date(user.created_at).toLocaleString()}</span>
              </div>
              <div className="profile-info-row">
                <span className="profile-info-label">超级用户</span>
                <span className={user.is_superuser ? 'wc-badge wc-badge-warning' : 'wc-badge wc-badge-muted'}>
                  {user.is_superuser ? '是' : '否'}
                </span>
              </div>
            </div>
          </section>

          {/* 编辑表单组 */}
          <section className="wc-card">
            <div className="wc-card-header">
              <div>
                <h2 className="wc-card-title">编辑资料</h2>
                <p className="wc-card-subtitle">更新你的邮箱与显示名称</p>
              </div>
            </div>
            <form className="wc-form wc-card-body profile-edit-body" onSubmit={handleSubmit}>
              {error && <div className="wc-alert wc-alert-error">{error}</div>}

              <div className="wc-field">
                <label htmlFor="email" className="wc-label">邮箱</label>
                <input
                  id="email"
                  type="email"
                  className="wc-input"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="请输入邮箱"
                />
              </div>

              <div className="wc-field">
                <label htmlFor="full_name" className="wc-label">全名</label>
                <input
                  id="full_name"
                  type="text"
                  className="wc-input"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="请输入全名"
                />
              </div>

              <label className="wc-check">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
                <span>账户激活</span>
              </label>

              <div className="wc-form-actions">
                <button type="submit" className="wc-btn wc-btn-primary" disabled={saving}>
                  {saving ? '保存中...' : '保存'}
                </button>
                <button type="button" className="wc-btn wc-btn-secondary" onClick={() => navigate('/dashboard')} disabled={saving}>
                  取消
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
