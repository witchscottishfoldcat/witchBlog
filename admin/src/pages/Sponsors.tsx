import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Eye,
  EyeOff,
  Heart,
  Banknote,
  Users,
} from 'lucide-react';
import { sponsorsApi, type Sponsor } from '../services/sponsorsApi';
import './Sponsors.css';

const SOURCE_META: Record<string, { label: string; badgeClass: string }> = {
  alipay: { label: '支付宝', badgeClass: 'wc-badge wc-badge-info' },
  wechat: { label: '微信', badgeClass: 'wc-badge wc-badge-success' },
  other: { label: '其他', badgeClass: 'wc-badge wc-badge-muted' },
};

const getSourceMeta = (source?: string | null) =>
  SOURCE_META[source || ''] || { label: source || '其他', badgeClass: 'wc-badge wc-badge-muted' };

function formatAmount(amount?: number | null): string {
  if (amount === null || amount === undefined) return '—';
  return `¥${amount.toFixed(2)}`;
}

function formatTime(value?: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString();
}

export default function Sponsors() {
  const [items, setItems] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSponsors();
  }, []);

  const loadSponsors = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await sponsorsApi.list();
      setItems(data.items || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载赞助鸣谢列表失败');
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (item: Sponsor) => {
    try {
      await sponsorsApi.update(item.id, { is_active: !item.is_active });
      setItems((prev) =>
        prev.map((it) => (it.id === item.id ? { ...it, is_active: !it.is_active } : it))
      );
    } catch (e) {
      alert(e instanceof Error ? `操作失败: ${e.message}` : '操作失败');
    }
  };

  const handleDelete = async (item: Sponsor) => {
    if (!window.confirm(`确定删除「${item.name}」的赞助记录吗？`)) return;
    try {
      await sponsorsApi.remove(item.id);
      setItems((prev) => prev.filter((it) => it.id !== item.id));
    } catch (e) {
      alert(e instanceof Error ? `删除失败: ${e.message}` : '删除失败');
    }
  };

  const totalAmount = items.reduce((sum, it) => sum + (it.amount ?? 0), 0);
  const activeCount = items.filter((it) => it.is_active).length;

  return (
    <div className="wc-page sponsors-page">
      <div className="wc-page-header">
        <div className="wc-page-heading">
          <span className="wc-accent-bar" />
          <div>
            <h1 className="wc-page-title">赞助鸣谢</h1>
            <p className="wc-page-subtitle">维护支持页的鸣谢列表，前台仅展示「展示中」的记录。</p>
          </div>
        </div>
        <div className="wc-page-actions">
          <Link to="/sponsors/new" className="wc-btn wc-btn-primary">
            <Plus size={15} /> 新增鸣谢
          </Link>
        </div>
      </div>

      {error && <div className="wc-alert wc-alert-error">{error}</div>}

      {loading ? (
        <div className="wc-loading">
          <Loader2 size={18} className="wc-spinner" /> 加载中...
        </div>
      ) : (
        <>
          <div className="sp-summary">
            <div className="wc-card wc-card-pad sp-summary-item">
              <Heart size={18} className="sp-summary-icon sp-summary-icon-heart" />
              <div>
                <p className="sp-summary-label">鸣谢人数</p>
                <p className="sp-summary-value">{items.length}</p>
              </div>
            </div>
            <div className="wc-card wc-card-pad sp-summary-item">
              <Users size={18} className="sp-summary-icon sp-summary-icon-users" />
              <div>
                <p className="sp-summary-label">展示中</p>
                <p className="sp-summary-value">{activeCount}</p>
              </div>
            </div>
            <div className="wc-card wc-card-pad sp-summary-item">
              <Banknote size={18} className="sp-summary-icon sp-summary-icon-money" />
              <div>
                <p className="sp-summary-label">累计金额</p>
                <p className="sp-summary-value">{formatAmount(totalAmount)}</p>
              </div>
            </div>
          </div>

          <div className="wc-card wc-card-pad">
            {items.length === 0 ? (
              <p className="sp-empty">还没有赞助记录，点右上角「新增鸣谢」添加第一条吧。</p>
            ) : (
              <div className="sp-table-wrap">
                <table className="sp-table">
                  <thead>
                    <tr>
                      <th>昵称</th>
                      <th>留言</th>
                      <th>金额</th>
                      <th>渠道</th>
                      <th>赞助时间</th>
                      <th>权重</th>
                      <th>状态</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => {
                      const meta = getSourceMeta(item.source);
                      return (
                        <tr key={item.id}>
                          <td className="sp-table-name">
                            {item.is_anonymous ? `${item.name}（匿名展示）` : item.name}
                          </td>
                          <td className="sp-table-message" title={item.message || ''}>
                            {item.message || '—'}
                          </td>
                          <td className="sp-table-amount">{formatAmount(item.amount)}</td>
                          <td>
                            <span className={meta.badgeClass}>{meta.label}</span>
                          </td>
                          <td className="sp-table-time">{formatTime(item.sponsored_at)}</td>
                          <td className="sp-table-order">{item.sort_order}</td>
                          <td>
                            <span className={`wc-badge ${item.is_active ? 'wc-badge-success' : 'wc-badge-muted'}`}>
                              {item.is_active ? '展示中' : '已隐藏'}
                            </span>
                          </td>
                          <td className="sp-table-actions">
                            <Link to={`/sponsors/${item.id}/edit`} className="wc-btn wc-btn-ghost wc-btn-sm">
                              <Pencil size={13} /> 编辑
                            </Link>
                            <button
                              type="button"
                              className="wc-btn wc-btn-ghost wc-btn-sm"
                              onClick={() => toggleActive(item)}
                            >
                              {item.is_active ? <EyeOff size={13} /> : <Eye size={13} />}
                              {item.is_active ? ' 隐藏' : ' 展示'}
                            </button>
                            <button
                              type="button"
                              className="wc-btn wc-btn-ghost wc-btn-sm sp-btn-danger"
                              onClick={() => handleDelete(item)}
                            >
                              <Trash2 size={13} /> 删除
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
