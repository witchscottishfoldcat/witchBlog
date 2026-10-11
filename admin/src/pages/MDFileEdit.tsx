import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Sparkles, Loader2 } from 'lucide-react';
import { MdService } from '../services';
import type { MDFileCreate, MDFileUpdate, MDFileWithContent } from '../services';
import { aiApi } from '../services/aiApi';
import { parseFrontmatter, serializeFrontmatter, type FrontmatterMeta } from '../utils/frontmatter';
import './MDFileEdit.css';

/** 正文标题大纲项：line 为正文行号（0 起），level 为 # 层级（1~4） */
interface HeadingItem {
  line: number;
  level: number;
  text: string;
}

/** 从 Markdown 正文解析标题大纲；跳过代码围栏内的 # 注释行 */
function parseHeadings(content: string): HeadingItem[] {
  const items: HeadingItem[] = [];
  let inFence = false;
  content.split('\n').forEach((text, i) => {
    if (/^\s*```/.test(text)) {
      inFence = !inFence;
      return;
    }
    if (inFence) return;
    const m = text.match(/^(#{1,4})\s+(.+?)\s*$/);
    if (m) items.push({ line: i, level: m[1].length, text: m[2] });
  });
  return items;
}

export default function MDFileEdit() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    filename: '',
    tags: '',
    published: '',
    category: '',
    subcategory: '',
    pinned: false,
    encrypted: false,
    is_public: false,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiTagging, setAiTagging] = useState(false);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'split' | 'edit' | 'preview'>('split');

  // 标题大纲：解析正文标题，支持点击跳转与滚动跟随高亮
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [activeHeadingLine, setActiveHeadingLine] = useState<number | null>(null);
  const outlineClickAtRef = useRef(0);
  const headings = useMemo(() => parseHeadings(formData.content), [formData.content]);

  const getEditorLineHeight = () => {
    const el = contentTextareaRef.current;
    return el ? parseFloat(getComputedStyle(el).lineHeight) || 24 : 24;
  };

  const jumpToHeading = (heading: HeadingItem) => {
    const el = contentTextareaRef.current;
    if (!el) return;
    const lines = formData.content.split('\n');
    let position = 0;
    for (let i = 0; i < heading.line; i++) position += lines[i].length + 1;
    el.focus();
    el.setSelectionRange(position, position);
    // 目标行滚动到编辑区中部，保留上下文
    el.scrollTop = Math.max(0, heading.line * getEditorLineHeight() - el.clientHeight / 2);
    // 点击后短暂锁定高亮，避免程序滚动触发的跟随逻辑立即改高亮到上一节
    outlineClickAtRef.current = Date.now();
    setActiveHeadingLine(heading.line);
  };

  const handleEditorScroll = () => {
    if (Date.now() - outlineClickAtRef.current < 600) return;
    const el = contentTextareaRef.current;
    if (!el) return;
    const firstVisibleLine = Math.floor(el.scrollTop / getEditorLineHeight());
    let current: number | null = null;
    for (const heading of headings) {
      if (heading.line <= firstVisibleLine + 1) current = heading.line;
      else break;
    }
    setActiveHeadingLine(current);
  };

  useEffect(() => {
    if (isEdit && id) {
      loadFile();
    }
  }, [id, isEdit]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSubmit(e);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [formData, isEdit, id]);

  const loadFile = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const file: MDFileWithContent = await MdService.getMdFileContentApiV1MdFilesFileIdContentGet(Number(id));
      const { meta, body } = parseFrontmatter(file.content || '');
      setFormData({
        title: meta.title || file.title || '',
        description: meta.description || file.description || '',
        content: body,
        filename: file.original_filename || '',
        tags: meta.tags.length > 0 ? meta.tags.join(', ') : (file.tags || ''),
        published: meta.published,
        category: meta.category || file.category || '',
        subcategory: meta.subcategory || file.subcategory || '',
        pinned: meta.pinned,
        encrypted: meta.encrypted,
        is_public: file.is_public || false,
      });
    } catch (error) {
      console.error('加载文件失败:', error);
      setError('加载文件失败');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateMeta = async () => {
    if (aiTagging) return;
    const hasExisting =
      formData.title.trim() ||
      formData.description.trim() ||
      formData.category.trim() ||
      formData.subcategory.trim() ||
      formData.tags.trim();
    // AI 生成基于正文，结果应完整覆盖元数据字段；已有内容时需用户确认，避免误覆盖手填值
    if (hasExisting && !confirm('将根据正文重新生成标题、描述、分类、二级目录、标签并覆盖现有内容，确定？')) {
      return;
    }
    setAiTagging(true);
    setError('');
    try {
      const meta = await aiApi.generateMeta(formData.title, formData.content);
      setFormData((prev) => ({
        ...prev,
        title: meta.title || prev.title,
        description: meta.description || prev.description,
        category: meta.category || prev.category,
        subcategory: meta.subcategory || prev.subcategory,
        tags: meta.tags || prev.tags,
        filename: prev.filename.trim() || !meta.filename ? prev.filename : `${meta.filename}.md`,
      }));
    } catch (err: unknown) {
      console.error('AI 生成元数据失败:', err);
      setError('AI 生成失败,请稍后重试');
    } finally {
      setAiTagging(false);
    }
  };

  const buildMeta = (): FrontmatterMeta => ({
    title: formData.title,
    published: formData.published.trim(),
    description: formData.description,
    tags: formData.tags.split(/[,，]/).map((t) => t.trim()).filter(Boolean),
    category: formData.category.trim(),
    subcategory: formData.subcategory.trim(),
    pinned: formData.pinned,
    encrypted: formData.encrypted,
  });

  // 表单提交与 Ctrl+S 快捷键都会触发：只依赖 preventDefault，兼容两类事件
  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const content = serializeFrontmatter(buildMeta(), formData.content);

      if (isEdit && id) {
        const updateData: MDFileUpdate = {
          title: formData.title || null,
          description: formData.description || null,
          content,
          tags: formData.tags || null,
          published: formData.published || null,
          category: formData.category.trim() || null,
          subcategory: formData.subcategory.trim() || null,
          pinned: formData.pinned,
          encrypted: formData.encrypted,
          is_public: formData.is_public,
        };
        await MdService.updateMdFileApiV1MdFilesFileIdPut(Number(id), updateData);
      } else {
        const createData: MDFileCreate = {
          title: formData.title,
          description: formData.description || null,
          content,
          filename: formData.filename || `${formData.title}.md`,
          tags: formData.tags || null,
          published: formData.published || null,
          category: formData.category.trim() || null,
          subcategory: formData.subcategory.trim() || null,
          pinned: formData.pinned,
          encrypted: formData.encrypted,
          is_public: formData.is_public,
        };
        await MdService.createMdFileApiV1MdFilesPost(createData);
      }
      navigate('/md-files');
    } catch (error) {
      const detail =
        error && typeof error === 'object' && 'body' in error
          ? (error as { body?: { detail?: string } }).body?.detail
          : null;
      const message = error instanceof Error ? error.message : null;
      console.error('保存失败:', error);
      setError(detail || message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const wordCount = formData.content.trim().length;
  const readTimeMin = Math.max(1, Math.ceil(wordCount / 350));

  return (
    <div className="wc-page md-file-edit-page">
      <div className="wc-page-header sticky-edit-header">
        <div className="wc-page-heading">
          <span className="wc-accent-bar" />
          <button
            type="button"
            className="wc-btn wc-btn-ghost"
            onClick={() => navigate(-1)}
          >
            <ChevronLeft size={18} /> 返回
          </button>
          <div>
            <h1 className="wc-page-title">{isEdit ? '编辑文章' : '新建文章'}</h1>
          </div>
        </div>

        <div className="wc-page-actions md-header-right">
          <div className="md-stats-pills">
            <span className="md-stat-pill" title="文章字数">
              {wordCount} 字
            </span>
            <span className="md-stat-pill" title="预计阅读时长">
              约 {readTimeMin} 分钟
            </span>
            <span className="md-shortcut-pill">Ctrl+S 保存</span>
          </div>

          <div className="wc-tabs view-mode-tabs">
            <button
              type="button"
              className={`wc-tab ${viewMode === 'edit' ? 'wc-tab-active' : ''}`}
              onClick={() => setViewMode('edit')}
            >
              纯编辑
            </button>
            <button
              type="button"
              className={`wc-tab ${viewMode === 'split' ? 'wc-tab-active' : ''}`}
              onClick={() => setViewMode('split')}
            >
              分屏预览
            </button>
            <button
              type="button"
              className={`wc-tab ${viewMode === 'preview' ? 'wc-tab-active' : ''}`}
              onClick={() => setViewMode('preview')}
            >
              全屏预览
            </button>
          </div>

          <button
            type="button"
            className="wc-btn wc-btn-primary"
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? '保存中...' : '保存文章'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="wc-loading" style={{ minHeight: '12rem' }}><Loader2 size={18} className="wc-spinner" /> 加载中...</div>
      ) : (
        <section className="wc-card edit-card-wrap">
          <div className="md-file-edit-body">
            <form onSubmit={handleSubmit} className="wc-form">
              {error && <div className="wc-alert wc-alert-error">{error}</div>}

              <>
                <div className="wc-form-grid">
                    {/* 编辑模式无文件名字段，标题独占整行避免右侧留白失衡 */}
                    <div className={`wc-field ${isEdit ? 'wc-field-span' : ''}`}>
                      <label className="wc-label" htmlFor="title">标题<span className="wc-required">*</span></label>
                      <input
                        id="title"
                        className="wc-input"
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                        placeholder="请输入文章标题"
                      />
                    </div>

                    {!isEdit && (
                      <div className="wc-field">
                        <label className="wc-label" htmlFor="filename">文件名<span className="wc-required">*</span></label>
                        <input
                          id="filename"
                          className="wc-input"
                          type="text"
                          value={formData.filename}
                          onChange={(e) => setFormData({ ...formData, filename: e.target.value })}
                          required
                          placeholder="例如: my-article.md"
                        />
                      </div>
                    )}

                    <div className="wc-field wc-field-span">
                      <label className="wc-label" htmlFor="description">描述</label>
                      <textarea
                        id="description"
                        className="wc-textarea"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={2}
                        placeholder="请输入文章简短描述"
                      />
                    </div>

                    <div className="wc-field">
                      <label className="wc-label" htmlFor="category">分类</label>
                      <input
                        id="category"
                        className="wc-input"
                        type="text"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        placeholder="例如: 技术"
                      />
                    </div>

                    <div className="wc-field">
                      <label className="wc-label" htmlFor="subcategory">二级目录</label>
                      <input
                        id="subcategory"
                        className="wc-input"
                        type="text"
                        value={formData.subcategory}
                        onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                        placeholder="例如: 前端（需先填分类）"
                      />
                    </div>

                    <div className="wc-field wc-field-span">
                      <label className="wc-label" htmlFor="tags">标签</label>
                      <div className="wc-input-group">
                        <input
                          id="tags"
                          className="wc-input"
                          type="text"
                          value={formData.tags}
                          onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                          placeholder="多个标签用逗号分隔"
                        />
                        <button
                          type="button"
                          className="wc-btn wc-btn-secondary"
                          onClick={handleGenerateMeta}
                          disabled={aiTagging || !formData.content.trim()}
                        >
                          <Sparkles size={15} />
                          {aiTagging ? '生成中...' : 'AI 生成'}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="wc-check-row">
                    <label className="wc-check">
                      <input
                        type="checkbox"
                        checked={formData.is_public}
                        onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                      />
                      公开发布
                    </label>
                    <label className="wc-check">
                      <input
                        type="checkbox"
                        checked={formData.pinned}
                        onChange={(e) => setFormData({ ...formData, pinned: e.target.checked })}
                      />
                      首页置顶
                    </label>
                    <label className="wc-check">
                      <input
                        type="checkbox"
                        checked={formData.encrypted}
                        onChange={(e) => setFormData({ ...formData, encrypted: e.target.checked })}
                      />
                      加密存储
                    </label>
                  </div>

                  <div className="wc-field">
                    <label className="wc-label">正文内容与实时渲染</label>
                    <div className={`md-split-workspace mode-${viewMode}`}>
                      {(viewMode === 'split' || viewMode === 'edit') && (
                        <div className="md-split-pane md-editor-pane">
                          <textarea
                            id="content"
                            ref={contentTextareaRef}
                            className="wc-textarea md-split-textarea"
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            onScroll={handleEditorScroll}
                            required
                            placeholder="在此输入 Markdown 正文内容..."
                          />
                          {headings.length > 0 && (
                            <nav className="md-outline-rail" aria-label="文章目录">
                              <p className="md-outline-title">目录</p>
                              <ul className="md-outline-list">
                                {headings.map((heading) => (
                                  <li key={heading.line}>
                                    <button
                                      type="button"
                                      className={`md-outline-item level-${heading.level}${activeHeadingLine === heading.line ? ' active' : ''}`}
                                      onClick={() => jumpToHeading(heading)}
                                      title={heading.text}
                                    >
                                      {heading.text}
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            </nav>
                          )}
                        </div>
                      )}

                      {(viewMode === 'split' || viewMode === 'preview') && (
                        <div className="md-split-pane md-preview-pane">
                          <div className="preview-header">
                            <span className="preview-title-badge">实时渲染预览</span>
                            <span className="preview-words">{wordCount} 字</span>
                          </div>
                          <div className="preview-body">
                            {formData.content.trim() ? (
                              formData.content.split('\n\n').map((para, idx) => (
                                para.startsWith('#') ? (
                                  <h3 key={idx} className="preview-heading">{para.replace(/^#+\s*/, '')}</h3>
                                ) : para.startsWith('```') ? (
                                  <pre key={idx} className="preview-code-block">
                                    <code>{para.replace(/```[a-z]*/g, '').trim()}</code>
                                  </pre>
                                ) : (
                                  <p key={idx} className="preview-para">{para}</p>
                                )
                              ))
                            ) : (
                              <div className="wc-empty" style={{ padding: '3rem 0' }}>
                                在左侧输入内容，此处将实时展示格式化渲染效果
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              </form>
          </div>
        </section>
      )}
    </div>
  );
}
