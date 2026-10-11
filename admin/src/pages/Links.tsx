import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, BarChart3, Shuffle, FolderOpen, ExternalLink, Pencil, Trash2, ChevronDown, Globe, RefreshCw, Loader2 } from 'lucide-react';
import { Service } from '../services';
import type { Link as LinkType } from '../services/models/Link';
import type { LinkList } from '../services/models/LinkList';
import type { LinkCategoryStats } from '../services/models/LinkCategoryStats';
import './Links.css';

export default function Links() {
  const [links, setLinks] = useState<LinkType[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<LinkCategoryStats[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [showStats, setShowStats] = useState(false);
  const [randomLinks, setRandomLinks] = useState<LinkType[]>([]);
  const [showRandom, setShowRandom] = useState(false);
  const [randomCategory, setRandomCategory] = useState<string>('');
  const limit = 20;

  useEffect(() => {
    loadLinks();
    loadStats();
    loadTags();
  }, [page]);

  const loadLinks = async () => {
    setLoading(true);
    try {
      const response: LinkList = await Service.getLinksPaginatedApiV1LinksListGet(undefined, undefined, undefined, page, limit);
      setLinks(response.items || []);
      setTotal(response.total || 0);
    } catch (error) {
      console.error('加载链接失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await Service.getCategoryStatsApiV1LinksCategoriesStatsGet();
      setStats(Array.isArray(statsData) ? statsData : []);
    } catch (error) {
      console.error('加载统计失败:', error);
    }
  };

  const loadTags = async () => {
    try {
      const tagsData = await Service.getAllTagsApiV1LinksTagsAllGet();
      setAllTags(Array.isArray(tagsData) ? tagsData : []);
    } catch (error) {
      console.error('加载标签失败:', error);
    }
  };

  const handleGetRandomLinks = async (category?: string) => {
    try {
      let randomData: LinkType[];
      if (category) {
        randomData = await Service.getRandomLinksByCategoryApiV1LinksRandomCategoryGet(category, 5);
      } else {
        randomData = await Service.getRandomLinksApiV1LinksRandomGet(undefined, 5);
      }
      setRandomLinks(Array.isArray(randomData) ? randomData : []);
      setShowRandom(true);
    } catch (error) {
      console.error('获取随机链接失败:', error);
    }
  };

  const handleGetLinksByTags = async (tags: string) => {
    try {
      const linksData = await Service.getLinksByTagsApiV1LinksByTagsListGet(tags);
      setLinks(Array.isArray(linksData) ? linksData : []);
      setTotal(Array.isArray(linksData) ? linksData.length : 0);
      setPage(1);
    } catch (error) {
      console.error('按标签获取链接失败:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个链接吗？')) return;
    try {
      await Service.deleteLinkApiV1LinksLinkIdDelete(id);
      loadLinks();
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败');
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="wc-page">
      <div className="wc-page-header">
        <div className="wc-page-heading">
          <span className="wc-accent-bar" />
          <div>
            <h1 className="wc-page-title">链接</h1>
            <p className="wc-page-subtitle">管理收藏的链接与导航分类。</p>
          </div>
        </div>
        <div className="wc-page-actions">
          <button type="button" className="wc-btn wc-btn-secondary" onClick={() => setShowStats(!showStats)}>
            <BarChart3 size={14} /> {showStats ? '隐藏统计' : '统计'}
          </button>
          <button type="button" className="wc-btn wc-btn-secondary" onClick={() => { setShowRandom(!showRandom); if (!showRandom) handleGetRandomLinks(); }}>
            <Shuffle size={14} /> {showRandom ? '隐藏随机' : '随机'}
          </button>
          <Link to="/links/new" className="wc-btn wc-btn-primary">
            <Plus size={14} /> 新建链接
          </Link>
        </div>
      </div>

      {showStats && (
        <section className="wc-panel links-panel">
          <button type="button" className="wc-panel-header open" onClick={() => setShowStats(!showStats)}>
            链接统计 <ChevronDown size={16} className="wc-panel-toggle" />
          </button>
          <div className="wc-panel-body">
            <div className="links-stats-grid">
              {stats.length > 0 && (
                <div>
                  <h4>分类统计</h4>
                  <div className="links-stat-list">
                    {stats.map((stat, i) => (
                      <div key={i} className="links-stat-item">
                        <span>{stat.category || '未分类'}</span>
                        <span className="links-stat-count">{stat.count || 0}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {allTags.length > 0 && (
                <div>
                  <h4>所有标签</h4>
                  <div className="links-tags-wrap">
                    {allTags.map((tag, i) => (
                      <button key={i} type="button" className="wc-chip" onClick={() => handleGetLinksByTags(tag)}>
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {showRandom && (
        <section className="wc-panel links-panel">
          <button type="button" className="wc-panel-header open" onClick={() => setShowRandom(!showRandom)}>
            随机链接 <ChevronDown size={16} className="wc-panel-toggle" />
          </button>
          <div className="wc-panel-body">
            <div className="links-panel-controls">
              <select value={randomCategory} onChange={(e) => setRandomCategory(e.target.value)} className="wc-select links-random-select">
                <option value="">全部分类</option>
                {stats.map((stat, i) => (
                  <option key={i} value={stat.category || ''}>{stat.category || '未分类'}</option>
                ))}
              </select>
              <button type="button" className="wc-btn wc-btn-secondary" onClick={() => handleGetRandomLinks(randomCategory || undefined)}>
                <RefreshCw size={14} /> 换一批
              </button>
            </div>
            {randomLinks.length > 0 ? (
              <div className="wc-list">
                {randomLinks.map((link) => (
                  <div key={link.id} className="wc-list-row">
                    <div className="wc-list-row-main">
                      <h3 className="wc-list-row-title">
                        <a href={link.url} target="_blank" rel="noopener noreferrer" className="wc-link">{link.name}</a>
                      </h3>
                      {link.description && <p className="wc-list-row-desc">{link.description}</p>}
                      <div className="wc-list-row-meta">
                        <span><Globe size={12} /> <span className="links-url">{link.url}</span></span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="links-empty-inline">暂无随机链接</div>
            )}
          </div>
        </section>
      )}

      {loading ? (
        <div className="wc-loading"><Loader2 size={18} className="wc-spinner" />加载中...</div>
      ) : (
        <>
          <div className="wc-list">
            {links.length === 0 ? (
              <div className="wc-empty">
                <span className="wc-empty-icon"><ExternalLink size={24} strokeWidth={1.5} /></span>
                <p>暂无链接</p>
              </div>
            ) : (
              links.map((link) => (
                <div key={link.id} className="wc-list-row">
                  <div className="wc-list-row-main">
                    <h3 className="wc-list-row-title">
                      <a href={link.url} target="_blank" rel="noopener noreferrer" className="wc-link">{link.name}</a>
                    </h3>
                    {link.description && <p className="wc-list-row-desc">{link.description}</p>}
                    <div className="wc-list-row-meta">
                      <span><Globe size={12} /> <span className="links-url">{link.url}</span></span>
                      <span><FolderOpen size={12} /> {link.category || '未分类'}</span>
                      {typeof link.tags === 'string' && link.tags && (
                        <span className="wc-tag-row">
                          {link.tags.split(',').filter(t => t.trim()).map((tag, i) => (
                            <span key={i} className="wc-tag">{tag.trim()}</span>
                          ))}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="wc-list-row-actions">
                    <Link to={`/links/${link.id}/edit`} className="wc-icon-btn" title="编辑"><Pencil size={15} /></Link>
                    <button type="button" className="wc-icon-btn wc-icon-btn-danger" onClick={() => handleDelete(link.id)} title="删除"><Trash2 size={15} /></button>
                  </div>
                </div>
              ))
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
