import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Archive, Calendar, FileText, Trash2, Loader2 } from 'lucide-react';
import { MdService } from '../services';
import type { MDFileArchive } from '../services/models/MDFileArchive';
import './Archives.css';

export default function Archives() {
  const navigate = useNavigate();
  const [archives, setArchives] = useState<MDFileArchive[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadArchives();
  }, []);

  const loadArchives = async () => {
    setLoading(true);
    try {
      const response = await MdService.readArchivesApiV1MdFileArchiveArchivesGet();
      setArchives(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('加载归档列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个归档吗？')) return;

    try {
      await MdService.deleteArchiveApiV1MdFileArchiveArchivesArchiveIdDelete(id);
      loadArchives();
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败');
    }
  };

  return (
    <div className="wc-page archives-page">
      <div className="wc-page-header">
        <div className="wc-page-heading">
          <span className="wc-accent-bar" />
          <div>
            <h1 className="wc-page-title">MD 文件归档</h1>
            <p className="wc-page-subtitle">查看与管理已归档的 Markdown 文件，点击进入详情</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="wc-loading"><Loader2 size={18} className="wc-spinner" /> 加载中...</div>
      ) : (
        <div className="archives-layout">
          <section className="wc-card archives-list-group">
            <div className="wc-card-header">
              <h2 className="wc-card-title">归档列表</h2>
            </div>
            <div className="wc-card-body archives-list-body">
              <div className="wc-list">
                {archives.length === 0 ? (
                  <div className="wc-empty">
                    <div className="wc-empty-icon"><Archive size={24} strokeWidth={1.5} /></div>
                    <p>暂无归档文件</p>
                  </div>
                ) : (
                  archives.map((archive) => (
                    <div
                      key={archive.id}
                      role="button"
                      tabIndex={0}
                      className="wc-list-row archives-row"
                      onClick={() => navigate(`/archives/${archive.id}`)}
                      onKeyDown={(e) => e.key === 'Enter' && navigate(`/archives/${archive.id}`)}
                    >
                      <div className="wc-list-row-main">
                        <h3 className="wc-list-row-title">{archive.original_filename || '未知文件'}</h3>
                        <div className="wc-list-row-meta">
                          <span><Calendar size={14} /> {new Date(archive.archive_date).toLocaleDateString()}</span>
                          {archive.archive_reason && <span><FileText size={14} /> {archive.archive_reason}</span>}
                        </div>
                      </div>
                      <div className="wc-list-row-actions">
                        <button
                          type="button"
                          className="wc-icon-btn wc-icon-btn-danger"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(archive.id);
                          }}
                          title="删除归档"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
