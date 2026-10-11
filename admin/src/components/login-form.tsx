import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../utils/auth';
import './login-form.css';

export default function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!username) {
        setError('请输入用户名');
        setLoading(false);
        return;
      }

      if (!password) {
        setError('请输入密码');
        setLoading(false);
        return;
      }

      await login({ username, password }, rememberMe);
      navigate('/dashboard');
    } catch (err: any) {
      console.error('登录错误:', err);
      setError(resolveErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-form-wrapper">
      <div className="login-form-card">
        <div className="login-form-header">
          <h2 className="login-form-title">登录</h2>
          <p className="login-form-subtitle">进入你的博客后台</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="login-form-content">
            {error && <div className="login-form-error">{error}</div>}

            <div className="login-form-field">
              <label htmlFor="username" className="login-form-label">用户名</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="login-form-input"
                required
                autoComplete="username"
                placeholder="请输入用户名"
              />
            </div>

            <div className="login-form-field">
              <label htmlFor="password" className="login-form-label">密码</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="login-form-input"
                required
                autoComplete="current-password"
                placeholder="请输入密码"
              />
            </div>

            <div className="login-form-options">
              <label className="login-form-checkbox-label" htmlFor="remember">
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="login-form-checkbox-input"
                />
                <span className="login-form-checkbox-control" aria-hidden="true" />
                <span className="login-form-checkbox-text">记住我</span>
              </label>
            </div>
          </div>

          <div className="login-form-footer">
            <button type="submit" className="login-form-submit" disabled={loading}>
              {loading ? '登录中...' : '登录'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* 错误信息解析 - 从原文件抽离，降低主函数圈复杂度 */
function resolveErrorMessage(err: any): string {
  let message = '登录失败，请检查用户名和密码';

  if (err?.code === 'ERR_NETWORK' || err?.message === 'Network Error') {
    if (err?.message?.includes('CORS') || err?.request?.status === 0) {
      message = '跨域请求被阻止，请检查开发代理或服务器 CORS 配置';
    } else {
      message = '网络连接失败，请检查网络或服务器状态';
    }
  } else if (err?.code === 'ERR_CANCELED') {
    message = '请求已取消';
  } else if (err?.code === 'ECONNABORTED') {
    message = '请求超时，请稍后重试';
  } else if (err?.name === 'ApiError' || err?.body) {
    message = resolveApiError(err);
  } else if (err?.response) {
    message = resolveAxiosError(err);
  } else if (err?.body?.detail) {
    message = resolveDetail(err.body.detail);
  } else if (err?.message) {
    message = err.message;
  } else if (typeof err === 'string') {
    message = err;
  }

  return message;
}

function resolveApiError(err: any): string {
  const status = err.status;
  const detail = err.body?.detail || err.body;

  if (status === 401) return '用户名或密码错误';
  if (status === 403) return '没有权限执行此操作';
  if (status >= 500) return '服务器错误，请稍后重试';

  if (status === 400 || status === 422) {
    return resolveDetail(detail) || '请求参数错误，请检查输入';
  }

  if (typeof detail === 'string') return detail;
  return `请求失败 (${status})`;
}

function resolveAxiosError(err: any): string {
  const status = err.response.status;
  const detail = err.response.data?.detail || err.response.data;

  if (status === 401) return '用户名或密码错误';
  if (status === 403) return '没有权限执行此操作';
  if (status === 409) return '用户名或邮箱已存在';
  if (status >= 500) return '服务器错误，请稍后重试';
  if (status === 400 || status === 422) {
    return resolveDetail(detail) || '请求参数错误';
  }

  return typeof detail === 'string' ? detail : `请求失败 (${status})`;
}

function resolveDetail(detail: any): string {
  if (!detail) return '';
  if (typeof detail === 'string') return detail;

  if (Array.isArray(detail)) {
    return detail.map((d: any) => {
      if (typeof d === 'string') return d;
      if (d?.msg) {
        const field = Array.isArray(d.loc) ? d.loc[d.loc.length - 1] : '';
        return field ? `${field}: ${d.msg}` : d.msg;
      }
      if (d?.message) return d.message;
      return JSON.stringify(d);
    }).join('; ');
  }

  if (typeof detail === 'object') {
    return Object.entries(detail)
      .map(([key, value]: [string, any]) => {
        if (Array.isArray(value)) return `${key}: ${value.join(', ')}`;
        return `${key}: ${value}`;
      })
      .join(', ');
  }

  return '';
}
