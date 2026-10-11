import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { gameShowcaseApi, type GameShowcase } from '../services/gameShowcaseApi';
import './GamesEdit.css';

const PLATFORMS = [
  { value: 'steam', label: 'Steam' },
  { value: 'epic', label: 'Epic' },
  { value: 'ps', label: 'PlayStation' },
  { value: 'switch', label: 'Switch' },
  { value: 'pc', label: 'PC' },
  { value: 'mobile', label: '移动端' },
  { value: 'other', label: '其他' },
];

const CATEGORIES = [
  { value: 'rpg', label: 'RPG' },
  { value: 'fps', label: 'FPS' },
  { value: 'strategy', label: '策略' },
  { value: 'simulation', label: '模拟' },
  { value: 'indie', label: '独立' },
  { value: 'adventure', label: '冒险' },
  { value: 'other', label: '其他' },
];

const STATUSES = [
  { value: 'want_play', label: '想玩' },
  { value: 'playing', label: '在玩' },
  { value: 'completed', label: '已通关' },
  { value: 'shelved', label: '搁置' },
  { value: 'dropped', label: '弃坑' },
];

export default function GamesEdit() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '',
    description: '',
    cover_image_url: '',
    steam_appid: '',
    steam_url: '',
    platform: 'steam',
    category: 'other',
    tags: '',
    developer: '',
    publisher: '',
    status: 'want_play',
    play_time: 0,
    rating: '' as '' | number,
    review: '',
    is_favorite: false,
    is_active: true,
    is_r18: false,
    sort_order: 0,
    release_date: '',
  });

  useEffect(() => {
    if (isEdit && id) {
      gameShowcaseApi
        .getOne(Number(id))
        .then((g) => {
          setForm({
            title: g.title || '',
            description: g.description || '',
            cover_image_url: g.cover_image_url || '',
            steam_appid: g.steam_appid || '',
            steam_url: g.steam_url || '',
            platform: g.platform || 'steam',
            category: g.category || 'other',
            tags: g.tags || '',
            developer: g.developer || '',
            publisher: g.publisher || '',
            status: g.status || 'want_play',
            play_time: g.play_time ?? 0,
            rating: g.rating ?? '',
            review: g.review || '',
            is_favorite: g.is_favorite ?? false,
            is_active: g.is_active ?? true,
            is_r18: g.is_r18 ?? false,
            sort_order: g.sort_order ?? 0,
            release_date: g.release_date || '',
          });
        })
        .catch((e) => setError(e?.response?.data?.detail || '加载失败'))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      alert('请填写游戏名称');
      return;
    }
    setError('');
    setSaving(true);
    try {
      const payload: Partial<GameShowcase> = {
        title: form.title.trim(),
        description: form.description || undefined,
        cover_image_url: form.cover_image_url || undefined,
        steam_appid: form.steam_appid || undefined,
        steam_url: form.steam_url || undefined,
        platform: form.platform,
        category: form.category,
        tags: form.tags || undefined,
        developer: form.developer || undefined,
        publisher: form.publisher || undefined,
        status: form.status,
        play_time: form.play_time,
        rating: form.rating === '' ? undefined : Number(form.rating),
        review: form.review || undefined,
        is_favorite: form.is_favorite,
        is_active: form.is_active,
        is_r18: form.is_r18,
        sort_order: form.sort_order,
        release_date: form.release_date || undefined,
      };
      if (isEdit && id) {
        await gameShowcaseApi.update(Number(id), payload);
      } else {
        await gameShowcaseApi.create(payload);
      }
      navigate('/games');
    } catch (e: any) {
      setError(e?.response?.data?.detail || e?.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="wc-page games-edit-page">
      <div className="wc-page-header">
        <div className="wc-page-heading">
          <span className="wc-accent-bar" />
          <div>
            <h1 className="wc-page-title">{isEdit ? '编辑游戏' : '新建游戏'}</h1>
            <p className="wc-page-subtitle">{isEdit ? '修改游戏信息' : '添加一条游戏记录'}</p>
          </div>
        </div>
      </div>

      {error && <div className="wc-alert wc-alert-error">{error}</div>}

      {loading ? (
        <div className="wc-loading" style={{minHeight:'12rem'}}>
          <Loader2 size={18} className="wc-spinner" /> 加载中...
        </div>
      ) : (
      <form onSubmit={handleSubmit} className="wc-form">
        <section className="wc-card">
          <div className="wc-card-header">
            <h3 className="wc-card-title">基本信息</h3>
          </div>
          <div className="wc-card-body">
            <div className="wc-form-grid">
              <div className="wc-field wc-field-span">
                <label className="wc-label">游戏名称 *</label>
                <input
                  className="wc-input"
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="必填"
                  required
                />
              </div>
              <div className="wc-field wc-field-span">
                <label className="wc-label">简介</label>
                <textarea
                  className="wc-textarea"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="游戏简介"
                  rows={3}
                />
              </div>
              <div className="wc-field wc-field-span">
                <label className="wc-label">封面图片 URL</label>
                <input
                  className="wc-input"
                  type="text"
                  value={form.cover_image_url}
                  onChange={(e) => setForm((f) => ({ ...f, cover_image_url: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
              <div className="wc-field">
                <label className="wc-label">平台</label>
                <select
                  className="wc-select"
                  value={form.platform}
                  onChange={(e) => setForm((f) => ({ ...f, platform: e.target.value }))}
                >
                  {PLATFORMS.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
              <div className="wc-field">
                <label className="wc-label">分类</label>
                <select
                  className="wc-select"
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div className="wc-field">
                <label className="wc-label">标签（逗号分隔）</label>
                <input
                  className="wc-input"
                  type="text"
                  value={form.tags}
                  onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                  placeholder="动作, 冒险"
                />
              </div>
              <div className="wc-field">
                <label className="wc-label">发行日期</label>
                <input
                  className="wc-input"
                  type="text"
                  value={form.release_date}
                  onChange={(e) => setForm((f) => ({ ...f, release_date: e.target.value }))}
                  placeholder="2022年2月25日"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="wc-card">
          <div className="wc-card-header">
            <h3 className="wc-card-title">Steam</h3>
          </div>
          <div className="wc-card-body">
            <div className="wc-form-grid">
              <div className="wc-field">
                <label className="wc-label">Steam AppID</label>
                <input
                  className="wc-input"
                  type="text"
                  value={form.steam_appid}
                  onChange={(e) => setForm((f) => ({ ...f, steam_appid: e.target.value }))}
                  placeholder="1245620"
                />
              </div>
              <div className="wc-field">
                <label className="wc-label">Steam 商店链接</label>
                <input
                  className="wc-input"
                  type="text"
                  value={form.steam_url}
                  onChange={(e) => setForm((f) => ({ ...f, steam_url: e.target.value }))}
                  placeholder="https://store.steampowered.com/app/..."
                />
              </div>
            </div>
          </div>
        </section>

        <section className="wc-card">
          <div className="wc-card-header">
            <h3 className="wc-card-title">游玩与评价</h3>
          </div>
          <div className="wc-card-body">
            <div className="wc-form-grid">
              <div className="wc-field">
                <label className="wc-label">状态</label>
                <select
                  className="wc-select"
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                >
                  {STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div className="wc-field">
                <label className="wc-label">游玩时长（分钟）</label>
                <input
                  className="wc-input"
                  type="number"
                  min={0}
                  value={form.play_time || ''}
                  onChange={(e) => setForm((f) => ({ ...f, play_time: parseInt(e.target.value, 10) || 0 }))}
                />
              </div>
              <div className="wc-field">
                <label className="wc-label">评分（0-10）</label>
                <input
                  className="wc-input"
                  type="number"
                  min={0}
                  max={10}
                  step={0.5}
                  value={form.rating === '' ? '' : form.rating}
                  onChange={(e) => setForm((f) => ({ ...f, rating: e.target.value === '' ? '' : Number(e.target.value) }))}
                  placeholder="可选"
                />
              </div>
              <div className="wc-field">
                <label className="wc-label">排序权重（越小越靠前）</label>
                <input
                  className="wc-input"
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm((f) => ({ ...f, sort_order: parseInt(e.target.value, 10) || 0 }))}
                />
              </div>
              <div className="wc-field wc-field-span">
                <label className="wc-label">短评</label>
                <textarea
                  className="wc-textarea"
                  value={form.review}
                  onChange={(e) => setForm((f) => ({ ...f, review: e.target.value }))}
                  placeholder="个人短评"
                  rows={2}
                />
              </div>
              <div className="wc-field">
                <label className="wc-label">开发商</label>
                <input
                  className="wc-input"
                  type="text"
                  value={form.developer}
                  onChange={(e) => setForm((f) => ({ ...f, developer: e.target.value }))}
                />
              </div>
              <div className="wc-field">
                <label className="wc-label">发行商</label>
                <input
                  className="wc-input"
                  type="text"
                  value={form.publisher}
                  onChange={(e) => setForm((f) => ({ ...f, publisher: e.target.value }))}
                />
              </div>
              <div className="wc-field wc-field-span">
                <div className="wc-check-row">
                  <label className="wc-check">
                    <input
                      type="checkbox"
                      checked={form.is_favorite}
                      onChange={(e) => setForm((f) => ({ ...f, is_favorite: e.target.checked }))}
                    />
                    收藏
                  </label>
                  <label className="wc-check">
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                    />
                    前台显示
                  </label>
                  <label className="wc-check" title="标记后博客前台公开 API 将不展示该游戏">
                    <input
                      type="checkbox"
                      checked={form.is_r18}
                      onChange={(e) => setForm((f) => ({ ...f, is_r18: e.target.checked }))}
                    />
                    R18 成人内容（前台隐藏）
                  </label>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="wc-form-actions games-edit-actions">
          <button type="button" className="wc-btn wc-btn-ghost" onClick={() => navigate('/games')}>
            取消
          </button>
          <button type="submit" className="wc-btn wc-btn-primary" disabled={saving}>
            {saving ? '保存中…' : '保存'}
          </button>
        </div>
      </form>
      )}
    </div>
  );
}
