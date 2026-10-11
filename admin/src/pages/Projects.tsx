import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, BarChart3, Monitor, Tag, Star, GitFork, ExternalLink, RefreshCw, EyeOff, Pencil, Trash2, Loader2 } from 'lucide-react';
import { Service } from '../services';
import type { RelatedProject } from '../services/models/RelatedProject';
import './Projects.css';

export default function Projects() {
  const [projects, setProjects] = useState<RelatedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    platform: [] as Array<Record<string, any>>,
    tag: [] as Array<Record<string, any>>,
    language: [] as Array<Record<string, any>>,
  });
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    loadProjects();
    loadStats();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const response = await Service.getProjectsApiV1ProjectsGet();
      const projects = Array.isArray(response) ? response : [];
      setProjects(projects as RelatedProject[]);
    } catch (error) {
      console.error('加载项目失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const [platformStats, tagStats, languageStats] = await Promise.all([
        Service.getPlatformStatsApiV1ProjectsStatsPlatformGet(),
        Service.getTagStatsApiV1ProjectsStatsTagGet(),
        Service.getLanguageStatsApiV1ProjectsStatsLanguageGet(10),
      ]);
      setStats({
        platform: Array.isArray(platformStats) ? platformStats : [],
        tag: Array.isArray(tagStats) ? tagStats : [],
        language: Array.isArray(languageStats) ? languageStats : [],
      });
    } catch (error) {
      console.error('加载统计失败:', error);
    }
  };

  const handleRefresh = async (id: number) => {
    try {
      await Service.refreshProjectApiV1ProjectsRefreshProjectIdPost(id);
      alert('项目信息刷新成功！');
      loadProjects();
    } catch (error) {
      console.error('刷新失败:', error);
      alert('刷新失败');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个项目吗？')) return;

    try {
      await Service.deleteProjectApiV1ProjectsProjectIdDelete(id);
      loadProjects();
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败');
    }
  };

  const renderStatsSection = () => {
    if (!showStats) return null;
    return (
      <section className="wc-card wc-card-pad projects-stats-section">
        <div className="projects-stats-header">
          <h2 className="wc-section-title">项目统计</h2>
          <p className="wc-card-subtitle">按平台、标签、语言汇总</p>
        </div>
        <div className="projects-stats-grid">
          {stats.platform.length > 0 && (
            <div className="projects-stat-card">
              <h4>平台统计</h4>
              <div className="projects-stat-list">
                {stats.platform.map((stat, i) => (
                  <div key={i} className="projects-stat-item">
                    <span>{stat.platform || stat.name || '未知平台'}</span>
                    <span className="projects-stat-count">{stat.count || stat.total || 0}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {stats.tag.length > 0 && (
            <div className="projects-stat-card">
              <h4>标签统计</h4>
              <div className="projects-stat-list">
                {stats.tag.map((stat, i) => (
                  <div key={i} className="projects-stat-item">
                    <span>{stat.tag || stat.name || '未知标签'}</span>
                    <span className="projects-stat-count">{stat.count || stat.total || 0}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {stats.language.length > 0 && (
            <div className="projects-stat-card">
              <h4>语言统计</h4>
              <div className="projects-stat-list">
                {stats.language.map((stat, i) => (
                  <div key={i} className="projects-stat-item">
                    <span>{stat.language || stat.name || '未知语言'}</span>
                    <span className="projects-stat-count">{stat.count || stat.total || 0}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    );
  };

  const renderProjectRow = (project: RelatedProject) => (
    <div key={project.id} className="wc-list-row">
      <div className="wc-list-row-main">
        <h3 className="wc-list-row-title">
          {project.url ? (
            <a href={project.url} target="_blank" rel="noopener noreferrer" className="wc-link">
              {project.name} <ExternalLink size={13} />
            </a>
          ) : (
            project.name
          )}
        </h3>
        {project.description && <p className="wc-list-row-desc">{project.description}</p>}
        <div className="wc-list-row-meta">
          <span className="wc-badge wc-badge-info">{project.platform}</span>
          <span><Tag size={12} /> {project.tag}</span>
          {project.stars_count !== undefined && <span><Star size={12} /> {project.stars_count}</span>}
          {project.forks_count !== undefined && <span><GitFork size={12} /> {project.forks_count}</span>}
        </div>
      </div>
      <div className="wc-list-row-actions">
        <button type="button" className="wc-icon-btn" onClick={() => handleRefresh(project.id)} title="刷新项目信息"><RefreshCw size={15} /></button>
        <Link to={`/projects/${project.id}/edit`} className="wc-icon-btn" title="编辑"><Pencil size={15} /></Link>
        <button type="button" className="wc-icon-btn wc-icon-btn-danger" onClick={() => handleDelete(project.id)} title="删除"><Trash2 size={15} /></button>
      </div>
    </div>
  );

  return (
    <div className="wc-page projects-page">
      <div className="wc-page-header">
        <div className="wc-page-heading">
          <span className="wc-accent-bar" />
          <div>
            <h1 className="wc-page-title">项目管理</h1>
            <p className="wc-page-subtitle">管理开源项目与仓库信息。</p>
          </div>
        </div>
        <div className="wc-page-actions">
          <button type="button" className="wc-btn wc-btn-secondary" onClick={() => setShowStats(!showStats)}>
            {showStats ? <><EyeOff size={14} /> 隐藏统计</> : <><BarChart3 size={14} /> 查看统计</>}
          </button>
          <Link to="/projects/new" className="wc-btn wc-btn-primary"><Plus size={14} /> 新建项目</Link>
        </div>
      </div>

      {renderStatsSection()}

      {loading ? (
        <div className="wc-loading"><Loader2 size={18} className="wc-spinner" /> 加载中...</div>
      ) : (
        <div className="wc-list">
          {projects.length === 0 ? (
            <div className="wc-empty">
              <div className="wc-empty-icon"><Monitor size={28} strokeWidth={1.5} /></div>
              <p>暂无项目</p>
            </div>
          ) : (
            projects.map(renderProjectRow)
          )}
        </div>
      )}
    </div>
  );
}
