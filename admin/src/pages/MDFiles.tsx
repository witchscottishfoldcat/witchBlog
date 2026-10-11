import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Upload, Plus, Search, Calendar, FileText, FolderTree, Globe, Lock, Download, Archive, Trash2, Pencil, ChevronDown, Loader2, X } from 'lucide-react';
import { MdService } from '../services';
import type { MDFile } from '../services/models/MDFile';
import type { MDFileList } from '../services/models/MDFileList';
import { useToast } from '../components/Toast';
import { ConfirmModal, PromptModal } from '../components/Modal';
import './MDFiles.css';

export default function MDFiles() {
  const [files, setFiles] = useState<MDFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [showPublicOnly, setShowPublicOnly] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadTags, setUploadTags] = useState('');
  const [uploadIsPublic, setUploadIsPublic] = useState(true);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [archiveTargetId, setArchiveTargetId] = useState<number | null>(null);

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [batchDeleteConfirm, setBatchDeleteConfirm] = useState(false);
  const [batchProcessing, setBatchProcessing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const limit = 20;

  const [showSearchToolbar, setShowSearchToolbar] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadFiles();
  }, [page, search, showPublicOnly]);

  // 翻页时回到列表顶部，并清空跨页选择（避免选中了别页看不见的文章还批量操作）
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setSelectedIds([]);
  }, [page]);

  // 搜索 / 筛选变化时回到第一页，并清空选择
  useEffect(() => {
    setPage(1);
    setSelectedIds([]);
  }, [search, showPublicOnly]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setShowSearchToolbar((prev) => {
          const next = !prev;
          if (next) {
            setTimeout(() => searchInputRef.current?.focus(), 50);
          }
          return next;
        });
      } else if (e.key === 'Escape' && showSearchToolbar) {
        setShowSearchToolbar(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSearchToolbar]);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const skip = (page - 1) * limit;
      let response: MDFileList;

      if (showPublicOnly) {
        response = await MdService.listPublicMdFilesApiV1MdFilesPublicGet(skip, limit, search || undefined);
      } else {
        response = await MdService.listMdFilesApiV1MdFilesGet(skip, limit, search || undefined, undefined);
      }
      setFiles(response.files || []);
      setTotal(response.total || 0);
    } catch (error) {
      console.error('加载文件失败:', error);
      toast.error('加载文件失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await MdService.deleteMdFileApiV1MdFilesFileIdDelete(deleteTargetId);
      toast.success('文章已成功删除');
      loadFiles();
    } catch (error) {
      console.error('删除失败:', error);
      toast.error('删除失败');
    } finally {
      setDeleteTargetId(null);
    }
  };

  const confirmArchive = async (reason: string) => {
    if (!archiveTargetId) return;
    try {
      await MdService.archiveMdFileApiV1MdFilesFileIdArchivePost(archiveTargetId, reason || '');
      toast.success('文章归档成功');
      loadFiles();
    } catch (error) {
      console.error('归档失败:', error);
      toast.error('归档失败');
    } finally {
      setArchiveTargetId(null);
    }
  };

  const handleDownload = async (id: number) => {
    try {
      const file = files.find(f => f.id === id);
      const filename = file?.original_filename || file?.title || `file-${id}.md`;
      const response = await MdService.downloadMdFileApiV1MdFilesFileIdDownloadGet(id);
      let content = '';
      if (typeof response === 'string') {
        content = response;
      } else if (response && typeof response === 'object') {
        content = (response as any).content || JSON.stringify(response, null, 2);
      }
      const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename.endsWith('.md') ? filename : `${filename}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('文件下载已开始');
    } catch (error) {
      console.error('下载失败:', error);
      toast.error('下载文件失败');
    }
  };
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(files.map((f) => f.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleBatchPublish = async (is_public: boolean) => {
    if (selectedIds.length === 0) return;
    setBatchProcessing(true);
    try {
      await Promise.all(
        selectedIds.map((id) =>
          MdService.updateMdFileApiV1MdFilesFileIdPut(id, { is_public })
        )
      );
      toast.success(`已批量修改 ${selectedIds.length} 篇文章发布状态`);
      setSelectedIds([]);
      loadFiles();
    } catch (e) {
      console.error(e);
      toast.error('批量更新状态失败');
    } finally {
      setBatchProcessing(false);
    }
  };

  const confirmBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    setBatchProcessing(true);
    try {
      await Promise.all(
        selectedIds.map((id) => MdService.deleteMdFileApiV1MdFilesFileIdDelete(id))
      );
      toast.success(`已成功批量删除 ${selectedIds.length} 篇文章`);
      setSelectedIds([]);
      loadFiles();
    } catch (e) {
      console.error(e);
      toast.error('批量删除失败');
    } finally {
      setBatchProcessing(false);
      setBatchDeleteConfirm(false);
    }
  };

  const handleTogglePublic = async (id: number) => {
    try {
      await MdService.toggleFilePublicStatusApiV1MdFilesFileIdTogglePublicPost(id);
      toast.success('已切换公开/私有状态');
      loadFiles();
    } catch (error) {
      console.error('切换状态失败:', error);
      toast.error('切换公开状态失败');
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileInputRef.current?.files?.[0]) {
      toast.warning('请选择要上传的 MD 文件');
      return;
    }
    if (!uploadTitle.trim()) {
      toast.warning('请输入文章标题');
      return;
    }
    setUploading(true);
    try {
      const file = fileInputRef.current.files[0];
      const formData = {
        title: uploadTitle,
        description: uploadDescription || null,
        tags: uploadTags || null,
        is_public: uploadIsPublic,
        file,
      };
      await MdService.uploadMdFileApiV1MdFilesUploadPost(formData);
      toast.success('Markdown 文件上传成功！');
      setShowUploadForm(false);
      setUploadTitle('');
      setUploadDescription('');
      setUploadTags('');
      setUploadIsPublic(true);
      if (fileInputRef.current) fileInputRef.current.value = '';
      loadFiles();
    } catch (error) {
      console.error('上传失败:', error);
      toast.error('上传文件失败，请检查格式');
    } finally {
      setUploading(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  // 生成页码序列：当前页附近展开，两端用省略号折叠（如 1 … 4 5 6 … 20）
  const getPageNumbers = (): (number | '…')[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | '…')[] = [];
    const showSet = new Set<number>([
      1,
      totalPages,
      page - 1,
      page,
      page + 1,
    ]);
    // 补充边界，保证首尾显示
    if (page <= 3) {
      [2, 3, 4].forEach((p) => showSet.add(p));
    }
    if (page >= totalPages - 2) {
      [totalPages - 1, totalPages - 2, totalPages - 3].forEach((p) => showSet.add(p));
    }
    const sorted = [...showSet].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
    for (let i = 0; i < sorted.length; i++) {
      pages.push(sorted[i]);
      if (i < sorted.length - 1 && sorted[i + 1] - sorted[i] > 1) {
        pages.push('…');
      }
    }
    return pages;
  };

  const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  return (
    <div className="wc-page md-files-page">
      <div className="wc-page-header">
        <div className="wc-page-heading">
          <span className="wc-accent-bar" />
          <div>
            <h1 className="wc-page-title">博客文章</h1>
            <p className="wc-page-subtitle">管理你的 Markdown 文章与发布状态。</p>
          </div>
        </div>
        <div className="wc-page-actions">
          <button
            type="button"
            className={`wc-btn ${showSearchToolbar ? 'wc-btn-primary' : 'wc-btn-secondary'}`}
            onClick={() => setShowSearchToolbar(!showSearchToolbar)}
          >
            <Search size={14} /> 查找 (Ctrl+F)
          </button>
          <button type="button" className="wc-btn wc-btn-secondary" onClick={() => setShowUploadForm(!showUploadForm)}>
            <Upload size={14} /> {showUploadForm ? '取消' : '上传文件'}
          </button>
          <Link to="/md-files/new" className="wc-btn wc-btn-primary">
            <Plus size={14} /> 新建文章
          </Link>
        </div>
      </div>

      <div className="wc-panel md-upload-panel">
        <button type="button" className={`wc-panel-header${showUploadForm ? ' open' : ''}`} onClick={() => setShowUploadForm(!showUploadForm)}>
          <span className="md-upload-panel-title"><Upload size={16} /> 上传 MD 文件</span>
          <ChevronDown size={16} className="wc-panel-toggle" />
        </button>
        {showUploadForm && (
          <div className="wc-panel-body">
            <form className="wc-form" onSubmit={handleUpload}>
              <div className="wc-field">
                <label className="wc-label">文章标题</label>
                <input className="wc-input" type="text" value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} placeholder="请输入文章标题" required />
              </div>
              <div className="wc-field">
                <label className="wc-label">选择 MD 文件</label>
                <input className="wc-input" ref={fileInputRef} type="file" accept=".md" required style={{ height: 'auto', padding: '0.5rem 0.875rem' }} />
                <p className="wc-help">支持 .md 格式文件</p>
              </div>
              <div className="wc-field">
                <label className="wc-label">描述</label>
                <input className="wc-input" type="text" value={uploadDescription} onChange={(e) => setUploadDescription(e.target.value)} placeholder="文章描述（可选）" />
              </div>
              <div className="wc-field">
                <label className="wc-label">标签</label>
                <input className="wc-input" type="text" value={uploadTags} onChange={(e) => setUploadTags(e.target.value)} placeholder="多个标签用逗号分隔（可选）" />
              </div>
              <label className="wc-check">
                <input type="checkbox" checked={uploadIsPublic} onChange={(e) => setUploadIsPublic(e.target.checked)} />
                公开
              </label>
              <div className="wc-form-actions">
                <button type="submit" className="wc-btn wc-btn-primary" disabled={uploading}>
                  {uploading ? '上传中...' : '上传'}
                </button>
                <button type="button" className="wc-btn wc-btn-secondary" onClick={() => { setShowUploadForm(false); setUploadTitle(''); setUploadDescription(''); setUploadTags(''); setUploadIsPublic(true); if (fileInputRef.current) fileInputRef.current.value = ''; }}>
                  取消
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {showSearchToolbar && (
        <div className="wc-toolbar animated-toolbar">
          <div className="wc-search">
            <Search size={15} className="wc-search-icon" />
            <input
              ref={searchInputRef}
              type="text"
              className="wc-search-input"
              placeholder="搜索文章... (按 Esc 关闭)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          <label className="wc-check">
            <input
              type="checkbox"
              checked={files.length > 0 && selectedIds.length === files.length}
              onChange={handleSelectAll}
            />
            全选本页
          </label>
          <label className="wc-check">
            <input type="checkbox" checked={showPublicOnly} onChange={(e) => setShowPublicOnly(e.target.checked)} />
            仅公开
          </label>
          <button
            type="button"
            className="wc-icon-btn"
            onClick={() => setShowSearchToolbar(false)}
            title="关闭搜索栏"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {loading ? (
        <div className="wc-loading"><Loader2 size={18} className="wc-spinner" /> 加载中...</div>
      ) : (
        <>
          <div className="wc-list">
            {files.length === 0 ? (
              <div className="wc-empty">
                <div className="wc-empty-icon"><FileText size={24} strokeWidth={1.5} /></div>
                <p>暂无文章</p>
              </div>
            ) : (
              files.map((file) => (
                <div key={file.id} className={`wc-list-row ${selectedIds.includes(file.id) ? 'row-selected' : ''}`}>
                  <label className="wc-check row-check-wrap">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(file.id)}
                      onChange={() => handleToggleSelect(file.id)}
                    />
                  </label>
                  <div className="wc-list-row-main">
                    <h3 className="wc-list-row-title">{file.title}</h3>
                    <p className="wc-list-row-desc">{file.description || '无描述'}</p>
                    <div className="wc-list-row-meta">
                      <span><Calendar size={12} /> {new Date(file.created_at).toLocaleDateString()}</span>
                      <span><FileText size={12} /> {file.word_count} 字</span>
                      {file.category && (
                        <span title="一级分类 / 二级分类">
                          <FolderTree size={12} /> {file.category}{file.subcategory ? ` › ${file.subcategory}` : ''}
                        </span>
                      )}
                      <span className={file.is_public ? 'wc-badge wc-badge-success' : 'wc-badge wc-badge-muted'}>
                        {file.is_public ? <><Globe size={10} /> 公开</> : <><Lock size={10} /> 私有</>}
                      </span>
                    </div>
                    {file.tags && (
                      <div className="wc-tag-row">
                        {file.tags.split(',').map((tag, i) => (
                          <span key={i} className="wc-tag">{tag.trim()}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="wc-list-row-actions">
                    <Link to={`/md-files/${file.id}/edit`} className="wc-icon-btn" title="编辑"><Pencil size={15} /></Link>
                    <button type="button" className="wc-icon-btn" onClick={() => handleDownload(file.id)} title="下载"><Download size={15} /></button>
                    <button type="button" className="wc-icon-btn" onClick={() => handleTogglePublic(file.id)} title={file.is_public ? '设为私有' : '设为公开'}>
                      {file.is_public ? <Lock size={15} /> : <Globe size={15} />}
                    </button>
                    <button type="button" className="wc-icon-btn" onClick={() => setArchiveTargetId(file.id)} title="归档"><Archive size={15} /></button>
                    <button type="button" className="wc-icon-btn wc-icon-btn-danger" onClick={() => setDeleteTargetId(file.id)} title="删除"><Trash2 size={15} /></button>
                  </div>
                </div>
              ))
            )}
          </div>

          {total > 0 && (
            <div className="wc-pagination-wrap">
              <span className="wc-pagination-total">
                共 {total} 篇 · 第 {startItem}–{endItem} 篇
              </span>
              {totalPages > 1 && (
                <div className="wc-pagination">
                  <button
                    type="button"
                    className="wc-pagination-btn"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                  >
                    上一页
                  </button>
                  {getPageNumbers().map((p, i) =>
                    p === '…' ? (
                      <span key={`ellipsis-${i}`} className="wc-pagination-ellipsis">…</span>
                    ) : (
                      <button
                        key={p}
                        type="button"
                        className={`wc-pagination-btn ${p === page ? 'active' : ''}`}
                        onClick={() => setPage(p)}
                      >
                        {p}
                      </button>
                    )
                  )}
                  <button
                    type="button"
                    className="wc-pagination-btn"
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    下一页
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* 底部多选批量操作悬浮玻璃岛 */}
      {selectedIds.length > 0 && (
        <div className="batch-floating-island">
          <span className="batch-count">已选中 {selectedIds.length} 篇文章</span>
          <div className="batch-actions-btn-group">
            <button
              type="button"
              className="wc-btn wc-btn-secondary"
              onClick={() => handleBatchPublish(true)}
              disabled={batchProcessing}
            >
              <Globe size={14} /> 批量公开
            </button>
            <button
              type="button"
              className="wc-btn wc-btn-secondary"
              onClick={() => handleBatchPublish(false)}
              disabled={batchProcessing}
            >
              <Lock size={14} /> 批量私有
            </button>
            <button
              type="button"
              className="wc-btn wc-btn-danger"
              onClick={() => setBatchDeleteConfirm(true)}
              disabled={batchProcessing}
            >
              <Trash2 size={14} /> 批量删除
            </button>
            <button
              type="button"
              className="wc-btn wc-btn-ghost"
              onClick={() => setSelectedIds([])}
            >
              取消选择
            </button>
          </div>
        </div>
      )}

      {/* 批量删除确认弹窗 */}
      <ConfirmModal
        isOpen={batchDeleteConfirm}
        title="批量删除确认"
        message={`确定要彻底删除选中的 ${selectedIds.length} 篇文章吗？此操作无法撤销。`}
        variant="danger"
        confirmText="批量彻底删除"
        onConfirm={confirmBatchDelete}
        onCancel={() => setBatchDeleteConfirm(false)}
      />

      {/* 删除确认弹窗 */}
      <ConfirmModal
        isOpen={deleteTargetId !== null}
        title="确认删除文章"
        message="确定要彻底删除这篇文章吗？此操作无法撤销。"
        variant="danger"
        confirmText="彻底删除"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTargetId(null)}
      />

      {/* 归档输入弹窗 */}
      <PromptModal
        isOpen={archiveTargetId !== null}
        title="文章归档"
        message="请输入归档原因或备注（可选）："
        placeholder="例如：内容已过期 / 重构整理..."
        onConfirm={confirmArchive}
        onCancel={() => setArchiveTargetId(null)}
      />
    </div>
  );
}
