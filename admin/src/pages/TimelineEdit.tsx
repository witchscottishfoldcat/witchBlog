import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2, Plus, X } from 'lucide-react';
import { Service } from '../services';
import type { TimelineCreate, TimelineUpdate, TimelineResponse } from '../services';
import './TimelineEdit.css';

export default function TimelineEdit() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    start_date: '',
    end_date: '',
    location: '',
    tags: [] as string[],
    skills: [] as string[],
    tagInput: '',
    skillInput: '',
    is_public: false,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit && id) {
      loadTimeline();
    }
  }, [id, isEdit]);

  const loadTimeline = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const timeline: TimelineResponse = await Service.getTimelineApiV1TimelinesTimelineIdGet(Number(id));
      setFormData({
        title: timeline.title || '',
        subtitle: timeline.subtitle || '',
        description: timeline.description || '',
        start_date: timeline.start_date ? timeline.start_date.split('T')[0] : '',
        end_date: timeline.end_date ? timeline.end_date.split('T')[0] : '',
        location: timeline.location || '',
        tags: timeline.tags || [],
        skills: timeline.skills || [],
        tagInput: '',
        skillInput: '',
        is_public: timeline.is_public || false,
      });
    } catch (error) {
      console.error('加载时间线失败:', error);
      setError('加载时间线失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = () => {
    if (formData.tagInput.trim()) {
      setFormData({
        ...formData,
        tags: [...formData.tags, formData.tagInput.trim()],
        tagInput: '',
      });
    }
  };

  const handleRemoveTag = (index: number) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((_, i) => i !== index),
    });
  };

  const handleAddSkill = () => {
    if (formData.skillInput.trim()) {
      setFormData({
        ...formData,
        skills: [...formData.skills, formData.skillInput.trim()],
        skillInput: '',
      });
    }
  };

  const handleRemoveSkill = (index: number) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      if (isEdit && id) {
        const updateData: TimelineUpdate = {
          title: formData.title,
          start_date: formData.start_date,
          subtitle: formData.subtitle || null,
          description: formData.description || null,
          end_date: formData.end_date || null,
          location: formData.location || null,
          tags: formData.tags.length > 0 ? formData.tags : null,
          skills: formData.skills.length > 0 ? formData.skills : null,
          is_public: formData.is_public,
        };
        await Service.updateTimelineApiV1TimelinesTimelineIdPut(Number(id), updateData);
      } else {
        const createData: TimelineCreate = {
          title: formData.title,
          subtitle: formData.subtitle || null,
          description: formData.description || null,
          start_date: formData.start_date,
          end_date: formData.end_date || null,
          location: formData.location || null,
          tags: formData.tags.length > 0 ? formData.tags : null,
          skills: formData.skills.length > 0 ? formData.skills : null,
          is_public: formData.is_public,
        };
        await Service.createTimelineApiV1TimelinesPost(createData);
      }
      navigate('/timelines');
    } catch (err: any) {
      console.error('保存失败:', err);
      const detail = err?.body?.detail;
      let msg = '保存失败';
      if (typeof detail === 'string') msg = detail;
      else if (Array.isArray(detail) && detail.length > 0) {
        msg = detail.map((d: { loc?: string[]; msg?: string }) => `${(d.loc || []).join('.')}: ${d.msg || ''}`).join('； ');
      } else if (err?.message) msg = err.message;
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="wc-page timeline-edit">
      <header className="wc-page-header">
        <div className="wc-page-heading">
          <span className="wc-accent-bar" />
          <div>
            <h1 className="wc-page-title">{isEdit ? '编辑时间线' : '新建时间线'}</h1>
          </div>
        </div>
        <div className="wc-page-actions">
          <button type="button" onClick={() => navigate('/timelines')} className="wc-btn wc-btn-ghost">
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
                placeholder="请输入标题"
              />
            </div>

            <div className="wc-field wc-field-span">
              <label htmlFor="subtitle" className="wc-label">副标题</label>
              <input
                id="subtitle"
                type="text"
                className="wc-input"
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                placeholder="请输入副标题"
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
                placeholder="请输入描述"
              />
            </div>

            <div className="wc-field">
              <label htmlFor="start_date" className="wc-label">开始时间<span className="wc-required">*</span></label>
              <input
                id="start_date"
                type="date"
                className="wc-input"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
              />
            </div>

            <div className="wc-field">
              <label htmlFor="end_date" className="wc-label">结束时间</label>
              <input
                id="end_date"
                type="date"
                className="wc-input"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>

            <div className="wc-field wc-field-span">
              <label htmlFor="location" className="wc-label">地点</label>
              <input
                id="location"
                type="text"
                className="wc-input"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="请输入地点"
              />
            </div>

            <div className="wc-field wc-field-span">
              <label className="wc-label">标签</label>
              <div className="wc-input-group">
                <input
                  type="text"
                  className="wc-input"
                  value={formData.tagInput}
                  onChange={(e) => setFormData({ ...formData, tagInput: e.target.value })}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="输入标签后按回车添加"
                />
                <button type="button" onClick={handleAddTag} className="wc-btn wc-btn-secondary">
                  <Plus size={14} /> 添加
                </button>
              </div>
              {formData.tags.length > 0 && (
                <div className="wc-tag-row tl-chip-row">
                  {formData.tags.map((tag, index) => (
                    <span key={index} className="wc-tag tl-chip">
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(index)}
                        className="tl-chip-remove"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="wc-field wc-field-span">
              <label className="wc-label">技能</label>
              <div className="wc-input-group">
                <input
                  type="text"
                  className="wc-input"
                  value={formData.skillInput}
                  onChange={(e) => setFormData({ ...formData, skillInput: e.target.value })}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSkill();
                    }
                  }}
                  placeholder="输入技能后按回车添加"
                />
                <button type="button" onClick={handleAddSkill} className="wc-btn wc-btn-secondary">
                  <Plus size={14} /> 添加
                </button>
              </div>
              {formData.skills.length > 0 && (
                <div className="wc-tag-row tl-chip-row">
                  {formData.skills.map((skill, index) => (
                    <span key={index} className="wc-tag tl-chip">
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(index)}
                        className="tl-chip-remove"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="wc-field wc-field-span">
              <label className="wc-check">
                <input
                  type="checkbox"
                  checked={formData.is_public}
                  onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                />
                公开
              </label>
            </div>
          </div>
        </div>

        <div className="wc-form-actions">
          <button type="submit" className="wc-btn wc-btn-primary" disabled={saving}>
            {saving ? '保存中...' : '保存'}
          </button>
          <button
            type="button"
            className="wc-btn wc-btn-ghost"
            onClick={() => navigate('/timelines')}
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
