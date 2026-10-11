import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Mail, Calendar, Crown, User as UserIcon, Pencil, Trash2, Loader2 } from 'lucide-react';
import { Service } from '../services';
import type { User as UserModel } from '../services/models/User';
import { useToast } from '../components/Toast';
import { ConfirmModal } from '../components/Modal';
import './Users.css';

export default function Users() {
  const [users, setUsers] = useState<UserModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  // 后端列表接口不返回总数：当前页满页时假定还有下一页
  const [hasMore, setHasMore] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  const toast = useToast();
  const limit = 20;

  useEffect(() => {
    loadUsers();
  }, [page]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const skip = (page - 1) * limit;
      const response = await Service.readUsersApiV1UsersGet(skip, limit);
      const list = Array.isArray(response) ? response : [];
      setUsers(list);
      setHasMore(list.length === limit);
    } catch (error) {
      console.error('加载用户失败:', error);
      toast.error('加载用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await Service.deleteUserApiV1UsersUserIdDelete(deleteTargetId);
      toast.success('用户已成功删除');
      // 删掉当前页最后一条且不是第一页时回退一页，否则原地重载
      if (users.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        loadUsers();
      }
    } catch (error) {
      console.error('删除失败:', error);
      toast.error('删除用户失败');
    } finally {
      setDeleteTargetId(null);
    }
  };

  const renderUserRow = (user: UserModel) => (
    <div key={user.id} className="wc-list-row">
      <div className="wc-list-row-main">
        <h3 className="wc-list-row-title">{user.username}</h3>
        <p className="wc-list-row-desc"><Mail size={14} /> {user.email || '无邮箱'}</p>
        <div className="wc-list-row-meta">
          <span className="user-id">ID: {user.id}</span>
          <span className={user.is_superuser ? 'wc-badge wc-badge-warning' : 'wc-badge wc-badge-muted'}>
            {user.is_superuser ? <><Crown size={10} /> 超级用户</> : <><UserIcon size={10} /> 普通用户</>}
          </span>
          <span><Calendar size={12} /> {new Date(user.created_at).toLocaleDateString()}</span>
        </div>
      </div>
      <div className="wc-list-row-actions">
        <Link to={`/users/${user.id}/edit`} className="wc-icon-btn" title="编辑"><Pencil size={15} /></Link>
        <button type="button" className="wc-icon-btn wc-icon-btn-danger" onClick={() => setDeleteTargetId(user.id)} title="删除"><Trash2 size={15} /></button>
      </div>
    </div>
  );

  return (
    <div className="wc-page users-page">
      <header className="wc-page-header">
        <div className="wc-page-heading">
          <span className="wc-accent-bar" />
          <div>
            <h1 className="wc-page-title">用户管理</h1>
            <p className="wc-page-subtitle">管理系统用户与权限。</p>
          </div>
        </div>
        <div className="wc-page-actions">
          <Link to="/users/new" className="wc-btn wc-btn-primary"><Plus size={14} /> 新建用户</Link>
        </div>
      </header>

      {loading ? (
        <div className="wc-loading"><Loader2 size={18} className="wc-spinner" />加载中...</div>
      ) : (
        <>
          <div className="wc-list">
            {users.length === 0 ? (
              <div className="wc-empty">
                <span className="wc-empty-icon"><UserIcon size={24} strokeWidth={1.5} /></span>
                <p>暂无用户</p>
              </div>
            ) : (
              users.map(renderUserRow)
            )}
          </div>

          {(page > 1 || hasMore) && (
            <div className="wc-pagination">
              <button type="button" className="wc-pagination-btn" disabled={page === 1 || loading} onClick={() => setPage(page - 1)}>上一页</button>
              <span className="wc-pagination-info">第 {page} 页</span>
              <button type="button" className="wc-pagination-btn" disabled={!hasMore || loading} onClick={() => setPage(page + 1)}>下一页</button>
            </div>
          )}
        </>
      )}

      {/* 删除确认弹窗 */}
      <ConfirmModal
        isOpen={deleteTargetId !== null}
        title="确认删除用户"
        message="确定要删除这个用户吗？此操作无法恢复。"
        variant="danger"
        confirmText="删除用户"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
}
