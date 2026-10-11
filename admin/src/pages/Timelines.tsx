import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Plus, Calendar, MapPin, Clock, Wrench, Pencil, Trash2, Loader2 } from 'lucide-react';
import { Service } from '../services';
import type { TimelineResponse } from '../services/models/TimelineResponse';
import './Timelines.css';

export default function Timelines() {
  const location = useLocation();
  const [timelines, setTimelines] = useState<TimelineResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<'all' | 'my'>('all');
  const limit = 20;

  useEffect(() => {
    loadTimelines();
  }, [page, filter, location.key]);

  const loadTimelines = async () => {
    setLoading(true);
    try {
      if (filter === 'my') {
        const res = await Service.getMyTimelinesApiV1TimelinesMyTimelinesGet();
        const list = Array.isArray(res?.timelines) ? res.timelines : [];
        setTimelines(list);
        setTotal(res?.total ?? list.length);
        setLoading(false);
        return;
      }

      // 全部：合并「公开列表」和「我的」，去重后客户端分页
      const [resPublic, resMy] = await Promise.all([
        Service.getTimelinesApiV1TimelinesGet(0, 500, true, undefined, undefined),
        Service.getMyTimelinesApiV1TimelinesMyTimelinesGet(0, 500),
      ]);
      const listPublic = Array.isArray(resPublic?.timelines) ? resPublic.timelines : [];
      const listMy = Array.isArray(resMy?.timelines) ? resMy.timelines : [];
      const seen = new Set<number>();
      const merged: TimelineResponse[] = [];
      for (const t of listMy) {
        if (t.id != null && !seen.has(t.id)) {
          seen.add(t.id);
          merged.push(t);
        }
      }
      for (const t of listPublic) {
        if (t.id != null && !seen.has(t.id)) {
          seen.add(t.id);
          merged.push(t);
        }
      }
      merged.sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
      const skip = (page - 1) * limit;
      setTimelines(merged.slice(skip, skip + limit));
      setTotal(merged.length);
    } catch (error: any) {
      console.error('加载时间线失败:', error);
      console.error('错误详情:', error);
      console.error('错误响应:', error?.body || error?.response?.data);
      alert(`加载时间线失败: ${error?.message || error?.body?.detail || '未知错误'}`);
      setTimelines([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这条时间线吗？')) return;

    try {
      await Service.deleteTimelineApiV1TimelinesTimelineIdDelete(id);
      loadTimelines();
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败');
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="wc-page timelines-page">
      <header className="wc-page-header">
        <div className="wc-page-heading">
          <span className="wc-accent-bar" />
          <div>
            <h1 className="wc-page-title">时间线</h1>
            <p className="wc-page-subtitle">管理经历与事件时间线</p>
          </div>
        </div>
        <div className="wc-page-actions">
          <div className="wc-tabs">
            <button
              type="button"
              onClick={() => { setFilter('all'); setPage(1); }}
              className={`wc-tab${filter === 'all' ? ' wc-tab-active' : ''}`}
            >
              全部
            </button>
            <button
              type="button"
              onClick={() => { setFilter('my'); setPage(1); }}
              className={`wc-tab${filter === 'my' ? ' wc-tab-active' : ''}`}
            >
              我的
            </button>
          </div>
          <Link to="/timelines/new" className="wc-btn wc-btn-primary">
            <Plus size={16} /> 新建时间线
          </Link>
        </div>
      </header>

      {loading ? (
        <div className="wc-loading"><Loader2 size={18} className="wc-spinner" />加载中...</div>
      ) : timelines.length === 0 ? (
        <div className="wc-empty">
          <span className="wc-empty-icon"><Clock size={24} strokeWidth={1.5} /></span>
          <p>暂无时间线记录</p>
        </div>
      ) : (
        <div className="wc-list">
          {timelines.map((timeline) => (
            <div key={timeline.id} className="wc-list-row">
              <div className="wc-list-row-main">
                <h3 className="wc-list-row-title">{timeline.title}</h3>
                {timeline.subtitle && (
                  <p className="tl-subtitle">{timeline.subtitle}</p>
                )}
                {timeline.description && (
                  <p className="wc-list-row-desc tl-desc">{timeline.description}</p>
                )}
                <div className="wc-list-row-meta">
                  <span><Calendar size={14} /> {new Date(timeline.start_date).toLocaleDateString()}</span>
                  <span>- {timeline.end_date ? new Date(timeline.end_date).toLocaleDateString() : '至今'}</span>
                  {timeline.location && <span><MapPin size={14} /> {timeline.location}</span>}
                  {timeline.duration && <span><Clock size={14} /> {timeline.duration}</span>}
                </div>
                {timeline.tags && timeline.tags.length > 0 && (
                  <div className="wc-tag-row">
                    {timeline.tags.map((tag, i) => (
                      <span key={i} className="wc-tag">#{tag}</span>
                    ))}
                  </div>
                )}
                {timeline.skills && timeline.skills.length > 0 && (
                  <div className="wc-tag-row tl-skill-row">
                    {timeline.skills.map((skill, i) => (
                      <span key={i} className="wc-tag tl-skill-tag"><Wrench size={12} /> {skill}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="wc-list-row-actions">
                <Link to={`/timelines/${timeline.id}/edit`} className="wc-icon-btn" title="编辑">
                  <Pencil size={16} />
                </Link>
                <button
                  type="button"
                  className="wc-icon-btn wc-icon-btn-danger"
                  title="删除"
                  onClick={() => handleDelete(timeline.id)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="wc-pagination">
          <button
            type="button"
            className="wc-pagination-btn"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            上一页
          </button>
          <span className="wc-pagination-info">{page} / {totalPages}</span>
          <button
            type="button"
            className="wc-pagination-btn"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
}
