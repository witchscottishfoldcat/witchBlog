import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ShieldAlert, Loader2 } from 'lucide-react';
import { getCurrentUser, isAuthenticated } from '../utils/auth';
import { authReady } from '../config/api';
import type { User } from '../services/models/User';

interface SuperAdminRouteProps {
  children: React.ReactNode;
}

/**
 * 超级管理员路由守卫：仅放行 is_superuser 用户。
 * 权限的最终裁决在后端（401/403），这里只负责前端的引导与提示。
 */
export default function SuperAdminRoute({ children }: SuperAdminRouteProps) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let cancelled = false;
    void authReady.finally(async () => {
      if (isAuthenticated()) {
        try {
          const current = await getCurrentUser();
          if (!cancelled) setUser(current);
        } catch {
          // 401 由拦截器统一处理；其他错误按无权限呈现
        }
      }
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return (
      <div className="wc-loading">
        <Loader2 size={18} className="wc-spinner" />加载中...
      </div>
    );
  }

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (!user?.is_superuser) {
    return (
      <div className="wc-page">
        <div className="wc-empty">
          <span className="wc-empty-icon"><ShieldAlert size={28} strokeWidth={1.5} /></span>
          <p>仅超级管理员可访问此页面</p>
          <Link to="/dashboard" className="wc-btn wc-btn-primary">返回仪表板</Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
