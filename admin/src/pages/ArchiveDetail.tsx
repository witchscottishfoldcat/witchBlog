import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Archive, ArrowLeft, Calendar, FileText, Trash2, Loader2 } from 'lucide-react';
import { MdService } from '../services';
import type { MDFileArchive } from '../services/models/MDFileArchive';
import './Archives.css';

export default function ArchiveDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const archiveId = Number(id);

  const [archive, setArchive] = useState<MDFileArchive | null>(null);
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!Number.isInteger(archiveId)) {
      setError('无效的归档 ID');
      setLoading(false);
      return;
    }
    loadArchive();
  }, [archiveId]);

  const loadArchive = async () => {
    setLoading(true);
    setError('');
    try {
      const [archives, archiveContent] = await Promise.all([
        MdService.readArchivesApiV1MdFileArchiveArchivesGet(),
        MdService.readArchiveContentApiV1MdFileArchiveArchivesArchiveIdContentGet(archiveId),
      ]);
      const list = Array.isArray(archives) ? archives : [];
      setArchive(list.find(a => a.id === archiveId) || null);
      setContent(archiveContent.content || '');
    } catch (err) {
      console.error('加载归档详情失败:', err);
      setError('加载归档详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('确定要删除这个归档吗？')) return;
    try {
      await MdService.deleteArchiveApiV1MdFileArchiveArchivesArchiveIdDelete(archiveId);
      navigate('/archives');
    } catch (err) {
      console.error('删除失败:', err);
      alert('删除失败');
    }
  };

  return (
    <div className="wc-page archives-page">
      <div className="wc-page-header">
        <div className="wc-page-heading">
          <span className="wc-accent-bar" />
          <div>
            <h1 className="wc-page-title">{archive?.original_filename || '归档详情'}</h1>
            <p className="wc-page-subtitle">查看已归档 Markdown 文件的内容</p>
          </div>
        </div>
        <div className="wc-page-actions">
          <button type="button" className="wc-btn" onClick={() => navigate('/archives')}>
            <ArrowLeft size={16} /> 返回列表
          </button>
        </div>
      </div>

      {loading ? (
        <div className="wc-loading"><Loader2 size={18} className="wc-spinner" /> 加载中...</div>
      ) : error ? (
        <div className="wc-card">
          <div className="wc-card-body">
            <div className="wc-empty">
              <div className="wc-empty-icon"><Archive size={24} strokeWidth={1.5} /></div>
              <p>{error}</p>
              <button type="button" className="wc-btn" onClick={() => navigate('/archives')}>
                返回归档列表
              </button>
            </div>
          </div>
        </div>
      ) : (
        <section className="wc-card archives-content">
          <div className="archives-content-header">
            <div className="wc-list-row-meta archives-detail-meta">
              <span><Calendar size={14} /> {new Date(archive!.archive_date).toLocaleDateString()}</span>
              {archive?.archive_reason && <span><FileText size={14} /> {archive.archive_reason}</span>}
            </div>
            <button
              type="button"
              className="wc-icon-btn wc-icon-btn-danger"
              onClick={handleDelete}
              title="删除归档"
            >
              <Trash2 size={16} />
            </button>
          </div>
          <pre className="archives-preview">{content}</pre>
        </section>
      )}
    </div>
  );
}
