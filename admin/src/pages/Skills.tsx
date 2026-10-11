import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, BarChart3, FolderOpen, Layers, Calendar, EyeOff, Pencil, Trash2, ChevronDown, Loader2 } from 'lucide-react';
import { Service } from '../services';
import type { Skill } from '../services/models/Skill';
import type { SkillStats } from '../services/models/SkillStats';
import './Skills.css';

export default function Skills() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SkillStats | null>(null);
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    loadSkills();
    loadStats();
  }, []);

  const loadSkills = async () => {
    setLoading(true);
    try {
      const response = await Service.readSkillsApiV1SkillsGet();
      setSkills(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('加载技能失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await Service.getSkillStatsApiV1SkillsStatsGet();
      setStats(statsData);
    } catch (error) {
      console.error('加载统计失败:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个技能吗？')) return;

    try {
      await Service.deleteSkillApiV1SkillsSkillIdDelete(id);
      loadSkills();
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败');
    }
  };

  const renderStats = () => {
    if (!stats || !showStats) return null;
    return (
      <section className="wc-panel skills-stats">
        <button type="button" className="wc-panel-header open" onClick={() => setShowStats(!showStats)}>
          技能统计 <ChevronDown size={16} className="wc-panel-toggle" />
        </button>
        <div className="wc-panel-body">
          <div className="wc-stats-grid">
            <div className="wc-stat">
              <div className="wc-stat-icon"><Layers size={20} /></div>
              <div className="wc-stat-body">
                <span className="wc-stat-value">{stats.total_skills || 0}</span>
                <span className="wc-stat-label">总技能数</span>
              </div>
            </div>
            <div className="wc-stat">
              <div className="wc-stat-icon"><Calendar size={20} /></div>
              <div className="wc-stat-body">
                <span className="wc-stat-value">{stats.total_learning_days || 0}</span>
                <span className="wc-stat-label">总学习天数</span>
              </div>
            </div>
          </div>
          <div className="skills-dist-grid">
            {stats.skills_by_category && Object.keys(stats.skills_by_category).length > 0 && (
              <div className="skills-dist-card">
                <h4 className="wc-section-title">按分类统计</h4>
                <div className="skills-dist-list">
                  {Object.entries(stats.skills_by_category).map(([category, count]) => (
                    <div key={category} className="skills-dist-item">
                      <span>{category || '未分类'}</span>
                      <span className="wc-badge wc-badge-muted">{count as number}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {stats.skills_by_level && Object.keys(stats.skills_by_level).length > 0 && (
              <div className="skills-dist-card">
                <h4 className="wc-section-title">按等级统计</h4>
                <div className="skills-dist-list">
                  {Object.entries(stats.skills_by_level).map(([level, count]) => (
                    <div key={level} className="skills-dist-item">
                      <span>{level || '未设置'}</span>
                      <span className="wc-badge wc-badge-muted">{count as number}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    );
  };

  const renderSkillRow = (skill: Skill) => (
    <div key={skill.id} className="wc-list-row">
      <div className="wc-list-row-main">
        <h3 className="wc-list-row-title">{skill.name}</h3>
        {skill.description && <p className="wc-list-row-desc">{skill.description}</p>}
        <div className="wc-list-row-meta">
          <span><FolderOpen size={12} /> {skill.category}</span>
          <span className="wc-badge wc-badge-info">等级: {skill.current_level || '未设置'}</span>
          <span><Calendar size={12} /> {new Date(skill.created_at).toLocaleDateString()}</span>
        </div>
      </div>
      <div className="wc-list-row-actions">
        <Link to={`/skills/${skill.id}/edit`} className="wc-icon-btn" title="编辑"><Pencil size={15} /></Link>
        <button type="button" className="wc-icon-btn wc-icon-btn-danger" onClick={() => handleDelete(skill.id)} title="删除"><Trash2 size={15} /></button>
      </div>
    </div>
  );

  return (
    <div className="wc-page skills-page">
      <header className="wc-page-header">
        <div className="wc-page-heading">
          <span className="wc-accent-bar" />
          <div>
            <h1 className="wc-page-title">技能管理</h1>
            <p className="wc-page-subtitle">管理技能分类与学习进度。</p>
          </div>
        </div>
        <div className="wc-page-actions">
          <button type="button" className="wc-btn wc-btn-secondary" onClick={() => setShowStats(!showStats)}>
            {showStats ? <><EyeOff size={14} /> 隐藏统计</> : <><BarChart3 size={14} /> 查看统计</>}
          </button>
          <Link to="/skills/new" className="wc-btn wc-btn-primary"><Plus size={14} /> 新建技能</Link>
        </div>
      </header>

      {renderStats()}

      {loading ? (
        <div className="wc-loading"><Loader2 size={18} className="wc-spinner" />加载中...</div>
      ) : (
        <div className="wc-list">
          {skills.length === 0 ? (
            <div className="wc-empty">
              <span className="wc-empty-icon"><Layers size={24} strokeWidth={1.5} /></span>
              <p>暂无技能</p>
            </div>
          ) : (
            skills.map(renderSkillRow)
          )}
        </div>
      )}
    </div>
  );
}
