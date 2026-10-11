import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Service } from '../services';
import type { UserCreate, UserUpdate, User } from '../services';
import './UserEdit.css';

export default function UserEdit() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    is_superuser: false,
    is_active: true,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit && id) {
      loadUser();
    }
  }, [id, isEdit]);

  const loadUser = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const user: User = await Service.readUserApiV1UsersUserIdGet(Number(id));
      setFormData({
        username: user.username || '',
        email: user.email || '',
        password: '',
        is_superuser: user.is_superuser || false,
        is_active: user.is_active ?? true,
      });
    } catch (error) {
      console.error('加载用户失败:', error);
      setError('加载用户失败');
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
        const updateData: UserUpdate = {
          email: formData.email || null,
          password: formData.password || null,
          is_active: formData.is_active,
        };
        await Service.updateUserApiV1UsersUserIdPut(Number(id), updateData);
      } else {
        const createData: UserCreate = {
          username: formData.username,
          email: formData.email,
          password: formData.password,
          is_active: formData.is_active,
        };
        await Service.createUserApiV1UsersPost(createData);
      }
      navigate('/users');
    } catch (error: any) {
      console.error('保存失败:', error);
      setError(error?.body?.detail || error?.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="wc-page user-edit">
      <header className="wc-page-header">
        <div className="wc-page-heading">
          <span className="wc-accent-bar" />
          <div>
            <h1 className="wc-page-title">{isEdit ? '编辑用户' : '新建用户'}</h1>
          </div>
        </div>
        <div className="wc-page-actions">
          <button type="button" onClick={() => navigate('/users')} className="wc-btn wc-btn-ghost">
            取消
          </button>
        </div>
      </header>

      {loading ? (
        <div className="wc-loading" style={{ minHeight: '12rem' }}><Loader2 size={18} className="wc-spinner" />加载中...</div>
      ) : (
      <form onSubmit={handleSubmit} className="wc-form">
        {error && <div className="wc-alert wc-alert-error">{error}</div>}

        <div className="wc-card wc-card-pad">
          <div className="wc-form">
            {!isEdit && (
              <div className="wc-field">
                <label htmlFor="username" className="wc-label">用户名<span className="wc-required">*</span></label>
                <input
                  id="username"
                  type="text"
                  className="wc-input"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                  placeholder="请输入用户名"
                />
              </div>
            )}

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
              <label htmlFor="password" className="wc-label">
                {isEdit ? '新密码（留空不修改）' : <>密码<span className="wc-required">*</span></>}
              </label>
              <input
                id="password"
                type="password"
                className="wc-input"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required={!isEdit}
                placeholder="请输入密码"
              />
            </div>

            <div className="wc-check-row">
              <label className="wc-check">
                <input
                  type="checkbox"
                  checked={formData.is_superuser}
                  onChange={(e) => setFormData({ ...formData, is_superuser: e.target.checked })}
                />
                超级用户
              </label>

              <label className="wc-check">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
                激活
              </label>
            </div>
          </div>
        </div>

        <div className="wc-form-actions">
          <button type="submit" className="wc-btn wc-btn-primary" disabled={saving}>
            {saving ? '保存中...' : '保存'}
          </button>
          <button
            type="button"
            className="wc-btn wc-btn-ghost"
            onClick={() => navigate('/users')}
            disabled={saving}
          >
            取消
          </button>
        </div>
      </form>
      )}
    </div>
  );
}
