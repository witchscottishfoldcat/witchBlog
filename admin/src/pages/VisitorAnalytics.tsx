import { useEffect, useMemo, useState } from 'react';
import {
  Users,
  Activity,
  RefreshCw,
  MapPin,
  Clock,
  Map as MapIcon,
  TrendingUp,
  Timer,
  PieChart as PieChartIcon,
  FileText,
  Flame,
  ExternalLink,
  Bot,
  Globe2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import { siteStatsApi, type VisitorStats, type VisitorStatsDays } from '../services/siteStatsApi';
import GeoDistributionMap from '../components/GeoDistributionMap';
import './VisitorAnalytics.css';

const DAY_OPTIONS: VisitorStatsDays[] = [7, 30];

const COLOR_VISITORS = '#818cf8';
const COLOR_REQUESTS = '#2dd4bf';

function formatDateTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function formatDayLabel(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  if (days <= 7) {
    return ['日', '一', '二', '三', '四', '五', '六'][d.getDay()];
  }
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

/** 环比：与上一同长周期对比 */
function deltaInfo(current: number, previous?: number | null) {
  if (!previous) return null;
  const pct = ((current - previous) / previous) * 100;
  const text = `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
  return { text, up: pct >= 0 };
}

interface VaTipPayload {
  dataKey: string | number;
  name: string;
  value: number | string;
  color?: string;
}

function VaChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: VaTipPayload[];
  label?: string | number;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="va-tip">
      <p className="va-tip-label">{label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="va-tip-row">
          <span className="va-tip-dot" style={{ background: entry.color }} />
          <span className="va-tip-name">{entry.name}</span>
          <span className="va-tip-val">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

type VaTabKey = 'trend' | 'content' | 'source' | 'detail';

const VA_TABS: Array<{ key: VaTabKey; label: string; icon: typeof TrendingUp }> = [
  { key: 'trend', label: '流量趋势', icon: TrendingUp },
  { key: 'content', label: '内容消费', icon: FileText },
  { key: 'source', label: '来源地域', icon: Globe2 },
  { key: 'detail', label: '访客明细', icon: Users },
];

export default function VisitorAnalytics() {
  const [days, setDays] = useState<VisitorStatsDays>(7);
  const [tab, setTab] = useState<VaTabKey>('trend');
  const [stats, setStats] = useState<VisitorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = async (selectedDays: VisitorStatsDays) => {
    setLoading(true);
    setError(null);
    try {
      const data = await siteStatsApi.getVisitors(selectedDays);
      setStats(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载访客统计失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats(days);
  }, [days]);

  const trend = useMemo(() => stats?.trend ?? [], [stats]);
  const hourly = useMemo(() => stats?.hourly ?? [], [stats]);
  const sections = useMemo(() => stats?.page_sections ?? [], [stats]);
  const topPages = useMemo(() => stats?.top_pages ?? [], [stats]);
  const referrers = useMemo(() => stats?.referrers ?? [], [stats]);

  const visitorsDelta = deltaInfo(stats?.unique_visitors ?? 0, stats?.previous_period?.unique_visitors);
  const requestsDelta = deltaInfo(stats?.total_requests ?? 0, stats?.previous_period?.total_requests);

  /** 峰值日（请求数最高的一天） */
  const peakDay = useMemo(
    () => trend.reduce((best, item) => (item.requests > (best?.requests ?? -1) ? item : best), null as null | (typeof trend)[number]),
    [trend]
  );
  /** 高峰时段（独立访客最高的小时） */
  const peakHour = useMemo(
    () => hourly.reduce((best, item) => (item.unique_visitors > (best?.unique_visitors ?? -1) ? item : best), null as null | (typeof hourly)[number]),
    [hourly]
  );

  const maxSectionVisitors = Math.max(...sections.map((s) => s.unique_visitors), 1);
  const maxPageVisitors = Math.max(...topPages.map((p) => p.unique_visitors), 1);
  const maxRefRequests = Math.max(...referrers.map((r) => r.requests), 1);
  const maxLocationVisitors = stats
    ? Math.max(...stats.locations.map((item) => item.unique_visitors), 1)
    : 1;

  const breakdown = stats?.traffic_breakdown ?? null;
  const humanShare =
    breakdown && breakdown.human_requests + breakdown.bot_requests > 0
      ? Math.round((breakdown.human_requests / (breakdown.human_requests + breakdown.bot_requests)) * 100)
      : null;

  const referrerTotals = useMemo(() => {
    const totals: Record<string, { requests: number; visitors: number }> = {};
    for (const item of referrers) {
      const bucket = (totals[item.referrer_type] ??= { requests: 0, visitors: 0 });
      bucket.requests += item.requests;
      bucket.visitors += item.unique_visitors;
    }
    return totals;
  }, [referrers]);
  const referrerTypeTotal = Object.values(referrerTotals).reduce((sum, t) => sum + t.requests, 0);

  const referrerTypeMeta: Array<{ key: string; label: string }> = [
    { key: 'direct', label: '直接访问' },
    { key: 'search', label: '搜索引擎' },
    { key: 'external', label: '外部链接' },
  ];

  return (
    <div className="wc-page visitor-analytics-page">
      <header className="wc-page-header">
        <div className="wc-page-heading">
          <div className="wc-accent-bar" />
          <div>
            <h1 className="wc-page-title">访客分析</h1>
            <p className="wc-page-subtitle">流量趋势、访问时段、内容消费与来源构成（已排除服务器自身流量）</p>
          </div>
        </div>
        <div className="wc-page-actions">
          <div className="wc-tabs">
            {DAY_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                className={`wc-tab ${days === option ? 'active' : ''}`}
                onClick={() => setDays(option)}
              >
                近 {option} 天
              </button>
            ))}
          </div>
          <button
            type="button"
            className="wc-btn wc-btn-secondary"
            onClick={() => loadStats(days)}
            disabled={loading}
          >
            <RefreshCw size={15} className={loading ? 'va-spinning' : ''} />
            刷新
          </button>
        </div>
      </header>

      {error && (
        <div className="wc-card wc-card-pad va-error">
          <p className="va-error-text">{error}</p>
          <button type="button" className="wc-btn wc-btn-secondary" onClick={() => loadStats(days)}>
            重试
          </button>
        </div>
      )}

      {!error && loading && !stats && <div className="wc-card wc-card-pad va-loading">加载中…</div>}

      {stats && (
        <>
          {/* ---------- 概览：核心指标 + 环比 ---------- */}
          <div className="va-overview">
            <div className="wc-card wc-card-pad va-overview-item">
              <div className="va-overview-icon va-overview-icon-visitors">
                <Users size={20} />
              </div>
              <div>
                <p className="va-overview-label">
                  独立访客
                  {visitorsDelta && (
                    <span className={`va-delta ${visitorsDelta.up ? 'va-delta-up' : 'va-delta-down'}`}>
                      {visitorsDelta.up ? '▲' : '▼'} {visitorsDelta.text}
                    </span>
                  )}
                </p>
                <p className="va-overview-value">{stats.unique_visitors}</p>
                <p className="va-overview-sub">近 {stats.days} 天去重 IP，环比上 {stats.days} 天</p>
              </div>
            </div>
            <div className="wc-card wc-card-pad va-overview-item">
              <div className="va-overview-icon va-overview-icon-requests">
                <Activity size={20} />
              </div>
              <div>
                <p className="va-overview-label">
                  总请求
                  {requestsDelta && (
                    <span className={`va-delta ${requestsDelta.up ? 'va-delta-up' : 'va-delta-down'}`}>
                      {requestsDelta.up ? '▲' : '▼'} {requestsDelta.text}
                    </span>
                  )}
                </p>
                <p className="va-overview-value">{stats.total_requests.toLocaleString()}</p>
                <p className="va-overview-sub">
                  日均 {Math.round(stats.total_requests / stats.days).toLocaleString()} 次
                </p>
              </div>
            </div>
            <div className="wc-card wc-card-pad va-overview-item">
              <div className="va-overview-icon va-overview-icon-peak">
                <TrendingUp size={20} />
              </div>
              <div>
                <p className="va-overview-label">峰值日</p>
                <p className="va-overview-value">
                  {peakDay && peakDay.requests > 0 ? peakDay.requests.toLocaleString() : '—'}
                </p>
                <p className="va-overview-sub">
                  {peakDay && peakDay.requests > 0 ? `${peakDay.date} 单日请求` : '该时间段暂无请求'}
                </p>
              </div>
            </div>
            <div className="wc-card wc-card-pad va-overview-item">
              <div className="va-overview-icon va-overview-icon-hour">
                <Timer size={20} />
              </div>
              <div>
                <p className="va-overview-label">访问高峰时段</p>
                <p className="va-overview-value">
                  {peakHour && peakHour.unique_visitors > 0 ? `${peakHour.hour}:00` : '—'}
                </p>
                <p className="va-overview-sub">
                  {peakHour && peakHour.unique_visitors > 0
                    ? `该时段 ${peakHour.unique_visitors} 位访客到访`
                    : '该时间段暂无访客'}
                </p>
              </div>
            </div>
          </div>

          {/* ---------- 维度标签页 ---------- */}
          <div className="va-tabbar">
            <div className="wc-tabs" role="tablist">
              {VA_TABS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  role="tab"
                  aria-selected={tab === item.key}
                  className={`wc-tab ${tab === item.key ? 'active' : ''}`}
                  onClick={() => setTab(item.key)}
                >
                  <item.icon size={14} />
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {tab === 'trend' && (
            <>
          {/* ---------- 流量趋势 ---------- */}
          <section className="wc-card va-section">
            <div className="wc-card-header">
              <h2 className="wc-card-title">
                <Activity size={16} /> 流量趋势
              </h2>
              <span className="wc-card-subtitle">柱 = 请求数，线 = 独立访客</span>
            </div>
            <div className="wc-card-body">
              {trend.length === 0 ? (
                <p className="va-empty">该时间段暂无访客数据</p>
              ) : (
                <div className="va-chart-lg">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={trend} margin={{ top: 10, right: 0, left: -18, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="rgba(255,255,255,0.06)" />
                      <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }}
                        dy={8}
                        tickFormatter={(d: string) => formatDayLabel(d, days)}
                      />
                      <YAxis
                        yAxisId="req"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }}
                        allowDecimals={false}
                      />
                      <YAxis
                        yAxisId="uv"
                        orientation="right"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }}
                        allowDecimals={false}
                        width={36}
                      />
                      <Tooltip
                        content={<VaChartTooltip />}
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      />
                      <Bar
                        yAxisId="req"
                        dataKey="requests"
                        name="请求数"
                        fill={COLOR_REQUESTS}
                        fillOpacity={0.55}
                        radius={[4, 4, 0, 0]}
                        maxBarSize={28}
                      />
                      <Line
                        yAxisId="uv"
                        type="monotone"
                        dataKey="unique_visitors"
                        name="独立访客"
                        stroke={COLOR_VISITORS}
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: COLOR_VISITORS, strokeWidth: 0 }}
                        activeDot={{ r: 5, fill: COLOR_VISITORS, stroke: '#fff', strokeWidth: 2 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </section>

          {/* ---------- 时段分布 + 流量构成 ---------- */}
          <div className="va-grid-2">
            <section className="wc-card va-section">
              <div className="wc-card-header">
                <h2 className="wc-card-title">
                  <Clock size={16} /> 访问时段分布
                </h2>
                <span className="wc-card-subtitle">按小时聚合，找出一天的访问高峰</span>
              </div>
              <div className="wc-card-body">
                {hourly.every((h) => h.requests === 0) ? (
                  <p className="va-empty">该时间段暂无访客数据</p>
                ) : (
                  <div className="va-chart-md">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={hourly} margin={{ top: 10, right: 0, left: -22, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="rgba(255,255,255,0.06)" />
                        <XAxis
                          dataKey="hour"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
                          dy={8}
                          tickFormatter={(h: number) => `${h}时`}
                          interval={2}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }}
                          allowDecimals={false}
                        />
                        <Tooltip
                          content={<VaChartTooltip />}
                          cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                          labelFormatter={(label) => `${label}:00 - ${Number(label) + 1}:00`}
                        />
                        <Bar dataKey="unique_visitors" name="独立访客" radius={[3, 3, 0, 0]} maxBarSize={18}>
                          {hourly.map((item) => (
                            <Cell
                              key={item.hour}
                              fill={item.hour === peakHour?.hour ? COLOR_REQUESTS : COLOR_VISITORS}
                              fillOpacity={item.hour === peakHour?.hour ? 0.95 : 0.55}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </section>

            <section className="wc-card va-section">
              <div className="wc-card-header">
                <h2 className="wc-card-title">
                  <PieChartIcon size={16} /> 流量构成
                </h2>
                <span className="wc-card-subtitle">真人访客 vs 搜索引擎爬虫</span>
              </div>
              <div className="wc-card-body">
                {!breakdown || breakdown.human_requests + breakdown.bot_requests === 0 ? (
                  <p className="va-empty">该时间段暂无访客数据</p>
                ) : (
                  <div className="va-breakdown">
                    <div className="va-breakdown-bar">
                      <div className="va-breakdown-human" style={{ width: `${humanShare}%` }} />
                      <div className="va-breakdown-bot" style={{ width: `${100 - (humanShare ?? 0)}%` }} />
                    </div>
                    <div className="va-breakdown-legend">
                      <span className="va-breakdown-chip">
                        <i className="va-dot va-dot-human" />
                        真人 {humanShare}%
                      </span>
                      <span className="va-breakdown-chip">
                        <i className="va-dot va-dot-bot" />
                        爬虫 {100 - (humanShare ?? 0)}%
                      </span>
                    </div>
                    <div className="va-breakdown-rows">
                      <div className="va-breakdown-row">
                        <span className="va-breakdown-name">
                          <Users size={14} /> 真人访客
                        </span>
                        <span className="va-breakdown-num">
                          {breakdown.human_visitors} 位 · {breakdown.human_requests.toLocaleString()} 次请求
                        </span>
                      </div>
                      <div className="va-breakdown-row">
                        <span className="va-breakdown-name">
                          <Bot size={14} /> 爬虫 / 机器流量
                        </span>
                        <span className="va-breakdown-num">
                          {breakdown.bot_visitors} 个 IP · {breakdown.bot_requests.toLocaleString()} 次请求
                        </span>
                      </div>
                    </div>
                    <p className="va-breakdown-note">按 User-Agent 判定，重启后开始采集 UA</p>
                  </div>
                )}
              </div>
            </section>
          </div>

            </>
          )}

          {tab === 'content' && (
            <>
          {/* ---------- 内容板块 + 热门接口 ---------- */}
          <div className="va-grid-2">
            <section className="wc-card va-section">
              <div className="wc-card-header">
                <h2 className="wc-card-title">
                  <FileText size={16} /> 内容板块分布
                </h2>
                <span className="wc-card-subtitle">访客在消费哪类内容</span>
              </div>
              <div className="wc-card-body">
                {sections.length === 0 ? (
                  <p className="va-empty">该时间段暂无访客数据</p>
                ) : (
                  <div className="va-bar-list">
                    {sections.map((item) => (
                      <div key={item.section} className="va-bar-row">
                        <span className="va-bar-name" title={item.section}>
                          {item.section}
                        </span>
                        <div className="va-bar-track">
                          <div
                            className="va-bar-fill"
                            style={{ width: `${(item.unique_visitors / maxSectionVisitors) * 100}%` }}
                          />
                        </div>
                        <span className="va-bar-val">{item.unique_visitors} 位</span>
                        <span className="va-bar-sub">{item.requests.toLocaleString()} 次</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <section className="wc-card va-section">
              <div className="wc-card-header">
                <h2 className="wc-card-title">
                  <Flame size={16} /> 热门接口 TOP {topPages.length}
                </h2>
                <span className="wc-card-subtitle">按独立访客排序（已排除后台轮询）</span>
              </div>
              <div className="wc-card-body">
                {topPages.length === 0 ? (
                  <p className="va-empty">该时间段暂无访客数据</p>
                ) : (
                  <div className="va-bar-list">
                    {topPages.map((item) => (
                      <div key={item.path} className="va-bar-row">
                        <span className="va-bar-name va-bar-path" title={item.path}>
                          {item.path}
                        </span>
                        <div className="va-bar-track">
                          <div
                            className="va-bar-fill va-bar-fill-teal"
                            style={{ width: `${(item.unique_visitors / maxPageVisitors) * 100}%` }}
                          />
                        </div>
                        <span className="va-bar-val">{item.unique_visitors} 位</span>
                        <span className="va-bar-sub">{item.requests.toLocaleString()} 次</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>

            </>
          )}

          {tab === 'source' && (
            <>
          {/* ---------- 来源分析 + 归属地分布 ---------- */}
          <div className="va-grid-2">
            <section className="wc-card va-section">
              <div className="wc-card-header">
                <h2 className="wc-card-title">
                  <ExternalLink size={16} /> 来源分析
                </h2>
                <span className="wc-card-subtitle">访客从哪里来（按域名聚合）</span>
              </div>
              <div className="wc-card-body">
                {referrers.length === 0 ? (
                  <p className="va-empty">该时间段暂无来源数据</p>
                ) : (
                  <>
                    <div className="va-ref-types">
                      {referrerTypeMeta.map(({ key, label }) => {
                        const total = referrerTotals[key]?.requests ?? 0;
                        const pct = referrerTypeTotal > 0 ? Math.round((total / referrerTypeTotal) * 100) : 0;
                        return (
                          <div key={key} className="va-ref-type">
                            <span className="va-ref-type-label">{label}</span>
                            <span className="va-ref-type-pct">{pct}%</span>
                            <span className="va-ref-type-num">{total.toLocaleString()} 次</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="va-bar-list">
                      {referrers.map((item) => (
                        <div key={`${item.referrer_type}:${item.domain}`} className="va-bar-row">
                          <span className="va-bar-name" title={item.domain || '直接访问（无 Referer）'}>
                            {item.domain || '直接访问'}
                          </span>
                          <div className="va-bar-track">
                            <div
                              className="va-bar-fill va-bar-fill-amber"
                              style={{ width: `${(item.requests / maxRefRequests) * 100}%` }}
                            />
                          </div>
                          <span className="va-bar-val">{item.unique_visitors} 位</span>
                          <span className="va-bar-sub">{item.requests.toLocaleString()} 次</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </section>

            <section className="wc-card va-section">
              <div className="wc-card-header">
                <h2 className="wc-card-title">
                  <MapPin size={16} /> IP 归属地分布
                </h2>
                <span className="wc-card-subtitle">按独立访客数排序</span>
              </div>
              <div className="wc-card-body va-location-list">
                {stats.locations.length === 0 && <p className="va-empty">该时间段暂无访客数据</p>}
                {stats.locations.map((item) => (
                  <div key={item.location} className="va-location-row">
                    <span className="va-location-name" title={item.location}>
                      {item.location}
                    </span>
                    <div className="va-location-bar-track">
                      <div
                        className="va-location-bar"
                        style={{ width: `${(item.unique_visitors / maxLocationVisitors) * 100}%` }}
                      />
                    </div>
                    <span className="va-location-visitors" title="独立访客">
                      {item.unique_visitors} 位
                    </span>
                    <span className="va-location-requests" title="请求次数">
                      {item.requests.toLocaleString()} 次
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* ---------- 分布地图 ---------- */}
          <section className="wc-card va-section">
            <div className="wc-card-header">
              <h2 className="wc-card-title">
                <MapIcon size={16} /> 访客分布地图
              </h2>
              <span className="wc-card-subtitle">颜色深浅 = 独立访客数</span>
            </div>
            <div className="wc-card-body">
              <GeoDistributionMap
                provinces={stats.province_distribution}
                countries={stats.country_distribution}
              />
              <div className="va-map-summary">
                {stats.country_distribution
                  .filter((item) => item.country === '本地网络' || item.country === '未知')
                  .map((item) => (
                    <span key={item.country} className="va-map-summary-item">
                      {item.country} {item.unique_visitors} 位
                    </span>
                  ))}
              </div>
            </div>
          </section>

            </>
          )}

          {tab === 'detail' && (
            <>
          {/* ---------- 活跃 IP ---------- */}
          <section className="wc-card va-section">
            <div className="wc-card-header">
              <h2 className="wc-card-title">
                <Users size={16} /> 活跃访客 Top {stats.top_ips.length}
              </h2>
              <span className="wc-card-subtitle">按请求次数排序，最多 20 条</span>
            </div>
            <div className="wc-card-body">
              {stats.top_ips.length === 0 && <p className="va-empty">该时间段暂无访客数据</p>}
              {stats.top_ips.length > 0 && (
                <div className="va-table-wrap">
                  <table className="va-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>IP 地址</th>
                        <th>归属地</th>
                        <th>请求数</th>
                        <th>首次访问</th>
                        <th>最近访问</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.top_ips.map((item, index) => (
                        <tr key={item.ip}>
                          <td className="va-table-rank">{index + 1}</td>
                          <td className="va-table-ip">{item.ip}</td>
                          <td>{item.location}</td>
                          <td className="va-table-requests">{item.requests.toLocaleString()}</td>
                          <td className="va-table-time">{formatDateTime(item.first_seen)}</td>
                          <td className="va-table-time">{formatDateTime(item.last_seen)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
            </>
          )}
        </>
      )}
    </div>
  );
}
