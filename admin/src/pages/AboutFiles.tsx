import { useEffect, useState, useRef } from 'react';
import { Upload, FileText, Calendar, ExternalLink, Trash2, ChevronDown, Loader2 } from 'lucide-react';
import { Service } from '../services';
import './AboutFiles.css';

interface AboutFile {
  id: number;
  filename: string;
  file_url?: string;
  created_at: string;
}

export default function AboutFiles() {
  const [files, setFiles] = useState<AboutFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const response: any = await Service.getAboutFilesApiV1AboutGet();
      setFiles(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('加载About文件失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个文件吗？')) return;

    try {
      await Service.deleteAboutFileApiV1AboutFileIdDelete(id);
      loadFiles();
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败');
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileInputRef.current?.files?.[0]) {
      alert('请选择要上传的文件');
      return;
    }

    if (!uploadTitle.trim()) {
      alert('请输入文件标题');
      return;
    }

    setUploading(true);
    try {
      const file = fileInputRef.current.files[0];
      const formData = {
        title: uploadTitle,
        file: file,
      };

      await Service.uploadAboutFileApiV1AboutUploadPost(formData);
      alert('上传成功！');
      setShowUploadForm(false);
      setUploadTitle('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      loadFiles();
    } catch (error) {
      console.error('上传失败:', error);
      alert('上传失败，请查看控制台');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="wc-page about-files-page">
      <div className="wc-page-header">
        <div className="wc-page-heading">
          <span className="wc-accent-bar" />
          <div>
            <h1 className="wc-page-title">关于文件</h1>
            <p className="wc-page-subtitle">管理 About 页面展示的文件</p>
          </div>
        </div>
        <div className="wc-page-actions">
          <button
            type="button"
            className="wc-btn wc-btn-primary"
            onClick={() => setShowUploadForm(!showUploadForm)}
          >
            <Upload size={16} /> {showUploadForm ? '取消' : '上传文件'}
          </button>
        </div>
      </div>

      <div className="wc-panel about-files-upload-panel">
        <button type="button" className={`wc-panel-header${showUploadForm ? ' open' : ''}`} onClick={() => setShowUploadForm(!showUploadForm)}>
          <span className="about-files-upload-title"><Upload size={16} /> 上传文件</span>
          <ChevronDown size={16} className="wc-panel-toggle" />
        </button>
        {showUploadForm && (
          <div className="wc-panel-body">
            <form onSubmit={handleUpload} className="wc-form">
              <div className="wc-field">
                <label className="wc-label" htmlFor="upload-title">文件标题</label>
                <input
                  id="upload-title"
                  className="wc-input"
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="请输入文件标题"
                  required
                />
              </div>
              <div className="wc-field">
                <label className="wc-label">选择文件</label>
                <input ref={fileInputRef} className="wc-input" type="file" accept=".md,.txt" required style={{ height: 'auto', padding: '0.5rem 0.875rem' }} />
                <p className="wc-help">支持 .md / .txt 格式文件</p>
              </div>
              <div className="wc-form-actions">
                <button type="submit" className="wc-btn wc-btn-primary" disabled={uploading}>
                  {uploading ? '上传中...' : '上传'}
                </button>
                <button
                  type="button"
                  className="wc-btn wc-btn-secondary"
                  onClick={() => {
                    setShowUploadForm(false);
                    setUploadTitle('');
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {loading ? (
        <div className="wc-loading"><Loader2 size={18} className="wc-spinner" /> 加载中...</div>
      ) : (
        <div className="wc-list">
          {files.length === 0 ? (
            <div className="wc-empty">
              <div className="wc-empty-icon"><FileText size={24} strokeWidth={1.5} /></div>
              <p>暂无 About 文件</p>
            </div>
          ) : (
            files.map((file) => (
              <div key={file.id} className="wc-list-row">
                <div className="wc-list-row-main">
                  <h3 className="wc-list-row-title">{file.filename}</h3>
                  <div className="wc-list-row-meta">
                    <span><Calendar size={14} /> {new Date(file.created_at).toLocaleDateString()}</span>
                    {file.file_url && (
                      <a href={file.file_url} target="_blank" rel="noopener noreferrer" className="wc-link">
                        <ExternalLink size={14} /> 查看文件
                      </a>
                    )}
                  </div>
                </div>
                <div className="wc-list-row-actions">
                  <button
                    type="button"
                    className="wc-icon-btn wc-icon-btn-danger"
                    onClick={() => handleDelete(file.id)}
                    title="删除"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
