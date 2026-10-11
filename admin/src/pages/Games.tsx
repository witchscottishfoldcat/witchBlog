import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Trash2,
  ExternalLink,
  Gamepad2,
  BarChart3,
  Loader2,
  Download,
  CloudSync,
  Pencil,
  EyeOff,
  Clock,
  Star,
  Heart,
  X,
} from 'lucide-react';
import { gameShowcaseApi, type GameShowcase, type GameStats } from '../services/gameShowcaseApi';
import './Games.css';

const STATUS_MAP: Record<string, string> = {
  want_play: '想玩',
  playing: '在玩',
  completed: '已通关',
  shelved: '搁置',
  dropped: '弃坑',
};

const STATUS_BADGE: Record<string, string> = {
  want_play: 'wc-badge-info',
  playing: 'wc-badge-warning',
  completed: 'wc-badge-success',
  shelved: 'wc-badge-muted',
  dropped: 'wc-badge-muted',
};

const PLATFORM_MAP: Record<string, string> = {
  steam: 'Steam',
  epic: 'Epic',
  ps: 'PlayStation',
  switch: 'Switch',
  pc: 'PC',
  mobile: '移动端',
  other: '其他',
};

const formatPlayTime = (minutes?: number) => {
  if (minutes == null || minutes === 0) return '-';
  if (minutes < 60) return `${minutes}分钟`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

export default function Games() {
  const [games, setGames] = useState<GameShowcase[]>([]);
  const [, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<GameStats | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [filter, setFilter] = useState({
    status: '',
    platform: '',
    category: '',
    is_favorite: undefined as boolean | undefined,
    is_r18: undefined as boolean | undefined,
  });
  const [importForm, setImportForm] = useState({
    steam_id: '',
    import_all: true,
    default_status: 'want_play',
  });
  const size = 20;

  const loadGames = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await gameShowcaseApi.getList({
        page,
        size,
        status: filter.status || undefined,
        platform: filter.platform || undefined,
        category: filter.category || undefined,
        is_favorite: filter.is_favorite,
        is_r18: filter.is_r18,
        sort_by: 'sort_order',
      });
      setGames(res.items ?? []);
      setTotal(res.total ?? 0);
      setPages(res.pages ?? 0);
    } catch (e: any) {
      setError(e?.response?.data?.detail || e?.message || '加载失败');
      setGames([]);
      setTotal(0);
      setPages(0);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await gameShowcaseApi.getStats();
      setStats(data);
    } catch (_) {}
  };

  useEffect(() => {
    loadGames();
  }, [page, filter.status, filter.platform, filter.category, filter.is_favorite, filter.is_r18]);

  useEffect(() => {
    if (showStats) loadStats();
  }, [showStats]);

  const handleImport = async () => {
    if (!importForm.steam_id.trim()) {
      alert('请输入 Steam 64位用户ID');
      return;
    }
    setImportLoading(true);
    try {
      const res = await gameShowcaseApi.importFromSteam({
        steam_id: importForm.steam_id.trim(),
        import_all: importForm.import_all,
        default_status: importForm.default_status,
      });
      alert(res?.message || `导入完成: 新增 ${res?.imported ?? 0}, 更新 ${res?.updated ?? 0}`);
      setShowImport(false);
      setImportForm((f) => ({ ...f, steam_id: '' }));
      loadGames();
    } catch (e: any) {
      const msg = e?.response?.data?.detail ?? e?.message ?? '导入失败';
      alert(typeof msg === 'object' ? JSON.stringify(msg) : msg);
    } finally {
      setImportLoading(false);
    }
  };

  const handleSync = async () => {
    if (!importForm.steam_id.trim()) {
      alert('请输入 Steam 64位用户ID');
      return;
    }
    setSyncLoading(true);
    try {
      const res = await gameShowcaseApi.syncFromSteam(importForm.steam_id.trim());
      alert(res?.message || '同步完成');
      loadGames();
    } catch (e: any) {
      alert(e?.response?.data?.detail || e?.message || '同步失败');
    } finally {
      setSyncLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这条游戏记录吗？')) return;
    try {
      await gameShowcaseApi.delete(id);
      loadGames();
    } catch (e: any) {
      alert(e?.response?.data?.detail || e?.message || '删除失败');
    }
  };

  const renderGameRow = (game: GameShowcase) => (
    <div key={game.id} className="wc-list-row">
      {game.cover_image_url ? (
        <img src={game.cover_image_url} alt="" className="wc-list-row-media" />
      ) : (
        <div className="wc-list-row-media games-cover-placeholder">
          <Gamepad2 size={24} />
        </div>
      )}
      <div className="wc-list-row-main">
        <h3 className="wc-list-row-title">{game.title}</h3>
        {game.description && <p className="wc-list-row-desc">{game.description}</p>}
        <div className="wc-list-row-meta">
          <span className="wc-badge wc-badge-info">{PLATFORM_MAP[game.platform || ''] || game.platform || '其他'}</span>
          <span className={`wc-badge ${STATUS_BADGE[game.status || ''] || 'wc-badge-muted'}`}>
            {STATUS_MAP[game.status || ''] || game.status}
          </span>
          <span>
            <Clock size={12} /> {formatPlayTime(game.play_time)}
          </span>
          {game.rating != null && (
            <span>
              <Star size={12} fill="currentColor" /> 评分 {game.rating}
            </span>
          )}
          {game.is_favorite && (
            <span className="wc-badge wc-badge-danger">
              <Heart size={10} fill="currentColor" /> 收藏
            </span>
          )}
          {game.is_r18 && (
            <span className="wc-badge wc-badge-danger games-r18-badge">
              R18
            </span>
          )}
          {game.steam_url && (
            <a href={game.steam_url} target="_blank" rel="noopener noreferrer" className="wc-link">
              <ExternalLink size={12} /> Steam
            </a>
          )}
        </div>
      </div>
      <div className="wc-list-row-actions">
        <Link to={`/games/${game.id}/edit`} className="wc-icon-btn" title="编辑">
          <Pencil size={15} />
        </Link>
        <button type="button" className="wc-icon-btn wc-icon-btn-danger" onClick={() => handleDelete(game.id)} title="删除">
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="wc-page">
      <div className="wc-page-header">
        <div className="wc-page-heading">
          <span className="wc-accent-bar" />
          <div>
            <h1 className="wc-page-title">游戏展示</h1>
            <p className="wc-page-subtitle">管理游戏库，支持从 Steam 导入与同步</p>
          </div>
        </div>
        <div className="wc-page-actions">
          <button type="button" className="wc-btn wc-btn-secondary" onClick={() => setShowStats(!showStats)}>
            {showStats ? <><EyeOff size={14} /> 隐藏统计</> : <><BarChart3 size={14} /> 统计</>}
          </button>
          <button type="button" className="wc-btn wc-btn-secondary" onClick={() => setShowImport(true)}>
            <Download size={14} /> Steam 导入
          </button>
          <Link to="/games/new" className="wc-btn wc-btn-primary">
            <Plus size={14} /> 新建游戏
          </Link>
        </div>
      </div>

      {error && <div className="wc-alert wc-alert-error">{error}</div>}

      {showStats && stats && (
        <section className="wc-card games-stats">
          <div className="wc-card-header">
            <div>
              <h2 className="wc-card-title">游戏统计</h2>
              <p className="wc-card-subtitle">总数、游玩时长与状态分布</p>
            </div>
          </div>
          <div className="wc-card-body">
            <div className="games-stats-grid">
              <div className="games-stat-card">
                <h4>游戏总数</h4>
                <p className="games-stat-num wc-gradient-text">{stats.total_games ?? 0}</p>
              </div>
              <div className="games-stat-card">
                <h4>总游玩时长</h4>
                <p className="games-stat-num wc-gradient-text">{formatPlayTime(stats.total_play_time)}</p>
              </div>
              <div className="games-stat-card">
                <h4>收藏</h4>
                <p className="games-stat-num wc-gradient-text">{stats.favorite_count ?? 0}</p>
              </div>
              {stats.status_stats && stats.status_stats.length > 0 && (
                <div className="games-stat-card">
                  <h4>状态分布</h4>
                  <div className="games-stat-list">
                    {stats.status_stats.map((s, i) => (
                      <div key={i} className="games-stat-item">
                        <span>{STATUS_MAP[s.status] || s.status}</span>
                        <span className="games-stat-count">{s.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      <div className="wc-chip-row games-filter">
        <button
          type="button"
          className={`wc-chip ${!filter.status && filter.is_favorite === undefined && filter.is_r18 === undefined ? 'wc-chip-active' : ''}`}
          onClick={() => setFilter((f) => ({ ...f, status: '', is_favorite: undefined, is_r18: undefined }))}
        >
          全部
        </button>
        {(['want_play', 'playing', 'completed', 'shelved', 'dropped'] as const).map((s) => (
          <button
            key={s}
            type="button"
            className={`wc-chip ${filter.status === s ? 'wc-chip-active' : ''}`}
            onClick={() => setFilter((f) => ({ ...f, status: s, is_favorite: undefined, is_r18: undefined }))}
          >
            {STATUS_MAP[s]}
          </button>
        ))}
        <button
          type="button"
          className={`wc-chip ${filter.is_favorite === true ? 'wc-chip-active' : ''}`}
          onClick={() => setFilter((f) => ({ ...f, is_favorite: true, status: '', is_r18: undefined }))}
        >
          收藏
        </button>
        <button
          type="button"
          className={`wc-chip games-chip-r18 ${filter.is_r18 === true ? 'wc-chip-active' : ''}`}
          onClick={() => setFilter((f) => ({ ...f, is_r18: true, status: '', is_favorite: undefined }))}
          title="仅显示 R18 成人内容（前台公开 API 已默认过滤）"
        >
          R18
        </button>
      </div>

      {loading ? (
        <div className="wc-loading">
          <Loader2 size={18} className="wc-spinner" /> 加载中...
        </div>
      ) : games.length === 0 ? (
        <div className="wc-empty">
          <div className="wc-empty-icon">
            <Gamepad2 size={28} strokeWidth={1} />
          </div>
          <p>暂无游戏</p>
          <p className="wc-help">从 Steam 导入或手动新建</p>
        </div>
      ) : (
        <>
          <div className="wc-list">
            {games.map(renderGameRow)}
          </div>

          {pages > 1 && (
            <div className="wc-pagination">
              <button type="button" className="wc-pagination-btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>上一页</button>
              <span className="wc-pagination-info">{page} / {pages}</span>
              <button type="button" className="wc-pagination-btn" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>下一页</button>
            </div>
          )}
        </>
      )}

      {showImport && (
        <div className="wc-modal-overlay" onClick={() => !importLoading && !syncLoading && setShowImport(false)}>
          <div className="wc-modal" onClick={(e) => e.stopPropagation()}>
            <div className="wc-modal-header">
              <h3 className="wc-modal-title">Steam 导入 / 同步</h3>
              <button
                type="button"
                className="wc-icon-btn"
                onClick={() => !importLoading && !syncLoading && setShowImport(false)}
                aria-label="关闭"
              >
                <X size={16} />
              </button>
            </div>
            <div className="wc-modal-body">
              <p className="wc-help games-modal-hint">
                Steam 64位用户ID 可从个人资料 URL 获取，如 https://steamcommunity.com/profiles/your-steam-user-id/
              </p>
              <div className="wc-form">
                <div className="wc-field">
                  <label className="wc-label">Steam 64位用户ID *</label>
                  <input
                    className="wc-input"
                    type="text"
                    value={importForm.steam_id}
                    onChange={(e) => setImportForm((f) => ({ ...f, steam_id: e.target.value }))}
                    placeholder="your-steam-user-id"
                  />
                </div>
                <label className="wc-check">
                  <input
                    type="checkbox"
                    checked={importForm.import_all}
                    onChange={(e) => setImportForm((f) => ({ ...f, import_all: e.target.checked }))}
                  />
                  导入全部游戏（否则仅导入有游玩时长的）
                </label>
                <div className="wc-field">
                  <label className="wc-label">新游戏默认状态</label>
                  <select
                    className="wc-select"
                    value={importForm.default_status}
                    onChange={(e) => setImportForm((f) => ({ ...f, default_status: e.target.value }))}
                  >
                    <option value="want_play">想玩</option>
                    <option value="playing">在玩</option>
                    <option value="shelved">搁置</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="wc-modal-footer">
              <button type="button" className="wc-btn wc-btn-secondary" onClick={handleSync} disabled={syncLoading || importLoading}>
                {syncLoading ? <><Loader2 size={14} className="wc-spinner" /> 同步中</> : <><CloudSync size={14} /> 仅同步</>}
              </button>
              <button type="button" className="wc-btn wc-btn-primary" onClick={handleImport} disabled={importLoading || syncLoading}>
                {importLoading ? <><Loader2 size={14} className="wc-spinner" /> 导入中…</> : '导入'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
