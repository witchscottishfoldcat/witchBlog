import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Calendar, Globe, Lock, BookOpen, Trash2, Pencil, Loader2 } from 'lucide-react';
import { Service } from '../services';
import type { DiaryResponse } from '../services/models/DiaryResponse';
import type { DiaryListResponse } from '../services/models/DiaryListResponse';
import { useToast } from '../components/Toast';
import { ConfirmModal } from '../components/Modal';
import './Diaries.css';

const getProxiedImageUrl = (imageUrl: string): string => imageUrl;

const collectDiaryImages = (diary: DiaryResponse): Array<{ url: string; alt: string; id?: number }> => {
  const imageUrls: Array<{ url: string; alt: string; id?: number }> = [];
  const seenUrls = new Set<string>();

  if (diary.images && diary.images.length > 0) {
    diary.images.forEach((image) => {
      const imageUrl = image.image_url;
      if (imageUrl) {
        const proxiedUrl = getProxiedImageUrl(imageUrl);
        if (!seenUrls.has(proxiedUrl)) {
          seenUrls.add(proxiedUrl);
          imageUrls.push({
            url: proxiedUrl,
            alt: image.original_filename || '日记图片',
            id: image.id,
          });
        }
      }
    });
  } else if (diary.content) {
    const imageMatches1 = diary.content.match(/!\[([^\]]*)\]\(([^)]+)\)/g);
    if (imageMatches1) {
      imageMatches1.forEach((match) => {
        const altMatch = match.match(/!\[([^\]]*)\]/);
        const urlMatch = match.match(/\(([^)]+)\)/);
        if (urlMatch && urlMatch[1]) {
          const proxiedUrl = getProxiedImageUrl(urlMatch[1]);
          if (!seenUrls.has(proxiedUrl)) {
            seenUrls.add(proxiedUrl);
            imageUrls.push({
              url: proxiedUrl,
              alt: altMatch ? altMatch[1] : '日记图片',
            });
          }
        }
      });
    }

    const imageMatches2 = diary.content.match(/\[image\]\(([^)]+)\)/gi);
    if (imageMatches2) {
      imageMatches2.forEach((match) => {
        const urlMatch = match.match(/\(([^)]+)\)/);
        if (urlMatch && urlMatch[1]) {
          const proxiedUrl = getProxiedImageUrl(urlMatch[1]);
          if (!seenUrls.has(proxiedUrl)) {
            seenUrls.add(proxiedUrl);
            imageUrls.push({
              url: proxiedUrl,
              alt: '日记图片',
            });
          }
        }
      });
    }
  }

  return imageUrls;
};

const extractDiaryText = (content?: string): string => {
  if (!content) return '无内容';
  let textContent = content;
  textContent = textContent.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '');
  textContent = textContent.replace(/\[image\]\(([^)]+)\)/gi, '');
  textContent = textContent.replace(/\n\s*\n\s*\n/g, '\n\n').trim();
  const displayText = textContent.length > 200 ? textContent.substring(0, 200) + '...' : textContent;
  return displayText || '无文字内容';
};

export default function Diaries() {
  const [diaries, setDiaries] = useState<DiaryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  const toast = useToast();
  const limit = 20;

  useEffect(() => {
    loadDiaries();
  }, [page]);

  const loadDiaries = async () => {
    setLoading(true);
    try {
      const skip = (page - 1) * limit;
      let response: DiaryListResponse = await Service.getDiariesApiV1DiariesGet(skip, limit, false);

      if (!response.diaries || response.diaries.length === 0) {
        response = await Service.getDiariesApiV1DiariesGet(skip, limit, true);
      }

      if (response && response.diaries) {
        setDiaries(response.diaries);
        setTotal(response.total || response.diaries.length);
      } else {
        setDiaries([]);
        setTotal(0);
      }
    } catch (error: any) {
      console.error('加载日记失败:', error);
      setDiaries([]);
      setTotal(0);
      toast.error(`加载日记失败: ${error?.message || '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await Service.deleteDiaryApiV1DiariesDiaryIdDelete(deleteTargetId);
      toast.success('日记已删除');
      loadDiaries();
    } catch (error) {
      console.error('删除失败:', error);
      toast.error('删除日记失败');
    } finally {
      setDeleteTargetId(null);
    }
  };

  const totalPages = Math.ceil(total / limit);

  const renderDiaryImages = (diary: DiaryResponse) => {
    const imageUrls = collectDiaryImages(diary);
    const displayImages = imageUrls.slice(0, 3);
    if (displayImages.length === 0) return null;
    return (
      <div className="diary-images">
        {displayImages.map((img, index) => (
          <img
            key={img.id || index}
            src={img.url}
            alt={img.alt}
            className="diary-image-thumbnail"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjEyIiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+5Zu+54mH5aSx6LSlPC90ZXh0Pjwvc3ZnPg==';
            }}
          />
        ))}
        {imageUrls.length > 3 && <div className="diary-image-more">+{imageUrls.length - 3}</div>}
      </div>
    );
  };

  const renderDiaryRow = (diary: DiaryResponse) => (
    <div key={diary.id} className="wc-card wc-card-hover wc-card-pad diary-card">
      <div className="diary-card-header">
        <h3 className="diary-card-title">{diary.title}</h3>
        <span className={diary.is_public ? 'wc-badge wc-badge-success' : 'wc-badge wc-badge-muted'}>
          {diary.is_public ? <><Globe size={10} /> 公开</> : <><Lock size={10} /> 私有</>}
        </span>
        <div className="diary-card-actions">
          <Link to={`/diaries/${diary.id}/edit`} className="wc-icon-btn" title="编辑"><Pencil size={15} /></Link>
          <button type="button" className="wc-icon-btn wc-icon-btn-danger" onClick={() => setDeleteTargetId(diary.id)} title="删除"><Trash2 size={15} /></button>
        </div>
      </div>
      <p className="wc-list-row-desc">{extractDiaryText(diary.content)}</p>
      {renderDiaryImages(diary)}
      <div className="wc-list-row-meta">
        <span><Calendar size={12} /> {new Date(diary.created_at).toLocaleString()}</span>
        {diary.weather && <span>{diary.weather}</span>}
        {diary.mood && <span>{diary.mood}</span>}
      </div>
      {diary.tags && diary.tags.length > 0 && (
        <div className="wc-tag-row">
          {diary.tags.map((tag, i) => <span key={i} className="wc-tag">{tag}</span>)}
        </div>
      )}
    </div>
  );

  return (
    <div className="wc-page diaries-page">
      <div className="wc-page-header">
        <div className="wc-page-heading">
          <span className="wc-accent-bar" />
          <div>
            <h1 className="wc-page-title">我的日记</h1>
            <p className="wc-page-subtitle">记录日常点滴与生活。</p>
          </div>
        </div>
        <div className="wc-page-actions">
          <Link to="/diaries/new" className="wc-btn wc-btn-primary"><Plus size={14} /> 新建日记</Link>
        </div>
      </div>

      {loading ? (
        <div className="wc-loading"><Loader2 size={18} className="wc-spinner" /> 加载中...</div>
      ) : (
        <>
          <div className="wc-list">
            {diaries.length === 0 ? (
              <div className="wc-empty">
                <div className="wc-empty-icon"><BookOpen size={24} strokeWidth={1.5} /></div>
                <p>暂无日记</p>
              </div>
            ) : (
              diaries.map(renderDiaryRow)
            )}
          </div>

          {totalPages > 1 && (
            <div className="wc-pagination">
              <button type="button" className="wc-pagination-btn" disabled={page === 1} onClick={() => setPage(page - 1)}>上一页</button>
              <span className="wc-pagination-info">{page} / {totalPages}</span>
              <button type="button" className="wc-pagination-btn" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>下一页</button>
            </div>
          )}
        </>
      )}

      {/* 删除确认弹窗 */}
      <ConfirmModal
        isOpen={deleteTargetId !== null}
        title="确认删除日记"
        message="确定要删除这篇日记吗？此操作无法恢复。"
        variant="danger"
        confirmText="删除"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
}
