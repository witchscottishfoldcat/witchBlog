import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, BarChart3, CheckSquare, XSquare, Image, FileEdit, Tv, FolderOpen, Layers, Play, Star, EyeOff, Pencil, Trash2, Loader2 } from 'lucide-react';
import { Service } from '../services';
import type { AnimeWatchlist } from '../services/models/AnimeWatchlist';
import type { AnimeWatchlistList } from '../services/models/AnimeWatchlistList';
import type { AnimeWatchlistStatusStats } from '../services/models/AnimeWatchlistStatusStats';
import type { AnimeWatchlistCategoryStats } from '../services/models/AnimeWatchlistCategoryStats';
import type { AnimeWatchlistTagStats } from '../services/models/AnimeWatchlistTagStats';
import './AnimeWatchlist.css';

/* 状态 -> 徽标文案与配色（想看 info / 正在看 warning / 已完成 success / 收藏 danger） */
const STATUS_BADGES: Record<string, { label: string; badgeClass: string }> = {
  want_watch: { label: '想看', badgeClass: 'wc-badge wc-badge-info' },
  watching: { label: '正在看', badgeClass: 'wc-badge wc-badge-warning' },
  completed: { label: '已完成', badgeClass: 'wc-badge wc-badge-success' },
  favorites: { label: '收藏', badgeClass: 'wc-badge wc-badge-danger' },
  dropped: { label: '已弃', badgeClass: 'wc-badge wc-badge-muted' },
};

const getStatusBadge = (status?: string | null) =>
  STATUS_BADGES[status || ''] || { label: status || '未设置', badgeClass: 'wc-badge wc-badge-muted' };

export default function AnimeWatchlist() {
  const [animeList, setAnimeList] = useState<AnimeWatchlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({
    status: [] as AnimeWatchlistStatusStats[],
    category: [] as AnimeWatchlistCategoryStats[],
    tags: [] as AnimeWatchlistTagStats[],
  });
  const [showStats, setShowStats] = useState(false);
  const [filter, setFilter] = useState<'all' | 'want-watch' | 'watching' | 'completed' | 'favorites'>('all');
  const [batchMode, setBatchMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const limit = 20;

  useEffect(() => {
    loadAnime();
    loadStats();
  }, [page, filter]);

  const loadAnime = async () => {
    setLoading(true);
    try {
      let response: AnimeWatchlistList;

      // 根据筛选条件加载不同的列表
      if (filter === 'want-watch') {
        const data = await Service.getWantWatchAnimeApiV1AnimeWatchlistWantWatchGet();
        setAnimeList(Array.isArray(data) ? data : []);
        setTotal(Array.isArray(data) ? data.length : 0);
        setLoading(false);
        return;
      } else if (filter === 'watching') {
        const data = await Service.getWatchingAnimeApiV1AnimeWatchlistWatchingGet();
        setAnimeList(Array.isArray(data) ? data : []);
        setTotal(Array.isArray(data) ? data.length : 0);
        setLoading(false);
        return;
      } else if (filter === 'completed') {
        const data = await Service.getCompletedAnimeApiV1AnimeWatchlistCompletedGet();
        setAnimeList(Array.isArray(data) ? data : []);
        setTotal(Array.isArray(data) ? data.length : 0);
        setLoading(false);
        return;
      } else if (filter === 'favorites') {
        const data = await Service.getFavoriteAnimeApiV1AnimeWatchlistFavoritesGet();
        setAnimeList(Array.isArray(data) ? data : []);
        setTotal(Array.isArray(data) ? data.length : 0);
        setLoading(false);
        return;
      }

      // 默认加载分页列表
      response = await Service.getAnimeWatchlistPaginatedApiV1AnimeWatchlistListGet(
        undefined, // category
        undefined, // tags
        undefined, // status
        undefined, // isFavorite
        undefined, // isActive
        page,      // page
        limit      // size
      );

      setAnimeList(response.items || []);
      setTotal(response.total || 0);
    } catch (error) {
      console.error('加载动漫列表失败:', error);
      alert('加载动漫列表失败，请查看控制台');
      setAnimeList([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const [statusStats, categoryStats, tagStats] = await Promise.all([
        Service.getAnimeStatusStatsApiV1AnimeWatchlistStatusesGet(),
        Service.getAnimeCategoryStatsApiV1AnimeWatchlistCategoriesGet(),
        Service.getAnimeTagStatsApiV1AnimeWatchlistTagsGet(),
      ]);
      setStats({
        status: Array.isArray(statusStats) ? statusStats : [],
        category: Array.isArray(categoryStats) ? categoryStats : [],
        tags: Array.isArray(tagStats) ? tagStats : [],
      });
    } catch (error) {
      console.error('加载统计失败:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个动漫吗？')) return;

    try {
      await Service.deleteAnimeWatchlistItemApiV1AnimeWatchlistItemIdDelete(id);
      loadAnime();
      loadStats();
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败');
    }
  };

  const handleUpdateProgress = async (id: number, currentEpisode: number, totalEpisodes?: number) => {
    try {
      // 计算进度百分比
      const progress = totalEpisodes ? Math.round((currentEpisode / totalEpisodes) * 100) : 0;
      await Service.updateAnimeProgressApiV1AnimeWatchlistItemIdProgressPatch(
        id,
        progress,
        currentEpisode
      );
      alert('进度更新成功！');
      loadAnime();
    } catch (error) {
      console.error('更新进度失败:', error);
      alert('更新进度失败');
    }
  };

  const handleBatchUpdateCovers = async () => {
    if (!confirm('确定要批量更新所有动漫的封面吗？')) return;

    try {
      await Service.batchUpdateAnimeCoversApiV1AnimeWatchlistBatchUpdateCoversPost(50);
      alert('批量更新封面成功！');
      setBatchMode(false);
      loadAnime();
    } catch (error) {
      console.error('批量更新封面失败:', error);
      alert('批量更新封面失败');
    }
  };

  const handleBatchUpdateMetadata = async () => {
    if (!confirm('确定要批量更新所有动漫的元数据吗？')) return;

    try {
      await Service.batchUpdateAnimeMetadataApiV1AnimeWatchlistBatchUpdateMetadataPost(50);
      alert('批量更新元数据成功！');
      setBatchMode(false);
      loadAnime();
    } catch (error) {
      console.error('批量更新元数据失败:', error);
      alert('批量更新元数据失败');
    }
  };

  const toggleSelectItem = (id: number) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(item => item !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="wc-page anime-page">
      <div className="wc-page-header">
        <div className="wc-page-heading">
          <span className="wc-accent-bar" />
          <div>
            <h1 className="wc-page-title">追番追剧</h1>
            <p className="wc-page-subtitle">管理动漫与剧集观看列表</p>
          </div>
        </div>
        <div className="wc-page-actions">
          <button type="button" className="wc-btn wc-btn-secondary" onClick={() => setShowStats(!showStats)}>
            {showStats ? <><EyeOff size={16} /> 隐藏统计</> : <><BarChart3 size={16} /> 查看统计</>}
          </button>
          <button type="button" className="wc-btn wc-btn-secondary" onClick={() => { setBatchMode(!batchMode); setSelectedItems([]); }}>
            {batchMode ? <><XSquare size={16} /> 取消批量</> : <><CheckSquare size={16} /> 批量操作</>}
          </button>
          <Link to="/anime-watchlist/new" className="wc-btn wc-btn-primary">
            <Plus size={16} /> 新建动漫
          </Link>
        </div>
      </div>

      <div className="wc-toolbar">
        <div className="wc-chip-row">
          <button type="button" className={`wc-chip ${filter === 'all' ? 'wc-chip-active' : ''}`} onClick={() => setFilter('all')}>全部</button>
          <button type="button" className={`wc-chip ${filter === 'want-watch' ? 'wc-chip-active' : ''}`} onClick={() => setFilter('want-watch')}>想看</button>
          <button type="button" className={`wc-chip ${filter === 'watching' ? 'wc-chip-active' : ''}`} onClick={() => setFilter('watching')}>正在看</button>
          <button type="button" className={`wc-chip ${filter === 'completed' ? 'wc-chip-active' : ''}`} onClick={() => setFilter('completed')}>已完成</button>
          <button type="button" className={`wc-chip ${filter === 'favorites' ? 'wc-chip-active' : ''}`} onClick={() => setFilter('favorites')}>收藏</button>
        </div>
      </div>

      {batchMode && (
        <div className="wc-card aw-batch-bar">
          <span className="aw-batch-label">批量操作模式</span>
          <button type="button" className="wc-btn wc-btn-secondary" onClick={handleBatchUpdateCovers}>
            <Image size={16} /> 批量更新封面
          </button>
          <button type="button" className="wc-btn wc-btn-secondary" onClick={handleBatchUpdateMetadata}>
            <FileEdit size={16} /> 批量更新元数据
          </button>
        </div>
      )}

      {showStats && (
        <section className="wc-card wc-card-pad aw-stats-section">
          <h2 className="wc-section-title">统计信息</h2>
          <div className="aw-stats-grid">
            {stats.status.length > 0 && (
              <div className="aw-stats-block">
                <h4 className="aw-stats-block-title">状态统计</h4>
                <div className="aw-stats-items">
                  {stats.status.map((stat, i) => (
                    <div key={i} className="aw-stat-item">
                      <span>{stat.status || '未设置'}</span>
                      <span className="wc-badge wc-badge-muted">{stat.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {stats.category.length > 0 && (
              <div className="aw-stats-block">
                <h4 className="aw-stats-block-title">分类统计</h4>
                <div className="aw-stats-items">
                  {stats.category.map((stat, i) => (
                    <div key={i} className="aw-stat-item">
                      <span>{stat.category || '未分类'}</span>
                      <span className="wc-badge wc-badge-muted">{stat.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {stats.tags.length > 0 && (
              <div className="aw-stats-block">
                <h4 className="aw-stats-block-title">标签统计</h4>
                <div className="aw-stats-items">
                  {stats.tags.map((stat, i) => (
                    <div key={i} className="aw-stat-item">
                      <span>{stat.tag || '无标签'}</span>
                      <span className="wc-badge wc-badge-muted">{stat.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {loading ? (
        <div className="wc-loading"><Loader2 size={18} className="wc-spinner" /> 加载中...</div>
      ) : (
        <>
          <div className="wc-list">
            {animeList.length === 0 ? (
              <div className="wc-empty">
                <div className="wc-empty-icon"><Tv size={28} strokeWidth={1.5} /></div>
                <p>暂无动漫</p>
              </div>
            ) : (
              animeList.map((anime) => {
                const statusBadge = getStatusBadge(anime.status);
                return (
                  <div key={anime.id} className={`wc-list-row ${selectedItems.includes(anime.id) ? 'aw-row-selected' : ''}`}>
                    {batchMode && (
                      <label className="wc-check aw-check">
                        <input type="checkbox" checked={selectedItems.includes(anime.id)} onChange={() => toggleSelectItem(anime.id)} />
                      </label>
                    )}
                    <div className="wc-list-row-main">
                      <h3 className="wc-list-row-title">{anime.title}</h3>
                      {anime.description && <p className="wc-list-row-desc">{anime.description}</p>}
                      <div className="wc-list-row-meta">
                        <span className={statusBadge.badgeClass}>{statusBadge.label}</span>
                        <span><FolderOpen size={14} /> {anime.category || '未分类'}</span>
                        {anime.total_episodes && <span><Layers size={14} /> 总集数: {anime.total_episodes}</span>}
                        {anime.current_episode !== undefined && (
                          <span className="aw-progress">
                            <Play size={14} /> 当前: {anime.current_episode}集{anime.total_episodes ? ` / ${anime.total_episodes}集` : ''}
                            <button type="button" className="wc-btn wc-btn-ghost wc-btn-sm aw-progress-btn" onClick={() => {
                              const newEpisode = prompt(`更新观看进度 (当前: ${anime.current_episode}集):`, String(anime.current_episode || 0));
                              if (newEpisode !== null) {
                                const episode = parseInt(newEpisode);
                                if (!isNaN(episode) && episode >= 0) handleUpdateProgress(anime.id, episode, anime.total_episodes || undefined);
                              }
                            }} aria-label="更新进度"><FileEdit size={12} /></button>
                          </span>
                        )}
                        {anime.rating && <span><Star size={14} /> 评分: {anime.rating}</span>}
                      </div>
                      {anime.tags && typeof anime.tags === 'string' && (
                        <div className="wc-tag-row">
                          {anime.tags.split(',').filter(t => t.trim()).map((tag, i) => <span key={i} className="wc-tag">{tag.trim()}</span>)}
                        </div>
                      )}
                    </div>
                    <div className="wc-list-row-actions">
                      <Link to={`/anime-watchlist/${anime.id}/edit`} className="wc-icon-btn" aria-label="编辑">
                        <Pencil size={16} />
                      </Link>
                      <button type="button" className="wc-icon-btn wc-icon-btn-danger" onClick={() => handleDelete(anime.id)} aria-label="删除">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {totalPages > 1 && (
            <div className="wc-pagination">
              <button type="button" className="wc-pagination-btn" disabled={page === 1} onClick={() => setPage(page - 1)}>上一页</button>
              <span className="wc-pagination-info">{page} / {totalPages}</span>
              <button type="button" className="wc-pagination-btn" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>下一页</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
