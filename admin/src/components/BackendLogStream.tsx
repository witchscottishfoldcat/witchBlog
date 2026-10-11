import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowDownToLine, Eraser, Pause, Play } from 'lucide-react';
import { systemLogsApi, type BackendLogEntry } from '../services/systemLogsApi';
import './BackendLogStream.css';

/** 轮询间隔（毫秒） */
const POLL_INTERVAL_MS = 2000;
/** 前端最多保留的日志行数 */
const MAX_ENTRIES = 1000;

type LevelFilter = 'all' | 'info' | 'warning' | 'error';

const LEVEL_FILTERS: Array<{ key: LevelFilter; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'info', label: 'INFO+' },
  { key: 'warning', label: 'WARNING+' },
  { key: 'error', label: 'ERROR' },
];

function levelPasses(level: string, filter: LevelFilter): boolean {
  const l = level.toUpperCase();
  if (filter === 'warning') return l === 'WARNING' || l === 'ERROR' || l === 'CRITICAL';
  if (filter === 'error') return l === 'ERROR' || l === 'CRITICAL';
  return true; // all / info：缓冲区本就从 INFO 起收集
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleTimeString('zh-CN', { hour12: false });
}

export default function BackendLogStream() {
  const [entries, setEntries] = useState<BackendLogEntry[]>([]);
  const [paused, setPaused] = useState(false);
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('all');
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const lastSeqRef = useRef(0);
  const pollingRef = useRef(false);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickBottomRef = useRef(true);
  const [showJumpBottom, setShowJumpBottom] = useState(false);

  const poll = useCallback(async () => {
    if (pollingRef.current) return;
    pollingRef.current = true;
    try {
      const data = await systemLogsApi.getTail(lastSeqRef.current, 500);
      lastSeqRef.current = data.last_seq;
      setError(null);
      setLastUpdated(new Date().toLocaleTimeString('zh-CN', { hour12: false }));
      if (data.entries.length === 0) return;
      setEntries((prev) => {
        const merged = [...prev, ...data.entries];
        return merged.length > MAX_ENTRIES ? merged.slice(merged.length - MAX_ENTRIES) : merged;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : '拉取后端日志失败');
    } finally {
      pollingRef.current = false;
    }
  }, []);

  useEffect(() => {
    poll();
    const timer = window.setInterval(() => {
      if (!pausedRef.current) poll();
    }, POLL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [poll]);

  // 新日志到达且用户停留在底部时自动滚动跟随
  useEffect(() => {
    if (stickBottomRef.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
    stickBottomRef.current = nearBottom;
    setShowJumpBottom(!nearBottom);
  };

  const jumpToBottom = () => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    stickBottomRef.current = true;
    setShowJumpBottom(false);
  };

  const visibleEntries = entries.filter((e) => levelPasses(e.level, levelFilter));

  return (
    <>
      <div className="wc-page-actions ll-actions">
        <span className={`ll-live-pill ${paused ? 'is-paused' : 'is-live'}`}>
          <span className="ll-live-dot" />
          {paused ? '已暂停' : '实时'}
        </span>
        {lastUpdated && <span className="ll-updated">更新于 {lastUpdated}</span>}
        <div className="wc-tabs">
          {LEVEL_FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              className={`wc-tab ${levelFilter === f.key ? 'wc-tab-active' : ''}`}
              onClick={() => setLevelFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button type="button" className="wc-btn wc-btn-secondary" onClick={() => setPaused((p) => !p)}>
          {paused ? <Play size={15} /> : <Pause size={15} />}
          {paused ? '继续' : '暂停'}
        </button>
        <button type="button" className="wc-btn wc-btn-ghost" onClick={() => setEntries([])}>
          <Eraser size={15} />
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

      <div className="wc-card ll-console-card">
        <div className="ll-console" ref={scrollRef} onScroll={handleScroll}>
          {visibleEntries.length === 0 && !error && (
            <p className="ll-console-empty">
              {paused ? '日志已暂停' : '等待后端日志…（进程启动以来的 INFO 及以上级别）'}
            </p>
          )}
          {visibleEntries.map((entry) => (
            <div key={entry.seq} className={`ll-log-line level-${entry.level.toLowerCase()}`}>
              <span className="ll-log-time">{formatTime(entry.time)}</span>
              <span className={`ll-log-level lv-${entry.level.toLowerCase()}`}>{entry.level}</span>
              <span className="ll-log-name">[{entry.logger}]</span>
              <span className="ll-log-msg">
                {entry.message}
                {entry.traceback && (
                  <details className="ll-log-traceback">
                    <summary>堆栈</summary>
                    <pre>{entry.traceback}</pre>
                  </details>
                )}
              </span>
            </div>
          ))}
          {visibleEntries.length === 0 && entries.length > 0 && (
            <p className="ll-console-empty">当前过滤条件下没有日志</p>
          )}
        </div>
        {showJumpBottom && (
          <button type="button" className="ll-jump-bottom" onClick={jumpToBottom}>
            <ArrowDownToLine size={14} />
            回到底部
          </button>
        )}
      </div>
    </>
  );
}
