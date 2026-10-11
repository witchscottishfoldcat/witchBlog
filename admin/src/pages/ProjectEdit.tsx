import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Service } from '../services';
import './ProjectEdit.css';

export default function ProjectEdit() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    projectUrl: '',
    tag: '',
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit && id) {
      loadProject();
    }
  }, [id, isEdit]);

  const loadProject = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const project: any = await Service.getProjectApiV1ProjectsProjectIdGet(Number(id));
      setFormData({
        projectUrl: project.url || '',
        tag: project.tag || '',
      });
    } catch (error) {
      console.error('加载项目失败:', error);
      setError('加载项目失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      if (isEdit && id) {
        await Service.updateProjectApiV1ProjectsProjectIdPut(Number(id), formData.tag || null);
      } else {
        await Service.createProjectApiV1ProjectsPost(formData.projectUrl, formData.tag || '策划中');
      }
      navigate('/projects');
    } catch (error: any) {
      console.error('保存失败:', error);
      setError(error?.body?.detail || error?.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="wc-page project-edit">
      <div className="wc-page-header">
        <div className="wc-page-heading">
          <span className="wc-accent-bar" />
          <div>
            <h1 className="wc-page-title">{isEdit ? '编辑项目' : '新建项目'}</h1>
            <p className="wc-page-subtitle">{isEdit ? '更新项目标签。' : '通过项目 URL 快速创建项目。'}</p>
          </div>
        </div>
        <div className="wc-page-actions">
          <button type="button" onClick={() => navigate('/projects')} className="wc-btn wc-btn-ghost">
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

        {!isEdit && (
          <div className="wc-field">
            <label htmlFor="projectUrl" className="wc-label">项目URL<span className="wc-required">*</span></label>
            <input
              id="projectUrl"
              type="url"
              className="wc-input"
              value={formData.projectUrl}
              onChange={(e) => setFormData({ ...formData, projectUrl: e.target.value })}
              required
              placeholder="https://github.com/username/repo"
            />
            <p className="wc-help">请输入GitHub、GitLab等平台的项目URL</p>
          </div>
        )}

        <div className="wc-field">
          <label htmlFor="tag" className="wc-label">标签</label>
          <input
            id="tag"
            type="text"
            className="wc-input"
            value={formData.tag}
            onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
            placeholder="例如: 策划中、进行中、已完成"
          />
          {!isEdit && <p className="wc-help">留空时默认为「策划中」。</p>}
        </div>

        <div className="wc-form-actions">
          <button type="submit" className="wc-btn wc-btn-primary" disabled={saving}>
            {saving ? '保存中...' : '保存'}
          </button>
          <button
            type="button"
            className="wc-btn wc-btn-ghost"
            onClick={() => navigate('/projects')}
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
