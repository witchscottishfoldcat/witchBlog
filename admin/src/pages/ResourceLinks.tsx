import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, BarChart3, FolderOpen, Bookmark, Pencil, Trash2, ChevronDown, Globe, Loader2 } from 'lucide-react';
import { Service } from '../services';
import type { ResourceLink } from '../services/models/ResourceLink';
import type { ResourceLinkCategoryStats } from '../services/models/ResourceLinkCategoryStats';
import type { ResourceLinkTagStats } from '../services/models/ResourceLinkTagStats';
import './ResourceLinks.css';

export default function ResourceLinks() {
  const [links, setLinks] = useState<ResourceLink[]>([]);
  const [_allLinks, setAllLinks] = useState<ResourceLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState<ResourceLinkCategoryStats[]>([]);
  const [tags, setTags] = useState<ResourceLinkTagStats[]>([]);
  const [showCategories, setShowCategories] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedTags] = useState<string>('');
  const [isActive] = useState<boolean | null>(true);
  const limit = 20;

  useEffect(() => {
    loadLinks();
    loadCategories();
    loadTags();
  }, [page, selectedCategory, selectedTags, isActive]);

  const loadLinks = async () => {
    setLoading(true);
    try {
      // 使用 GET /api/v1/resource-links/ API，它返回数组
      const response: ResourceLink[] = await Service.getResourceLinksApiV1ResourceLinksGet(
        selectedCategory || undefined, // category
        selectedTags || undefined,     // tags
        isActive,                       // isActive
        undefined,                      // skip (不使用skip，我们自己分页)
        1000,                           // limit (获取所有，然后前端分页)
        'sort_order'                    // sortBy
      );

      const allLinksData = Array.isArray(response) ? response : [];
      setAllLinks(allLinksData);
      setTotal(allLinksData.length);

      // 前端分页
      const skip = (page - 1) * limit;
      const paginatedLinks = allLinksData.slice(skip, skip + limit);
      setLinks(paginatedLinks);
    } catch (error: any) {
      console.error('加载资源链接失败:', error);
      alert(`加载资源链接失败: ${error?.message || error?.body?.detail || '未知错误'}`);
      setLinks([]);
      setAllLinks([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const categoriesData = await Service.getResourceLinkCategoriesApiV1ResourceLinksCategoriesGet();
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (error) {
      console.error('加载分类失败:', error);
    }
  };

  const loadTags = async () => {
    try {
      const tagsData = await Service.getResourceLinkTagsApiV1ResourceLinksTagsGet();
      setTags(Array.isArray(tagsData) ? tagsData : []);
    } catch (error) {
      console.error('加载标签失败:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个资源链接吗？')) return;

    try {
      await Service.deleteResourceLinkApiV1ResourceLinksLinkIdDelete(id);
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
            <h1 className="wc-page-title">资源链接</h1>
            <p className="wc-page-subtitle">管理资源导航与分类。</p>
          </div>
        </div>
        <div className="wc-page-actions">
          <button type="button" className="wc-btn wc-btn-secondary" onClick={() => setShowCategories(!showCategories)}>
            <BarChart3 size={14} /> {showCategories ? '隐藏分类' : '查看分类'}
          </button>
          <Link to="/resource-links/new" className="wc-btn wc-btn-primary">
            <Plus size={14} /> 新建资源链接
          </Link>
        </div>
      </div>

      {showCategories && (
        <section className="wc-panel reslinks-panel">
          <button type="button" className="wc-panel-header open" onClick={() => setShowCategories(!showCategories)}>
            分类和标签统计 <ChevronDown size={16} className="wc-panel-toggle" />
          </button>
          <div className="wc-panel-body">
            <div className="reslinks-stats-grid">
              {categories.length > 0 && (
                <div>
                  <h4>分类统计</h4>
                  <div className="reslinks-stat-list">
                    <button
                      type="button"
                      onClick={() => { setSelectedCategory(''); setPage(1); }}
                      className={`reslinks-stat-item ${selectedCategory === '' ? 'active' : ''}`}
                    >
                      <span>全部</span>
                      <span className="reslinks-stat-count">{categories.reduce((sum, cat) => sum + (cat.count || 0), 0)}</span>
                    </button>
                    {categories.map((cat, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => { setSelectedCategory(cat.category || ''); setPage(1); }}
                        className={`reslinks-stat-item ${selectedCategory === cat.category ? 'active' : ''}`}
                      >
                        <span>{cat.category || '未分类'}</span>
                        <span className="reslinks-stat-count">{cat.count || 0}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {tags.length > 0 && (
                <div>
                  <h4>标签统计</h4>
                  <div className="reslinks-stat-list">
                    {tags.map((tag, i) => (
                      <div key={i} className="reslinks-stat-item static">
                        <span>{tag.tag || '无标签'}</span>
                        <span className="reslinks-stat-count">{tag.count || 0}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
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
                <span className="wc-empty-icon"><Bookmark size={24} strokeWidth={1.5} /></span>
                <p>暂无资源链接</p>
              </div>
            ) : (
              links.map((link) => (
                <div key={link.id} className="wc-list-row">
                  <div className="wc-list-row-main">
                    <h3 className="wc-list-row-title">
                      <a href={link.url} target="_blank" rel="noopener noreferrer" className="wc-link">{link.title}</a>
                      <span className={`wc-badge ${link.is_active ? 'wc-badge-success' : 'wc-badge-muted'}`}>
                        {link.is_active ? '启用' : '停用'}
                      </span>
                    </h3>
                    {link.description && <p className="wc-list-row-desc">{link.description}</p>}
                    <div className="wc-list-row-meta">
                      <span><Globe size={12} /> <span className="reslinks-url">{link.url}</span></span>
                      <span><FolderOpen size={12} /> {link.category || '未分类'}</span>
                      {link.sort_order !== undefined && <span>排序: {link.sort_order}</span>}
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
                    <Link to={`/resource-links/${link.id}/edit`} className="wc-icon-btn" title="编辑"><Pencil size={15} /></Link>
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
