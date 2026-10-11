import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Loader2, Plus, X, FolderOpen, Monitor, Tag } from 'lucide-react';
import { Service } from '../services';
import type { SkillCreate, SkillUpdate, SkillPeriodCreate, SkillPeriodUpdate, SkillPeriod, RelatedProject } from '../services';
import './SkillEdit.css';

export default function SkillEdit() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
  });
  const [periods, setPeriods] = useState<SkillPeriod[]>([]);
  const [projects, setProjects] = useState<RelatedProject[]>([]);
  const [showPeriodForm, setShowPeriodForm] = useState(false);
  const [showProjects, setShowProjects] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [periodForm, setPeriodForm] = useState({
    start_date: '',
    end_date: '',
    notes: '',
  });
  const [editingPeriodId, setEditingPeriodId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit && id) {
      loadSkill();
    }
  }, [id, isEdit]);

  const loadSkill = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const skill: any = await Service.readSkillApiV1SkillsSkillIdGet(Number(id), true);
      setFormData({
        name: skill.name || '',
        category: skill.category || '',
        description: skill.description || '',
      });
      // 加载时间段
      if (skill.periods) {
        setPeriods(skill.periods);
      } else {
        // 如果没有包含时间段，单独加载
        const periodsData = await Service.readSkillPeriodsApiV1SkillsSkillIdPeriodsGet(Number(id));
        setPeriods(Array.isArray(periodsData) ? periodsData : []);
      }
    } catch (error) {
      console.error('加载技能失败:', error);
      setError('加载技能失败');
    } finally {
      setLoading(false);
    }
  };

  const loadPeriods = async () => {
    if (!id) return;
    try {
      const periodsData = await Service.readSkillPeriodsApiV1SkillsSkillIdPeriodsGet(Number(id));
      setPeriods(Array.isArray(periodsData) ? periodsData : []);
    } catch (error) {
      console.error('加载时间段失败:', error);
    }
  };

  const loadProjects = async () => {
    if (!id) return;
    setLoadingProjects(true);
    try {
      const projectsData = await Service.getSkillProjectsApiV1SkillsSkillIdProjectsGet(Number(id));
      setProjects(Array.isArray(projectsData) ? projectsData : []);
      setShowProjects(true);
    } catch (error) {
      console.error('加载项目失败:', error);
      alert('加载项目失败');
    } finally {
      setLoadingProjects(false);
    }
  };

  const toDateTimeISO = (dateStr: string) => {
    if (!dateStr) return dateStr;
    if (/^\d{4}-\d{2}-\d{2}T/.test(dateStr)) return dateStr;
    return `${dateStr}T00:00:00`;
  };

  const handleAddPeriod = async () => {
    if (!id) {
      alert('请先保存技能');
      return;
    }

    if (!periodForm.start_date) {
      alert('请选择开始日期');
      return;
    }

    try {
      const createData: SkillPeriodCreate = {
        start_date: toDateTimeISO(periodForm.start_date),
        ...(periodForm.end_date ? { end_date: toDateTimeISO(periodForm.end_date) } : {}),
        ...(periodForm.notes?.trim() ? { notes: periodForm.notes.trim() } : {}),
      };
      await Service.createSkillPeriodApiV1SkillsSkillIdPeriodsPost(Number(id), createData);
      alert('时间段添加成功！');
      setPeriodForm({ start_date: '', end_date: '', notes: '' });
      setShowPeriodForm(false);
      loadPeriods();
    } catch (err: any) {
      console.error('添加时间段失败:', err, err?.body);
      const body = err?.body;
      const detail = body?.detail ?? body;
      let msg = '添加时间段失败';
      if (typeof detail === 'string') msg = detail;
      else if (Array.isArray(detail) && detail.length > 0) {
        msg = detail.map((d: { loc?: string[]; msg?: string }) => `${(d.loc || []).join('.')}: ${d.msg || ''}`).join('； ');
      } else if (body && typeof body === 'object') msg = JSON.stringify(body);
      else if (err?.message) msg = err.message;
      alert(msg);
    }
  };

  const handleUpdatePeriod = async (periodId: number) => {
    if (!id) return;

    try {
      const updateData: SkillPeriodUpdate = {
        start_date: periodForm.start_date || null,
        end_date: periodForm.end_date || null,
        notes: periodForm.notes?.trim() || null,
      };
      await Service.updateSkillPeriodApiV1SkillsSkillIdPeriodsPeriodIdPut(Number(id), periodId, updateData);
      alert('时间段更新成功！');
      setPeriodForm({ start_date: '', end_date: '', notes: '' });
      setEditingPeriodId(null);
      setShowPeriodForm(false);
      loadPeriods();
    } catch (err: any) {
      console.error('更新时间段失败:', err);
      const detail = err?.body?.detail;
      let msg = '更新时间段失败';
      if (typeof detail === 'string') msg = detail;
      else if (Array.isArray(detail) && detail.length > 0) {
        msg = detail.map((d: { loc?: string[]; msg?: string }) => `${(d.loc || []).join('.')}: ${d.msg || ''}`).join('； ');
      } else if (err?.message) msg = err.message;
      alert(msg);
    }
  };

  const handleDeletePeriod = async (periodId: number) => {
    if (!id) return;
    if (!confirm('确定要删除这个时间段吗？')) return;

    try {
      await Service.deleteSkillPeriodApiV1SkillsSkillIdPeriodsPeriodIdDelete(Number(id), periodId);
      alert('时间段删除成功！');
      loadPeriods();
    } catch (error) {
      console.error('删除时间段失败:', error);
      alert('删除时间段失败');
    }
  };

  const handleAddCurrentPeriod = async () => {
    if (!id) {
      alert('请先保存技能');
      return;
    }

    const startDate = prompt('请输入开始日期 (YYYY-MM-DD):');
    if (!startDate) return;

    const notes = prompt('请输入备注（可选）:') || '';

    try {
      await Service.addCurrentPeriodApiV1SkillsSkillIdPeriodsCurrentPost(
        Number(id),
        startDate,
        notes || undefined
      );
      alert('当前时间段添加成功！');
      loadPeriods();
    } catch (error) {
      console.error('添加当前时间段失败:', error);
      alert('添加当前时间段失败');
    }
  };

  const startEditPeriod = (period: SkillPeriod) => {
    setEditingPeriodId(period.id);
    setPeriodForm({
      start_date: period.start_date ? period.start_date.split('T')[0] : '',
      end_date: period.end_date ? period.end_date.split('T')[0] : '',
      notes: period.notes || '',
    });
    setShowPeriodForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      if (isEdit && id) {
        const updateData: SkillUpdate = {
          name: formData.name || null,
          category: formData.category || null,
          description: formData.description || null,
        };
        await Service.updateSkillApiV1SkillsSkillIdPut(Number(id), updateData);
      } else {
        const createData: SkillCreate = {
          name: formData.name,
          category: formData.category,
          description: formData.description || null,
        };
        await Service.createSkillApiV1SkillsPost(createData);
      }
      navigate('/skills');
    } catch (error: any) {
      console.error('保存失败:', error);
      setError(error?.body?.detail || error?.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="wc-page skill-edit">
      <header className="wc-page-header">
        <div className="wc-page-heading">
          <span className="wc-accent-bar" />
          <div>
            <h1 className="wc-page-title">{isEdit ? '编辑技能' : '新建技能'}</h1>
          </div>
        </div>
        <div className="wc-page-actions">
          <button type="button" onClick={() => navigate('/skills')} className="wc-btn wc-btn-ghost">
            取消
          </button>
        </div>
      </header>

      {loading ? (
        <div className="wc-loading" style={{ minHeight: '12rem' }}><Loader2 size={18} className="wc-spinner" />加载中...</div>
      ) : (
      <form onSubmit={handleSubmit} className="wc-form">
        {error && <div className="wc-alert wc-alert-error">{error}</div>}

        <div className="wc-card wc-card-pad">
          <div className="wc-form">
            <div className="wc-field">
              <label htmlFor="name" className="wc-label">名称<span className="wc-required">*</span></label>
              <input
                id="name"
                type="text"
                className="wc-input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="请输入技能名称"
              />
            </div>

            <div className="wc-field">
              <label htmlFor="description" className="wc-label">描述</label>
              <textarea
                id="description"
                className="wc-textarea"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={5}
                placeholder="请输入技能描述"
              />
            </div>

            <div className="wc-field">
              <label htmlFor="category" className="wc-label">类别<span className="wc-required">*</span></label>
              <input
                id="category"
                type="text"
                className="wc-input"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required={!isEdit}
                placeholder="例如: 编程、设计、语言"
              />
            </div>
          </div>
        </div>

        {isEdit && id && (
          <div className="wc-card">
            <div className="wc-card-header">
              <h3 className="wc-card-title">学习时间段</h3>
              <div className="skill-section-actions">
                <button
                  type="button"
                  onClick={handleAddCurrentPeriod}
                  className="wc-btn wc-btn-secondary wc-btn-sm"
                >
                  <Plus size={14} /> 添加当前时间段
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPeriodForm(!showPeriodForm);
                    if (showPeriodForm) {
                      setPeriodForm({ start_date: '', end_date: '', notes: '' });
                      setEditingPeriodId(null);
                    }
                  }}
                  className="wc-btn wc-btn-secondary wc-btn-sm"
                >
                  {showPeriodForm ? <><X size={14} /> 取消</> : <><Plus size={14} /> 添加时间段</>}
                </button>
              </div>
            </div>

            <div className="wc-card-body">
              {showPeriodForm && (
                <div className="period-form">
                  <div className="wc-form-grid">
                    <div className="wc-field">
                      <label className="wc-label">开始日期<span className="wc-required">*</span></label>
                      <input
                        type="date"
                        className="wc-input"
                        value={periodForm.start_date}
                        onChange={(e) => setPeriodForm({ ...periodForm, start_date: e.target.value })}
                        required
                      />
                    </div>
                    <div className="wc-field">
                      <label className="wc-label">结束日期</label>
                      <input
                        type="date"
                        className="wc-input"
                        value={periodForm.end_date}
                        onChange={(e) => setPeriodForm({ ...periodForm, end_date: e.target.value })}
                      />
                    </div>
                    <div className="wc-field wc-field-span">
                      <label className="wc-label">备注</label>
                      <textarea
                        className="wc-textarea period-notes-input"
                        value={periodForm.notes}
                        onChange={(e) => setPeriodForm({ ...periodForm, notes: e.target.value })}
                        rows={2}
                        placeholder="时间段备注（可选）"
                      />
                    </div>
                  </div>
                  <div className="period-form-actions">
                    <button
                      type="button"
                      onClick={editingPeriodId ? () => handleUpdatePeriod(editingPeriodId) : handleAddPeriod}
                      className="wc-btn wc-btn-primary wc-btn-sm"
                    >
                      {editingPeriodId ? '更新' : '添加'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowPeriodForm(false);
                        setPeriodForm({ start_date: '', end_date: '', notes: '' });
                        setEditingPeriodId(null);
                      }}
                      className="wc-btn wc-btn-ghost wc-btn-sm"
                    >
                      取消
                    </button>
                  </div>
                </div>
              )}

              {periods.length > 0 ? (
                <div className="periods-list">
                  {periods.map((period) => (
                    <div key={period.id} className="period-item">
                      <div className="period-item-main">
                        <div className="period-date">
                          {new Date(period.start_date).toLocaleDateString()} - {period.end_date ? new Date(period.end_date).toLocaleDateString() : '至今'}
                        </div>
                        {period.notes && <div className="period-notes">{period.notes}</div>}
                      </div>
                      <div className="period-item-actions">
                        <button
                          type="button"
                          onClick={() => startEditPeriod(period)}
                          className="wc-btn wc-btn-secondary wc-btn-sm"
                        >
                          编辑
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePeriod(period.id)}
                          className="wc-btn wc-btn-danger wc-btn-sm"
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="skill-empty">暂无学习时间段</div>
              )}
            </div>
          </div>
        )}

        {isEdit && id && (
          <div className="wc-card">
            <div className="wc-card-header">
              <h3 className="wc-card-title">关联项目</h3>
              <button
                type="button"
                onClick={loadProjects}
                disabled={loadingProjects}
                className="wc-btn wc-btn-secondary wc-btn-sm"
              >
                {loadingProjects ? '加载中...' : <><FolderOpen size={14} /> 查看关联项目</>}
              </button>
            </div>

            {showProjects && (
              <div className="wc-card-body">
                {projects.length > 0 ? (
                  <div className="projects-list">
                    {projects.map((project) => (
                      <div key={project.id} className="project-item">
                        <div className="project-item-main">
                          <div className="project-name">{project.name}</div>
                          {project.description && <div className="project-description">{project.description}</div>}
                          <div className="project-meta">
                            <span><Monitor size={12} /> {project.platform}</span>
                            {project.tag && <span><Tag size={12} /> {project.tag}</span>}
                          </div>
                        </div>
                        <Link
                          to={`/projects/${project.id}/edit`}
                          className="wc-link"
                        >
                          查看
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="skill-empty">暂无关联项目</div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="wc-form-actions">
          <button type="submit" className="wc-btn wc-btn-primary" disabled={saving}>
            {saving ? '保存中...' : '保存'}
          </button>
          <button
            type="button"
            className="wc-btn wc-btn-ghost"
            onClick={() => navigate('/skills')}
            disabled={saving}
          >
            取消
          </button>
        </div>
      </form>
      )}
    </div>
  );
}
