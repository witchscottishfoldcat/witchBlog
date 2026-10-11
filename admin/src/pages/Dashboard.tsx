import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  RefreshCw,
  ChevronRight,
  FileText,
  BookOpen,
  Link2,
  Users2,
  BarChart3,
  Settings,
  Sparkles,
  Calendar,
  Globe,
  Lock,
  Pencil,
  Send,
  Activity,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Service, MdService } from '../services';
import type { MDFile } from '../services/models/MDFile';
import { siteStatsApi, type SiteStatsOverview, type StatsPeriod } from '../services/siteStatsApi';
import { getCurrentUser } from '../utils/auth';
import { useToast } from '../components/Toast';
import type { User } from '../services/models/User';
import './Dashboard.css';

interface ChartRow {
  name: string;
  visitors: number;
  requests: number;
}

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

function formatDayLabel(dateStr: string, period: StatsPeriod): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  if (period === '7days') return WEEKDAYS[d.getDay()];
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="bento-chart-tooltip">
      <p className="bento-tooltip-label">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="bento-tooltip-row">
          <span className="bento-tooltip-dot" style={{ background: entry.color }} />
          <span className="bento-tooltip-name">{entry.name}</span>
          <span className="bento-tooltip-val">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState({ mdFiles: 0, diaries: 0, links: 0 });
  const [recentFiles, setRecentFiles] = useState<MDFile[]>([]);
  const [overview, setOverview] = useState<SiteStatsOverview | null>(null);
  // 服务健康状态：null=检测中，true=站点统计接口可达，false=不可达
  const [serviceOk, setServiceOk] = useState<boolean | null>(null);
  const [period, setPeriod] = useState<StatsPeriod>('7days');
  const [chartRows, setChartRows] = useState<ChartRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(true);

  // Quick Draft State
  const [quickDraft, setQuickDraft] = useState('');
  const [savingDraft, setSavingDraft] = useState(false);

  const toast = useToast();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadChart(period);
  }, [period]);

  const loadData = async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        getCurrentUser().catch(() => null),
        MdService.listMdFilesApiV1MdFilesGet(0, 4).catch(() => ({ total: 0, files: [] })),
        Service.getDiariesApiV1DiariesGet(0, 1).catch(() => ({ total: 0 })),
        Service.getLinksApiV1LinksGet(null, null, null, 0, 1).catch(() => []),
        siteStatsApi.getOverview().catch(() => null),
      ]);

      if (results[0].status === 'fulfilled' && results[0].value) setUser(results[0].value);

      const mdRes = results[1].status === 'fulfilled' ? (results[1].value as any) : { total: 0, files: [] };
      setRecentFiles(mdRes.files || []);
      setStats({
        mdFiles: mdRes.total || 0,
        diaries: results[2].status === 'fulfilled' ? ((results[2].value as any)?.total || 0) : 0,
        links: results[3].status === 'fulfilled' ? (Array.isArray(results[3].value) ? results[3].value.length : 0) : 0,
      });

      if (results[4].status === 'fulfilled') setOverview(results[4].value);
      setServiceOk(results[4].status === 'fulfilled' && !!results[4].value);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadChart = async (p: StatsPeriod) => {
    setChartLoading(true);
    try {
      const detailed = await siteStatsApi.getDetailed(p);
      const byDate = new Map<string, ChartRow>();
      (detailed.visitors_by_day || []).forEach((item) => {
        const row = byDate.get(item.date) || { name: formatDayLabel(item.date, p), visitors: 0, requests: 0 };
        row.visitors = Number(item.visits) || 0;
        byDate.set(item.date, row);
      });
      (detailed.requests_by_day || []).forEach((item) => {
        const row = byDate.get(item.date) || { name: formatDayLabel(item.date, p), visitors: 0, requests: 0 };
        row.requests = Number(item.requests) || 0;
        byDate.set(item.date, row);
      });
      const rows = [...byDate.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([, row]) => row);
      setChartRows(rows);
    } catch (e) {
      console.error('加载访问趋势失败:', e);
      setChartRows([]);
    } finally {
      setChartLoading(false);
    }
  };

  const handleRefresh = () => {
    loadData();
    loadChart(period);
    toast.success('数据已成功同步刷新');
  };

  const handleSaveDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickDraft.trim()) {
      toast.warning('请输入灵感或日记随想');
      return;
    }
    setSavingDraft(true);
    try {
      await Service.createDiaryApiV1DiariesPost({
        title: `随想草稿 · ${new Date().toLocaleDateString()}`,
        content: quickDraft,
        is_public: false,
      });
      toast.success('灵感已快速保存至私密日记');
      setQuickDraft('');
      loadData();
    } catch (e) {
      console.error(e);
      toast.error('保存失败，请稍后重试');
    } finally {
      setSavingDraft(false);
    }
  };

  const periodVisitors = chartRows.reduce((s, r) => s + r.visitors, 0);
  const totalContent = stats.mdFiles + stats.diaries + stats.links;

  const todayDateStr = new Date().toLocaleDateString('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  return (
    <div className="bento-dashboard-page">
      {/* 顶部 Hero 欢迎与快捷栏 */}
      <header className="bento-hero-header">
        <div className="bento-hero-left">
          <div className="bento-avatar-glow">
            <Sparkles size={20} />
          </div>
          <div>
            <h1 className="bento-hero-title">
              欢迎回来，<span className="bento-user-highlight">{user?.username || 'Admin'}</span>
            </h1>
            <p className="bento-hero-sub">
              <Calendar size={13} /> {todayDateStr} · {serviceOk === null ? '正在检查服务状态…' : serviceOk ? '系统运行一切正常' : '后端服务不可达'}
            </p>
          </div>
        </div>
        <div className="bento-hero-actions">
          <button type="button" className="bento-action-btn" onClick={handleRefresh} title="刷新数据">
            <RefreshCw size={15} /> 刷新
          </button>
          <Link to="/md-files/new" className="bento-action-primary">
            <Plus size={15} /> 新建文章
          </Link>
        </div>
      </header>

      {/* 顶层极简精致指标胶囊条 (Compact Bento Stat Strip) */}
      <div className="bento-stat-strip">
        <div className="bento-stat-pill">
          <span className="bento-pill-icon pill-indigo"><FileText size={15} /></span>
          <span className="bento-pill-label">文章</span>
          <span className="bento-pill-value">{loading ? '...' : stats.mdFiles}</span>
        </div>

        <div className="bento-stat-pill">
          <span className="bento-pill-icon pill-emerald"><BookOpen size={15} /></span>
          <span className="bento-pill-label">日记</span>
          <span className="bento-pill-value">{loading ? '...' : stats.diaries}</span>
        </div>

        <div className="bento-stat-pill">
          <span className="bento-pill-icon pill-cyan"><Link2 size={15} /></span>
          <span className="bento-pill-label">链接</span>
          <span className="bento-pill-value">{loading ? '...' : stats.links}</span>
        </div>

        <div className="bento-stat-pill">
          <span className="bento-pill-icon pill-amber"><Users2 size={15} /></span>
          <span className="bento-pill-label">今日访客</span>
          <span className="bento-pill-value">{loading ? '...' : (overview?.today_visitors ?? 0)}</span>
        </div>
      </div>

      {/* Bento Grid 非对称便当盒主阵列 */}
      <div className="bento-grid-container">
        {/* 左侧核心列 (2/3) */}
        <div className="bento-col-main">
          {/* 便当盒 1: 访问趋势 AreaChart */}
          <section className="bento-box bento-box-chart">
            <header className="bento-box-header">
              <div className="bento-title-wrap">
                <BarChart3 size={18} className="bento-icon-accent" />
                <div>
                  <h2 className="bento-box-title">访问趋势分析</h2>
                  <p className="bento-box-sub">真实访客与 HTTP 请求流统计</p>
                </div>
              </div>
              <div className="bento-period-tabs">
                <button
                  type="button"
                  className={`bento-tab ${period === '7days' ? 'active' : ''}`}
                  onClick={() => setPeriod('7days')}
                >
                  近 7 天
                </button>
                <button
                  type="button"
                  className={`bento-tab ${period === '30days' ? 'active' : ''}`}
                  onClick={() => setPeriod('30days')}
                >
                  近 30 天
                </button>
              </div>
            </header>
            <div className="bento-box-body">
              <div className="bento-chart-wrapper">
                {chartLoading ? (
                  <div className="wc-skeleton bento-skeleton-chart" />
                ) : chartRows.length === 0 ? (
                  <div className="wc-empty">暂无访问统计数据</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartRows} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="bentoVisitors" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#818cf8" stopOpacity={0.55} />
                          <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="bentoRequests" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.45} />
                          <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="rgba(255,255,255,0.06)" />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }}
                        dy={8}
                        interval={period === '30days' ? 4 : 0}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }}
                        allowDecimals={false}
                      />
                      <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.12)', strokeWidth: 1.5 }} />
                      <Area
                        type="monotone"
                        dataKey="visitors"
                        name="访客数"
                        stroke="#818cf8"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#bentoVisitors)"
                        activeDot={{ r: 5, fill: '#818cf8', stroke: '#fff', strokeWidth: 2 }}
                      />
                      <Area
                        type="monotone"
                        dataKey="requests"
                        name="请求数"
                        stroke="#2dd4bf"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#bentoRequests)"
                        activeDot={{ r: 5, fill: '#2dd4bf', stroke: '#fff', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </section>

          {/* 便当盒 2: 最新 Markdown 文章动态预览 (新增实效内容区) */}
          <section className="bento-box bento-box-recent">
            <header className="bento-box-header">
              <div className="bento-title-wrap">
                <FileText size={18} className="bento-icon-accent" />
                <div>
                  <h2 className="bento-box-title">最新 Markdown 文章</h2>
                  <p className="bento-box-sub">近期发布与创作的内容条目</p>
                </div>
              </div>
              <Link to="/md-files" className="bento-more-link">
                查看全部 <ChevronRight size={14} />
              </Link>
            </header>
            <div className="bento-box-body">
              {loading ? (
                <div className="bento-recent-skeleton-list">
                  <div className="wc-skeleton bento-skeleton-item" />
                  <div className="wc-skeleton bento-skeleton-item" />
                  <div className="wc-skeleton bento-skeleton-item" />
                </div>
              ) : recentFiles.length === 0 ? (
                <div className="wc-empty" style={{ padding: '2rem' }}>
                  暂无已发布的文章，点击右上角新建第一篇吧
                </div>
              ) : (
                <div className="bento-recent-list">
                  {recentFiles.map((file) => (
                    <article key={file.id} className="bento-recent-card">
                      <div className="bento-recent-main">
                        <div className="bento-recent-head">
                          <h3 className="bento-recent-title">{file.title}</h3>
                          <span className={file.is_public ? 'bento-badge-pub' : 'bento-badge-priv'}>
                            {file.is_public ? <Globe size={11} /> : <Lock size={11} />}
                            {file.is_public ? '公开' : '私有'}
                          </span>
                        </div>
                        <p className="bento-recent-desc">{file.description || '无详细描述'}</p>
                        <div className="bento-recent-meta">
                          <span><Calendar size={12} /> {new Date(file.created_at).toLocaleDateString()}</span>
                          <span><FileText size={12} /> {file.word_count} 字</span>
                          {file.tags && (
                            <span className="bento-recent-tags">
                              {file.tags.split(',').slice(0, 2).map((t, idx) => (
                                <span key={idx} className="bento-mini-tag">{t.trim()}</span>
                              ))}
                            </span>
                          )}
                        </div>
                      </div>
                      <Link to={`/md-files/${file.id}/edit`} className="bento-recent-edit-btn" title="编辑文章">
                        <Pencil size={15} />
                      </Link>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* 右侧侧边列 (1/3) */}
        <div className="bento-col-side">
          {/* 便当盒 3: 灵感速记 / 快捷日记草稿小组件 (新增) */}
          <section className="bento-box bento-box-draft">
            <header className="bento-box-header">
              <div className="bento-title-wrap">
                <Send size={16} className="bento-icon-accent" />
                <h2 className="bento-box-title">灵感随手记</h2>
              </div>
              <span className="bento-badge-pill">快捷小记</span>
            </header>
            <form onSubmit={handleSaveDraft} className="bento-draft-form">
              <textarea
                className="bento-draft-textarea"
                placeholder="在此快速记录瞬时灵感或日记点滴..."
                value={quickDraft}
                onChange={(e) => setQuickDraft(e.target.value)}
              />
              <div className="bento-draft-footer">
                <span className="bento-draft-hint">直接存入私密日记</span>
                <button type="submit" className="bento-draft-submit" disabled={savingDraft}>
                  {savingDraft ? '保存中...' : '保存灵感'}
                </button>
              </div>
            </form>
          </section>

          {/* 便当盒 4: 内容占比与健康度进度 */}
          <section className="bento-box bento-box-status">
            <header className="bento-box-header">
              <div className="bento-title-wrap">
                <Activity size={16} className="bento-icon-accent" />
                <h2 className="bento-box-title">服务运行与存储</h2>
              </div>
              <span
                className={`bento-status-dot-pulse${serviceOk === false ? ' bento-status-dot-error' : ''}`}
                title={serviceOk === false ? '后端服务不可达' : '运行正常'}
              >
                {serviceOk === null ? '● 检测中' : serviceOk ? '● 正常' : '● 异常'}
              </span>
            </header>
            <div className="bento-status-body">
              <div className="bento-progress-head">
                <span>内容分布结构</span>
                <span>{totalContent} 项总内容</span>
              </div>
              <div className="bento-progress-track">
                <div
                  className="bento-progress-bar bar-indigo"
                  style={{ width: `${totalContent > 0 ? (stats.mdFiles / totalContent) * 100 : 33}%` }}
                  title={`文章: ${stats.mdFiles}`}
                />
                <div
                  className="bento-progress-bar bar-emerald"
                  style={{ width: `${totalContent > 0 ? (stats.diaries / totalContent) * 100 : 33}%` }}
                  title={`日记: ${stats.diaries}`}
                />
                <div
                  className="bento-progress-bar bar-cyan"
                  style={{ width: `${totalContent > 0 ? (stats.links / totalContent) * 100 : 34}%` }}
                  title={`链接: ${stats.links}`}
                />
              </div>

              <div className="bento-status-rows">
                <div className="bento-status-row">
                  <span className="bento-row-key">已持续运行</span>
                  <span className="bento-row-val">{overview ? `${overview.uptime_days}天 ${overview.uptime_hours}小时` : '-'}</span>
                </div>
                <div className="bento-status-row">
                  <span className="bento-row-key">{period === '7days' ? '本周' : '本月'}累计访客</span>
                  <span className="bento-row-val val-highlight">{chartLoading ? '...' : periodVisitors} 次</span>
                </div>
              </div>
            </div>
          </section>

          {/* 便当盒 5: 快捷入口 Tiles */}
          <nav className="bento-box bento-box-tiles">
            <header className="bento-box-header">
              <div className="bento-title-wrap">
                <Layers size={16} className="bento-icon-accent" />
                <h2 className="bento-box-title">常用模块</h2>
              </div>
            </header>
            <div className="bento-tiles-grid">
              <Link to="/md-files" className="bento-tile-item">
                <span className="bento-tile-icon"><FileText size={18} /></span>
                <span className="bento-tile-name">Markdown 文章</span>
                <ArrowUpRight size={14} className="bento-tile-arrow" />
              </Link>
              <Link to="/diaries" className="bento-tile-item">
                <span className="bento-tile-icon"><BookOpen size={18} /></span>
                <span className="bento-tile-name">私密日记</span>
                <ArrowUpRight size={14} className="bento-tile-arrow" />
              </Link>
              <Link to="/site-config" className="bento-tile-item">
                <span className="bento-tile-icon"><Settings size={18} /></span>
                <span className="bento-tile-name">全局配置</span>
                <ArrowUpRight size={14} className="bento-tile-arrow" />
              </Link>
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
}
