import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2, ImageDown, ExternalLink } from 'lucide-react';
import { Service } from '../services';
import type { AnimeWatchlistCreate, AnimeWatchlistUpdate, AnimeWatchlist } from '../services';
import './AnimeWatchlistEdit.css';

export default function AnimeWatchlistEdit() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    url: '',
    description: '',
    status: '',
    category: '',
    total_episodes: 0,
    current_episode: 0,
    progress: 0,
    rating: 0,
    tags: '',
    is_favorite: false,
    is_active: true,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [coverError, setCoverError] = useState(false);
  const [loadingCover, setLoadingCover] = useState(false);

  useEffect(() => {
    if (isEdit && id) {
      loadAnime();
    }
  }, [id, isEdit]);

  const loadAnime = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const anime: AnimeWatchlist = await Service.getAnimeWatchlistItemApiV1AnimeWatchlistItemIdGet(Number(id));
      setFormData({
        title: anime.title || '',
        url: anime.url || '',
        description: anime.description || '',
        status: anime.status || '',
        category: anime.category || '',
        total_episodes: anime.total_episodes || 0,
        current_episode: anime.current_episode || 0,
        progress: anime.progress || 0,
        rating: anime.rating || 0,
        tags: anime.tags || '',
        is_favorite: anime.is_favorite || false,
        is_active: anime.is_active ?? true,
      });
      // 如果有封面URL，加载它
      if (anime.cover_image_url) {
        setCoverUrl(anime.cover_image_url);
      }
    } catch (error) {
      console.error('加载动漫失败:', error);
      setError('加载动漫失败');
    } finally {
      setLoading(false);
    }
  };

  const handleGetCoverUrl = async () => {
    if (!id) {
      alert('请先保存动漫');
      return;
    }
    setLoadingCover(true);
    try {
      const result = await Service.getAnimeCoverUrlApiV1AnimeWatchlistItemIdCoverUrlGet(Number(id));
      const fetched = result?.cover_url || '';
      setCoverUrl(fetched);
      setCoverError(false);
      if (fetched) {
        alert(`封面URL获取成功！${result?.message ? `\n${result.message}` : ''}`);
        // 抓取会同时更新标题/集数/标签等，回读服务端数据同步表单
        if (result?.updated_fields?.length) {
          loadAnime();
        }
      } else {
        alert(result?.message || '未获取到封面URL');
      }
    } catch (error) {
      console.error('获取封面URL失败:', error);
      alert('获取封面URL失败');
    } finally {
      setLoadingCover(false);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      if (isEdit && id) {
        const updateData: AnimeWatchlistUpdate = {
          title: formData.title || null,
          url: formData.url || null,
          description: formData.description || null,
          status: formData.status || null,
          category: formData.category || null,
          total_episodes: formData.total_episodes || null,
          current_episode: formData.current_episode || null,
          progress: formData.progress || null,
          rating: formData.rating || null,
          tags: formData.tags || null,
          is_favorite: formData.is_favorite,
          is_active: formData.is_active,
          cover_image_url: coverUrl || null,
        };
        await Service.updateAnimeWatchlistItemApiV1AnimeWatchlistItemIdPut(Number(id), updateData);
      } else {
        const createData: AnimeWatchlistCreate = {
          title: formData.title,
          url: formData.url,
          description: formData.description || undefined,
          status: formData.status || undefined,
          category: formData.category || undefined,
          total_episodes: formData.total_episodes || undefined,
          current_episode: formData.current_episode || undefined,
          progress: formData.progress || undefined,
          rating: formData.rating || undefined,
          tags: formData.tags || undefined,
          is_favorite: formData.is_favorite,
          is_active: formData.is_active,
          cover_image_url: coverUrl || undefined,
        };
        await Service.createAnimeWatchlistItemApiV1AnimeWatchlistPost(createData);
      }
      navigate('/anime-watchlist');
    } catch (error: unknown) {
      console.error('保存失败:', error);
      const err = error as { body?: { detail?: string }; message?: string };
      setError(err?.body?.detail || err?.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="wc-page anime-watchlist-edit">
      <div className="wc-page-header">
        <div className="wc-page-heading">
          <span className="wc-accent-bar" />
          <div>
            <h1 className="wc-page-title">{isEdit ? '编辑动漫' : '新建动漫'}</h1>
            <p className="wc-page-subtitle">维护追番追剧条目信息与观看进度。</p>
          </div>
        </div>
        <div className="wc-page-actions">
          <button type="button" onClick={() => navigate('/anime-watchlist')} className="wc-btn wc-btn-ghost">
            取消
          </button>
        </div>
      </div>

      {loading ? (
        <div className="wc-loading"><Loader2 size={18} className="wc-spinner" /> 加载中...</div>
      ) : (
      <div className="wc-card wc-card-pad">
      <form onSubmit={handleSubmit} className="wc-form">
        {error && <div className="wc-alert wc-alert-error">{error}</div>}

        <div className="wc-form-grid">
          <div className="wc-field wc-field-span">
            <label htmlFor="title" className="wc-label">标题<span className="wc-required">*</span></label>
            <input
              id="title"
              type="text"
              className="wc-input"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              placeholder="请输入动漫标题"
            />
          </div>

          <div className="wc-field wc-field-span">
            <label htmlFor="url" className="wc-label">观看链接<span className="wc-required">*</span></label>
            <input
              id="url"
              type="url"
              className="wc-input"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              required
              placeholder="https://example.com"
            />
          </div>

          <div className="wc-field wc-field-span">
            <label htmlFor="description" className="wc-label">描述</label>
            <textarea
              id="description"
              className="wc-textarea"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={5}
              placeholder="请输入动漫描述"
            />
          </div>

          <div className="wc-field">
            <label htmlFor="status" className="wc-label">状态</label>
            <select
              id="status"
              className="wc-select"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="">请选择</option>
              <option value="want_watch">想看</option>
              <option value="watching">在看</option>
              <option value="completed">已看完</option>
              <option value="dropped">已弃</option>
            </select>
          </div>

          <div className="wc-field">
            <label htmlFor="category" className="wc-label">分类</label>
            <select
              id="category"
              className="wc-select"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              <option value="">请选择</option>
              <option value="anime">动漫</option>
              <option value="drama">剧集</option>
              <option value="other">其他</option>
            </select>
          </div>

          <div className="wc-field">
            <label htmlFor="total_episodes" className="wc-label">总集数</label>
            <input
              id="total_episodes"
              type="number"
              className="wc-input"
              value={formData.total_episodes}
              onChange={(e) => setFormData({ ...formData, total_episodes: Number(e.target.value) })}
              min="0"
            />
          </div>

          <div className="wc-field">
            <label htmlFor="current_episode" className="wc-label">当前集数</label>
            <input
              id="current_episode"
              type="number"
              className="wc-input"
              value={formData.current_episode}
              onChange={(e) => setFormData({ ...formData, current_episode: Number(e.target.value) })}
              min="0"
            />
          </div>

          <div className="wc-field">
            <label htmlFor="progress" className="wc-label">观看进度 (%)</label>
            <input
              id="progress"
              type="number"
              className="wc-input"
              value={formData.progress}
              onChange={(e) => setFormData({ ...formData, progress: Number(e.target.value) })}
              min="0"
              max="100"
            />
          </div>

          <div className="wc-field">
            <label htmlFor="rating" className="wc-label">评分 (0-10)</label>
            <input
              id="rating"
              type="number"
              className="wc-input"
              value={formData.rating}
              onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
              min="0"
              max="10"
              step="0.1"
            />
          </div>

          <div className="wc-field wc-field-span">
            <label htmlFor="tags" className="wc-label">标签</label>
            <input
              id="tags"
              type="text"
              className="wc-input"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="多个标签用逗号分隔"
            />
          </div>

          <div className="wc-field wc-field-span">
            <label className="wc-label">封面图片</label>
            {isEdit && id && (
              <button
                type="button"
                onClick={handleGetCoverUrl}
                disabled={loadingCover}
                className="wc-btn wc-btn-secondary awe-cover-btn"
              >
                <ImageDown size={16} /> {loadingCover ? '获取中...' : '获取封面URL'}
              </button>
            )}
            <input
              type="text"
              className="wc-input"
              value={coverUrl}
              onChange={(e) => {
                setCoverUrl(e.target.value);
                setCoverError(false);
              }}
              placeholder="封面图片 URL（B 站条目可点上方按钮自动获取）"
            />
            {coverUrl && !coverError && (
              <>
                <img
                  src={coverUrl}
                  alt="封面预览"
                  className="awe-cover-preview"
                  referrerPolicy="no-referrer"
                  onError={() => setCoverError(true)}
                />
                <a
                  href={coverUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="wc-link awe-cover-link"
                >
                  查看封面 <ExternalLink size={13} />
                </a>
              </>
            )}
            {coverUrl && coverError && (
              <p className="awe-cover-error">封面加载失败：源站可能拦截了外链访问，请更换图片 URL</p>
            )}
          </div>
        </div>

        <div className="wc-check-row">
          <label className="wc-check">
            <input
              type="checkbox"
              checked={formData.is_favorite}
              onChange={(e) => setFormData({ ...formData, is_favorite: e.target.checked })}
            />
            收藏
          </label>

          <label className="wc-check">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
            />
            启用
          </label>
        </div>

        <div className="wc-form-actions">
          <button type="submit" className="wc-btn wc-btn-primary" disabled={saving}>
            {saving ? '保存中...' : '保存'}
          </button>
          <button
            type="button"
            className="wc-btn wc-btn-ghost"
            onClick={() => navigate('/anime-watchlist')}
            disabled={saving}
          >
            取消
          </button>
        </div>
      </form>
      </div>
      )}
    </div>
  );
}
