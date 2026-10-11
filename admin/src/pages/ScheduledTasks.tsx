import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Play, Power, PowerOff, Loader2, AlertCircle, ListChecks } from 'lucide-react';
import { schedulerApi, type TaskStatus } from '../services/schedulerApi';
import './ScheduledTasks.css';

const formatTime = (s: string | null) => {
  if (!s) return '-';
  try {
    return new Date(s).toLocaleString('zh-CN');
  } catch {
    return s;
  }
};

const statusLabel = (s: string | null) => {
  if (!s) return '-';
  const map: Record<string, string> = {
    pending: '等待',
    running: '运行中',
    success: '成功',
    failed: '失败',
  };
  return map[s] || s;
};

export default function ScheduledTasks() {
  const [tasks, setTasks] = useState<TaskStatus[]>([]);
  const [total, setTotal] = useState(0);
  const [enabledCount, setEnabledCount] = useState(0);
  const [disabledCount, setDisabledCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actioning, setActioning] = useState<string | null>(null);

  const loadTasks = useCallback(async () => {
    setError('');
    try {
      const res = await schedulerApi.getTasks();
      setTasks(res.tasks ?? []);
      setTotal(res.total ?? 0);
      setEnabledCount(res.enabled_count ?? 0);
      setDisabledCount(res.disabled_count ?? 0);
    } catch (e: any) {
      setError(e?.response?.data?.detail || e?.message || '加载失败');
      setTasks([]);
      setTotal(0);
      setEnabledCount(0);
      setDisabledCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
    const timer = setInterval(loadTasks, 30000);
    return () => clearInterval(timer);
  }, [loadTasks]);

  const handleEnable = async (name: string) => {
    setActioning(name);
    try {
      await schedulerApi.enable(name);
      await loadTasks();
    } catch (e: any) {
      alert(e?.response?.data?.detail || e?.message || '启用失败');
    } finally {
      setActioning(null);
    }
  };

  const handleDisable = async (name: string) => {
    setActioning(name);
    try {
      await schedulerApi.disable(name);
      await loadTasks();
    } catch (e: any) {
      alert(e?.response?.data?.detail || e?.message || '禁用失败');
    } finally {
      setActioning(null);
    }
  };

  const handleRun = async (name: string) => {
    if (!confirm(`确定要立即执行任务「${name}」吗？`)) return;
    setActioning(name);
    try {
      const res = await schedulerApi.run(name);
      if (res.success) {
        alert(res.message || '已触发');
      } else {
        alert(res.error || '执行失败');
      }
      await loadTasks();
    } catch (e: any) {
      alert(e?.response?.data?.detail || e?.message || '触发失败');
    } finally {
      setActioning(null);
    }
  };

  return (
    <div className="wc-page scheduled-tasks-page">
      <div className="wc-page-header">
        <div className="wc-page-heading">
          <span className="wc-accent-bar" />
          <div>
            <h1 className="wc-page-title">定时任务</h1>
            <p className="wc-page-subtitle">查看、启用/禁用与手动触发定时任务</p>
          </div>
        </div>
        <div className="wc-page-actions">
          <button
            type="button"
            className="wc-btn wc-btn-secondary"
            onClick={() => { setLoading(true); loadTasks(); }}
          >
            <RefreshCw size={16} /> 刷新
          </button>
        </div>
      </div>

      {error && (
        <div className="wc-alert wc-alert-error scheduled-tasks-alert">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {loading && !tasks.length ? (
        <div className="wc-loading">
          <Loader2 size={16} className="wc-spinner" /> 加载中...
        </div>
      ) : (
        <>
          <div className="wc-stats-grid scheduled-tasks-stats">
            <div className="wc-stat">
              <div className="wc-stat-icon"><ListChecks size={20} /></div>
              <div className="wc-stat-body">
                <span className="wc-stat-value">{total}</span>
                <span className="wc-stat-label">任务总数</span>
              </div>
            </div>
            <div className="wc-stat">
              <div className="wc-stat-icon"><Power size={20} /></div>
              <div className="wc-stat-body">
                <span className="wc-stat-value">{enabledCount}</span>
                <span className="wc-stat-label">已启用</span>
              </div>
            </div>
            <div className="wc-stat">
              <div className="wc-stat-icon"><PowerOff size={20} /></div>
              <div className="wc-stat-body">
                <span className="wc-stat-value">{disabledCount}</span>
                <span className="wc-stat-label">已禁用</span>
              </div>
            </div>
          </div>

          <div className="wc-list">
            {tasks.length === 0 ? (
              <div className="wc-empty">
                <div className="wc-empty-icon"><ListChecks size={24} /></div>
                <p>暂无定时任务</p>
              </div>
            ) : (
              tasks.map((task) => (
                <div key={task.name} className="wc-list-row scheduled-tasks-row">
                  <div className="wc-list-row-main">
                    <div className="wc-list-row-title">
                      <span className="scheduled-tasks-name">{task.name}</span>
                      {task.is_enabled ? (
                        <span className="wc-badge wc-badge-success">已启用</span>
                      ) : (
                        <span className="wc-badge wc-badge-muted">已禁用</span>
                      )}
                      {task.is_running && (
                        <span className="wc-badge wc-badge-info">
                          <Loader2 size={12} className="wc-spinner" /> 运行中
                        </span>
                      )}
                      {task.last_status && (
                        <span className={`wc-badge scheduled-tasks-status-${task.last_status}`}>
                          {statusLabel(task.last_status)}
                        </span>
                      )}
                    </div>
                    {task.description && (
                      <p className="wc-list-row-desc">{task.description}</p>
                    )}
                    <div className="wc-list-row-meta">
                      <span>触发: <span className="wc-badge wc-badge-muted">{task.trigger_type === 'cron' ? 'Cron' : '间隔'}</span></span>
                      <span>调度: <code className="scheduled-tasks-schedule">{task.schedule}</code></span>
                      <span>运行次数: {task.run_count}</span>
                      {task.last_duration != null && <span>上次耗时: {task.last_duration}s</span>}
                    </div>
                    <div className="wc-list-row-meta">
                      <span>上次运行: {formatTime(task.last_run_at)}</span>
                      <span>下次运行: {formatTime(task.next_run_at)}</span>
                    </div>
                    {task.last_error && (
                      <div className="wc-alert wc-alert-error scheduled-tasks-last-error">
                        错误: {task.last_error}
                      </div>
                    )}
                  </div>
                  <div className="wc-list-row-actions scheduled-tasks-actions">
                    {task.is_enabled ? (
                      <button
                        type="button"
                        className="wc-icon-btn"
                        title="禁用"
                        onClick={() => handleDisable(task.name)}
                        disabled={!!actioning || task.is_running}
                      >
                        {actioning === task.name ? <Loader2 size={16} className="wc-spinner" /> : <PowerOff size={16} />}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="wc-icon-btn"
                        title="启用"
                        onClick={() => handleEnable(task.name)}
                        disabled={!!actioning}
                      >
                        {actioning === task.name ? <Loader2 size={16} className="wc-spinner" /> : <Power size={16} />}
                      </button>
                    )}
                    <button
                      type="button"
                      className="wc-icon-btn"
                      title="立即执行"
                      onClick={() => handleRun(task.name)}
                      disabled={!!actioning || task.is_running}
                    >
                      {actioning === task.name ? <Loader2 size={16} className="wc-spinner" /> : <Play size={16} />}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
