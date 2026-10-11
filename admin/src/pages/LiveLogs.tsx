import { useCallback, useEffect, useRef, useState } from 'react';
import { Radio, Pause, Play, Trash2 } from 'lucide-react';
import {
  siteStatsApi,
  type LiveLogItem,
} from '../services/siteStatsApi';
import BackendLogStream from '../components/BackendLogStream';
import './LiveLogs.css';

type LogTab = 'backend' | 'access';

/** 轮询间隔（毫秒）：后端日志写入本身有最多 ~2s 的批量落盘延迟 */
const POLL_INTERVAL_MS = 3000;
/** 页面最多保留的日志行数，防止长时间驻留内存无限增长 */
const MAX_ROWS = 300;
/** 新行高亮持续时间 */
const NEW_ROW_HIGHLIGHT_MS = 2500;

/** 行数据：isNew 用于新到日志的短暂高亮 */
interface LogRow extends LiveLogItem {
  isNew: boolean;
}

function formatTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleTimeString('zh-CN', { hour12: false });
}

function methodClass(method: string): string {
  const m = method.toUpperCase();
  if (m === 'GET') return 'is-get';
  if (m === 'POST') return 'is-post';
  if (m === 'PUT' || m === 'PATCH') return 'is-put';
  if (m === 'DELETE') return 'is-delete';
  return 'is-other';
}

/** 访问请求流：基于 request_logs 表的游标轮询 */
function AccessLogFeed() {
  const [rows, setRows] = useState<LogRow[]>([]);
  const [paused, setPaused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // 轮询游标与并发守卫放 ref，避免进依赖数组导致定时器反复重建
  const lastIdRef = useRef(0);
  const pollingRef = useRef(false);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const highlightTimerRef = useRef<number | null>(null);

  const poll = useCallback(async () => {
    if (pollingRef.current) return;
    pollingRef.current = true;
    try {
      const data = await siteStatsApi.getLiveLogs(lastIdRef.current, 100);
      lastIdRef.current = data.last_id;
      setError(null);
      setLastUpdated(new Date().toLocaleTimeString('zh-CN', { hour12: false }));
      if (data.logs.length === 0) return;

      // 统一新→旧排序后合并；标记本批新行用于高亮
      const incoming: LogRow[] = data.logs
        .map((item) => ({ ...item, isNew: true }))
        .sort((a, b) => b.id - a.id);
      setRows((prev) => {
        const merged = [...incoming, ...prev].slice(0, MAX_ROWS);
        return merged;
      });
      if (highlightTimerRef.current) window.clearTimeout(highlightTimerRef.current);
      highlightTimerRef.current = window.setTimeout(() => {
        setRows((prev) => prev.map((row) => (row.isNew ? { ...row, isNew: false } : row)));
      }, NEW_ROW_HIGHLIGHT_MS);
    } catch (e) {
      const message = e instanceof Error ? e.message : '拉取实时日志失败';
      setError(message);
    } finally {
      pollingRef.current = false;
    }
  }, []);

  useEffect(() => {
    // 首次进入立即拉取，之后按间隔轮询；暂停时停止
    poll();
    const timer = window.setInterval(() => {
      if (!pausedRef.current) poll();
    }, POLL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [poll]);

  return (
    <>
      <div className="wc-page-actions ll-actions">
        <span className={`ll-live-pill ${paused ? 'is-paused' : 'is-live'}`}>
          <span className="ll-live-dot" />
          {paused ? '已暂停' : '实时'}
        </span>
        {lastUpdated && <span className="ll-updated">更新于 {lastUpdated}</span>}
        <button type="button" className="wc-btn wc-btn-secondary" onClick={() => setPaused((p) => !p)}>
          {paused ? <Play size={15} /> : <Pause size={15} />}
          {paused ? '继续' : '暂停'}
        </button>
        <button type="button" className="wc-btn wc-btn-ghost" onClick={() => setRows([])}>
          <Trash2 size={15} />
          清空
        </button>
      </div>

      {error && (
        <div className="wc-card wc-card-pad ll-error">
          <p className="ll-error-text">{error}</p>
          <button type="button" className="wc-btn wc-btn-secondary" onClick={poll}>
            重试
          </button>
        </div>
      )}

      <section className="wc-card ll-table-card">
        <div className="wc-card-body ll-table-body">
          {rows.length === 0 && !error && (
            <div className="ll-empty">
              <Radio size={22} />
              <p>{paused ? '日志已暂停' : '等待新的请求…'}</p>
            </div>
          )}
          {rows.length > 0 && (
            <table className="ll-table">
              <thead>
                <tr>
                  <th className="col-time">时间</th>
                  <th className="col-method">方法</th>
                  <th>路径</th>
                  <th>来源页</th>
                  <th>IP</th>
                  <th>归属地</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className={row.isNew ? 'is-new' : ''}>
                    <td className="col-time">{formatTime(row.time)}</td>
                    <td className="col-method">
                      <span className={`ll-method-badge ${methodClass(row.method)}`}>{row.method}</span>
                    </td>
                    <td className="col-path" title={row.path}>
                      {row.path}
                    </td>
                    <td className="col-referrer" title={row.referrer ?? ''}>
                      {row.referrer || '—'}
                    </td>
                    <td className="col-ip">{row.ip}</td>
                    <td>{row.location}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </>
  );
}

export default function LiveLogs() {
  const [tab, setTab] = useState<LogTab>('backend');

  return (
    <div className="wc-page live-logs-page">
      <header className="wc-page-header">
        <div className="wc-page-heading">
          <div className="wc-accent-bar" />
          <div>
            <h1 className="wc-page-title">实时日志</h1>
            <p className="wc-page-subtitle">
              {tab === 'backend'
                ? '后端服务运行日志（进程启动以来的 INFO 及以上级别）'
                : '博客访问请求实时流入（已排除服务器自身流量）'}
            </p>
          </div>
        </div>
        <div className="wc-page-actions">
          <div className="wc-tabs view-mode-tabs">
            <button
              type="button"
              className={`wc-tab ${tab === 'backend' ? 'wc-tab-active' : ''}`}
              onClick={() => setTab('backend')}
            >
              后端日志
            </button>
            <button
              type="button"
              className={`wc-tab ${tab === 'access' ? 'wc-tab-active' : ''}`}
              onClick={() => setTab('access')}
            >
              访问请求
            </button>
          </div>
        </div>
      </header>

      {tab === 'backend' ? <BackendLogStream /> : <AccessLogFeed />}
    </div>
  );
}
