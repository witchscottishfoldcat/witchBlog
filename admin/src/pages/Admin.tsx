import { useEffect, useState, useRef, useCallback } from 'react';
import {
  RefreshCw,
  Cpu,
  HardDrive,
  Activity,
  Database,
  FileText,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Server,
  BarChart3,
  LayoutDashboard,
  Loader2,
  ShieldAlert,
} from 'lucide-react';
import { adminApi, type LogEntry, type PerformanceData, type SystemStatus } from '../services/adminApi';
import { getAuthToken } from '../config/api';
import './Admin.css';

const formatBytes = (bytes?: number) => {
  if (bytes == null) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const formatUptime = (sec?: number) => {
  if (sec == null) return '-';
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const parts = [];
  if (d > 0) parts.push(`${d}天`);
  if (h > 0) parts.push(`${h}时`);
  parts.push(`${m}分`);
  return parts.join('');
};

export default function Admin() {
  const [perf, setPerf] = useState<PerformanceData | null>(null);
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [logStats, setLogStats] = useState<{ total_lines?: number; error_count?: number; warning_count?: number; file_size?: number } | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [logStreamActive, setLogStreamActive] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'logs'>('overview');
  const [logLevelFilter, setLogLevelFilter] = useState<'all' | 'debug' | 'info' | 'warning' | 'error' | 'raw'>('all');
  const abortRef = useRef<AbortController | null>(null);

  const loadData = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const [perfRes, statusRes, statsRes] = await Promise.allSettled([
        adminApi.getPerformance(),
        adminApi.getSystemStatus(),
        adminApi.getLogStats(),
      ]);
      if (perfRes.status === 'fulfilled') setPerf(perfRes.value);
      if (statusRes.status === 'fulfilled') setStatus(statusRes.value);
      if (statsRes.status === 'fulfilled' && statsRes.value?.data) setLogStats(statsRes.value.data);
      if (perfRes.status === 'rejected' || statusRes.status === 'rejected') {
        const err = (perfRes.status === 'rejected' ? (perfRes as PromiseRejectedResult).reason : (statusRes as PromiseRejectedResult).reason)?.response;
        if (err?.status === 403) setError('仅超级管理员可访问系统管理');
        else setError(err?.data?.detail || '加载失败');
      }
    } catch (e: any) {
      setError(e?.response?.data?.detail || e?.message || '加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleLogStream = useCallback(() => {
    if (logStreamActive) {
      abortRef.current?.abort();
      setLogStreamActive(false);
      return;
    }
    const token = getAuthToken();
    if (!token) {
      setError('未登录');
      return;
    }
    setLogStreamActive(true);
    setLogs([]);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const url = `/api/v1/admin/logs/stream?lines=50&follow=true`;
    fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      signal: ctrl.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText);
        return res.body;
      })
      .then((body) => {
        if (!body) return;
        const reader = body.getReader();
        const decoder = new TextDecoder();
        let buf = '';
        const read = () => {
          reader.read().then(({ done, value }) => {
            if (done) {
              setLogStreamActive(false);
              return;
            }
            buf += decoder.decode(value, { stream: true });
            const lines = buf.split('\n');
            buf = lines.pop() || '';
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  setLogs((prev) => [...prev.slice(-199), data]);
                } catch (_) {}
              }
            }
            read();
          });
        };
        read();
      })
      .catch((e) => {
        if (e.name !== 'AbortError') setError('日志流连接失败');
        setLogStreamActive(false);
      });
  }, [logStreamActive]);

  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 10000);
    return () => clearInterval(timer);
  }, [loadData]);

  useEffect(() => () => abortRef.current?.abort(), []);

  if (loading && !perf) {
    return (
      <div className="wc-page admin-page">
        <div className="wc-loading">
          <Loader2 size={16} className="wc-spinner" /> 加载中...
        </div>
      </div>
    );
  }

  if (error && !perf) {
    return (
      <div className="wc-page admin-page">
        <div className="wc-alert wc-alert-error admin-error-block">
          <ShieldAlert size={20} />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const sys = perf?.system;
  const app = perf?.application;
  const db = perf?.database;
  const biz = perf?.business;

  return (
    <div className="wc-page admin-page">
      <div className="wc-page-header">
        <div className="wc-page-heading">
          <span className="wc-accent-bar" />
          <div>
            <h1 className="wc-page-title">系统管理</h1>
            <p className="wc-page-subtitle">监控系统性能、日志与健康状态</p>
          </div>
        </div>
        <div className="wc-page-actions">
          <button type="button" className="wc-btn wc-btn-secondary" onClick={loadData}>
            <RefreshCw size={16} /> 刷新
          </button>
        </div>
      </div>

      {error && (
        <div className="wc-alert wc-alert-error admin-banner-error">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <div className="wc-tabs admin-tabs">
        <button
          type="button"
          className={`wc-tab ${activeTab === 'overview' ? 'wc-tab-active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <LayoutDashboard size={16} /> 概览
        </button>
        <button
          type="button"
          className={`wc-tab ${activeTab === 'logs' ? 'wc-tab-active' : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          <FileText size={16} /> 日志统计
        </button>
      </div>

      {activeTab === 'overview' && (
        <>
      {/* 系统状态 */}
      <div className="admin-cards">
        <section className="wc-card">
          <div className="wc-card-header">
            <h2 className="wc-card-title"><Server size={18} /> 系统状态</h2>
          </div>
          <div className="wc-card-body admin-card-body">
            <div className={`wc-badge admin-status-badge ${status?.status === 'healthy' ? 'wc-badge-success' : 'wc-badge-warning'}`}>
              {status?.status === 'healthy' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
              <span>{status?.status === 'healthy' ? '运行正常' : status?.status || '-'}</span>
            </div>
            <p className="admin-card-line">版本: {status?.version || '-'}</p>
            <p className="admin-card-line">运行时长: {formatUptime(status?.uptime)}</p>
          </div>
        </section>

        <section className="wc-card">
          <div className="wc-card-header">
            <h2 className="wc-card-title"><Cpu size={18} /> CPU & 内存</h2>
          </div>
          <div className="wc-card-body admin-card-body">
            <div className="admin-metric">
              <span>CPU 使用率</span>
              <span className="admin-value">{sys?.cpu_percent ?? '-'}%</span>
            </div>
            <div className="admin-progress">
              <div className="admin-progress-fill" style={{ width: `${sys?.cpu_percent ?? 0}%` }} />
            </div>
            <div className="admin-metric">
              <span>内存使用</span>
              <span className="admin-value">{sys?.memory_percent ?? '-'}%</span>
            </div>
            <div className="admin-progress">
              <div className="admin-progress-fill" style={{ width: `${sys?.memory_percent ?? 0}%` }} />
            </div>
            <p className="admin-hint">
              {sys?.memory_used ?? '-'} / {sys?.memory_total ?? '-'} MB
            </p>
          </div>
        </section>

        <section className="wc-card">
          <div className="wc-card-header">
            <h2 className="wc-card-title"><HardDrive size={18} /> 磁盘</h2>
          </div>
          <div className="wc-card-body admin-card-body">
            <div className="admin-metric">
              <span>磁盘使用率</span>
              <span className="admin-value">{sys?.disk_percent ?? '-'}%</span>
            </div>
            <div className="admin-progress">
              <div className="admin-progress-fill" style={{ width: `${sys?.disk_percent ?? 0}%` }} />
            </div>
            <p className="admin-hint">
              {sys?.disk_used ?? '-'} / {sys?.disk_total ?? '-'} MB
            </p>
          </div>
        </section>

        <section className="wc-card">
          <div className="wc-card-header">
            <h2 className="wc-card-title"><Database size={18} /> 数据库</h2>
          </div>
          <div className="wc-card-body admin-card-body">
            <div className={`wc-badge admin-status-badge ${db?.status === 'healthy' ? 'wc-badge-success' : 'wc-badge-warning'}`}>
              {db?.status || '-'}
            </div>
            <div className="admin-metric">
              <span>连接池</span>
              <span className="admin-value">
                {db?.checked_out ?? '-'} / {db?.pool_size ?? '-'}
              </span>
            </div>
          </div>
        </section>
      </div>

      {/* 应用与业务指标 */}
      <div className="admin-grid">
        <section className="wc-card">
          <div className="wc-card-header">
            <h2 className="wc-card-title"><Activity size={18} /> 应用指标</h2>
          </div>
          <div className="wc-card-body admin-card-body admin-metrics-grid">
            <div className="admin-metric">
              <span>总请求数</span>
              <span className="admin-value">{app?.total_requests ?? '-'}</span>
            </div>
            <div className="admin-metric">
              <span>今日请求</span>
              <span className="admin-value">{app?.today_requests ?? '-'}</span>
            </div>
            <div className="admin-metric">
              <span>平均响应 (ms)</span>
              <span className="admin-value">{app?.average_response_time ?? '-'}</span>
            </div>
            <div className="admin-metric">
              <span>错误率</span>
              <span className="admin-value">{app?.error_rate ?? '-'}%</span>
            </div>
          </div>
        </section>

        <section className="wc-card">
          <div className="wc-card-header">
            <h2 className="wc-card-title"><BarChart3 size={18} /> 业务指标</h2>
          </div>
          <div className="wc-card-body admin-card-body admin-metrics-grid">
            <div className="admin-metric">
              <span>总用户</span>
              <span className="admin-value">{biz?.total_users ?? '-'}</span>
            </div>
            <div className="admin-metric">
              <span>总日记</span>
              <span className="admin-value">{biz?.total_diaries ?? '-'}</span>
            </div>
            <div className="admin-metric">
              <span>总访问</span>
              <span className="admin-value">{biz?.total_visitors ?? '-'}</span>
            </div>
            <div className="admin-metric">
              <span>今日访问</span>
              <span className="admin-value">{biz?.today_visitors ?? '-'}</span>
            </div>
          </div>
        </section>
      </div>
        </>
      )}

      {activeTab === 'logs' && (
      <section className="wc-card">
        <div className="wc-card-header">
          <h2 className="wc-card-title"><FileText size={18} /> 日志统计</h2>
          <button
            type="button"
            className={`wc-btn wc-btn-sm ${logStreamActive ? 'wc-btn-primary' : 'wc-btn-secondary'}`}
            onClick={toggleLogStream}
          >
            {logStreamActive ? '停止' : '实时日志'}
          </button>
        </div>
        <div className="wc-card-body admin-card-body">
          <div className="wc-stats-grid admin-log-stats">
            <div className="wc-stat">
              <div className="wc-stat-icon"><FileText size={20} /></div>
              <div className="wc-stat-body">
                <span className="wc-stat-value">{logStats?.total_lines ?? '-'}</span>
                <span className="wc-stat-label">总行数</span>
              </div>
            </div>
            <div className="wc-stat">
              <div className="wc-stat-icon"><AlertCircle size={20} /></div>
              <div className="wc-stat-body">
                <span className="wc-stat-value">{logStats?.error_count ?? '-'}</span>
                <span className="wc-stat-label">错误</span>
              </div>
            </div>
            <div className="wc-stat">
              <div className="wc-stat-icon"><AlertTriangle size={20} /></div>
              <div className="wc-stat-body">
                <span className="wc-stat-value">{logStats?.warning_count ?? '-'}</span>
                <span className="wc-stat-label">警告</span>
              </div>
            </div>
            <div className="wc-stat">
              <div className="wc-stat-icon"><HardDrive size={20} /></div>
              <div className="wc-stat-body">
                <span className="wc-stat-value">{formatBytes(logStats?.file_size)}</span>
                <span className="wc-stat-label">文件大小</span>
              </div>
            </div>
          </div>
          {logStreamActive && (
            <>
            <div className="wc-chip-row admin-log-filters">
              {(['all', 'debug', 'info', 'warning', 'error', 'raw'] as const).map((lv) => (
                <button
                  key={lv}
                  type="button"
                  className={`wc-chip ${logLevelFilter === lv ? 'wc-chip-active' : ''}`}
                  onClick={() => setLogLevelFilter(lv)}
                >
                  {lv === 'all' ? '全部' : lv.toUpperCase()}
                </button>
              ))}
            </div>
            <div className="admin-log-stream">
              {logs
                .filter((log) => logLevelFilter === 'all' || (log.level || '').toLowerCase() === logLevelFilter)
                .map((log, i) => (
                <div key={i} className={`admin-log-line level-${(log.level || '').toLowerCase()}`}>
                  <span className="admin-log-time">{log.timestamp}</span>
                  <span className="admin-log-level">[{log.level}]</span>
                  <span className="admin-log-msg">{log.message}</span>
                </div>
              ))}
            </div>
            </>
          )}
        </div>
      </section>
      )}
    </div>
  );
}
