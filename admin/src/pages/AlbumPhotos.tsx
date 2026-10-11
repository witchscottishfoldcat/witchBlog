import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Images, Upload, Trash2, Star, Pencil, Loader2, X, Save, Camera } from 'lucide-react';
import { Service } from '../services';
import type { AlbumResponse, PhotoInfo, PhotoUpdate } from '../services';
import './AlbumPhotos.css';

export default function AlbumPhotos() {
  const { id } = useParams<{ id: string }>();
  const albumId = Number(id);
  const navigate = useNavigate();

  const [album, setAlbum] = useState<AlbumResponse | null>(null);
  const [photos, setPhotos] = useState<PhotoInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [editingPhoto, setEditingPhoto] = useState<PhotoInfo | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    tags: '',
    sort_order: 0,
    is_cover: false,
  });
  const [savingPhoto, setSavingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (albumId) {
      loadAlbum();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [albumId]);

  const loadAlbum = async () => {
    if (!albumId) return;
    setLoading(true);
    try {
      const data = await Service.getAlbumApiV1AlbumsAlbumIdGet(albumId);
      setAlbum(data);
      setPhotos(data.photos ?? []);
    } catch (error: any) {
      console.error('加载相册失败:', error);
      alert(`加载相册失败: ${error?.body?.detail || error?.message || '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    const list = Array.from(files);
    let okCount = 0;
    let failCount = 0;

    for (let i = 0; i < list.length; i++) {
      const file = list[i];
      setUploadProgress(`上传中 ${i + 1}/${list.length}：${file.name}`);
      try {
        await Service.uploadPhotoApiV1AlbumsAlbumIdPhotosPost(albumId, {
          file,
          title: file.name.replace(/\.[^.]+$/, ''),
          is_cover: false,
        });
        okCount += 1;
      } catch (error: any) {
        console.error(`上传照片失败: ${file.name}`, error);
        failCount += 1;
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setUploading(false);
    setUploadProgress('');
    alert(`上传完成：成功 ${okCount} 张${failCount > 0 ? `，失败 ${failCount} 张` : ''}`);
    loadAlbum();
  };

  const handleSetCover = async (photoId: number) => {
    try {
      await Service.updateAlbumApiV1AlbumsAlbumIdPut(albumId, { cover_photo_id: photoId });
      loadAlbum();
    } catch (error) {
      console.error('设置封面失败:', error);
      alert('设置封面失败');
    }
  };

  const handleDeletePhoto = async (photoId: number) => {
    if (!confirm('确定要删除这张照片吗？')) return;

    try {
      await Service.deletePhotoApiV1AlbumsPhotosPhotoIdDelete(photoId);
      if (editingPhoto?.id === photoId) {
        setEditingPhoto(null);
      }
      loadAlbum();
    } catch (error) {
      console.error('删除照片失败:', error);
      alert('删除照片失败');
    }
  };

  const openEdit = (photo: PhotoInfo) => {
    setEditingPhoto(photo);
    setEditForm({
      title: photo.title || '',
      description: photo.description || '',
      tags: Array.isArray(photo.tags) ? photo.tags.join(',') : '',
      sort_order: photo.sort_order ?? 0,
      is_cover: photo.is_cover ?? false,
    });
  };

  const handleSavePhoto = async () => {
    if (!editingPhoto) return;
    setSavingPhoto(true);
    try {
      const updateData: PhotoUpdate = {
        title: editForm.title || null,
        description: editForm.description || null,
        tags: editForm.tags.split(',').map((t) => t.trim()).filter(Boolean),
        is_cover: editForm.is_cover,
        sort_order: editForm.sort_order,
      };
      await Service.updatePhotoApiV1AlbumsPhotosPhotoIdPut(editingPhoto.id, updateData);
      setEditingPhoto(null);
      loadAlbum();
    } catch (error: any) {
      console.error('保存照片信息失败:', error);
      alert(error?.body?.detail || error?.message || '保存照片信息失败');
    } finally {
      setSavingPhoto(false);
    }
  };

  return (
    <div className="wc-page">
      <div className="wc-page-header">
        <div className="wc-page-heading">
          <span className="wc-accent-bar" />
          <div>
            <h1 className="wc-page-title">管理照片{album ? `：${album.title}` : ''}</h1>
            <p className="wc-page-subtitle">上传照片、设置封面与排序。</p>
          </div>
        </div>
        <div className="wc-page-actions">
          <button type="button" onClick={() => navigate('/albums')} className="wc-btn wc-btn-ghost">
            <ArrowLeft size={14} /> 返回相册
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="wc-btn wc-btn-primary"
          >
            <Upload size={14} /> {uploading ? '上传中...' : '上传照片'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp,image/bmp"
            multiple
            style={{ display: 'none' }}
            onChange={(e) => handleUpload(e.target.files)}
          />
        </div>
      </div>

      {uploading && (
        <div className="wc-loading"><Loader2 size={18} className="wc-spinner" />{uploadProgress}</div>
      )}

      {editingPhoto && (
        <section className="wc-card albums-photo-edit">
          <div className="wc-card-header">
            <div>
              <h2 className="wc-card-title">编辑照片信息</h2>
              <p className="wc-card-subtitle">{editingPhoto.original_filename}</p>
            </div>
            <button type="button" className="wc-icon-btn" onClick={() => setEditingPhoto(null)} title="关闭">
              <X size={15} />
            </button>
          </div>
          <form className="wc-form wc-card-body" onSubmit={(e) => { e.preventDefault(); handleSavePhoto(); }}>
            <div className="wc-field">
              <label htmlFor="photo-title" className="wc-label">标题</label>
              <input
                id="photo-title"
                type="text"
                className="wc-input"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                placeholder="请输入照片标题"
              />
            </div>
            <div className="wc-field">
              <label htmlFor="photo-description" className="wc-label">描述</label>
              <textarea
                id="photo-description"
                className="wc-textarea"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={2}
                placeholder="请输入照片描述"
              />
            </div>
            <div className="albums-photo-edit-row">
              <div className="wc-field">
                <label htmlFor="photo-tags" className="wc-label">标签</label>
                <input
                  id="photo-tags"
                  type="text"
                  className="wc-input"
                  value={editForm.tags}
                  onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                  placeholder="多个标签用逗号分隔"
                />
              </div>
              <div className="wc-field">
                <label htmlFor="photo-sort" className="wc-label">排序权重</label>
                <input
                  id="photo-sort"
                  type="number"
                  className="wc-input"
                  value={editForm.sort_order}
                  onChange={(e) => setEditForm({ ...editForm, sort_order: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="wc-field">
              <label className="wc-check">
                <input
                  type="checkbox"
                  checked={editForm.is_cover}
                  onChange={(e) => setEditForm({ ...editForm, is_cover: e.target.checked })}
                />
                <span>设为相册封面</span>
              </label>
            </div>
            <div className="wc-form-actions">
              <button type="submit" className="wc-btn wc-btn-primary" disabled={savingPhoto}>
                <Save size={14} /> {savingPhoto ? '保存中...' : '保存'}
              </button>
              <button type="button" className="wc-btn wc-btn-ghost" onClick={() => setEditingPhoto(null)} disabled={savingPhoto}>
                取消
              </button>
            </div>
          </form>
        </section>
      )}

      {loading ? (
        <div className="wc-loading"><Loader2 size={18} className="wc-spinner" />加载中...</div>
      ) : (
        <div className="albums-photo-grid">
          {photos.length === 0 ? (
            <div className="wc-empty albums-photo-empty">
              <span className="wc-empty-icon"><Images size={24} strokeWidth={1.5} /></span>
              <p>相册里还没有照片，点击右上角「上传照片」开始</p>
            </div>
          ) : (
            photos.map((photo) => (
              <div key={photo.id} className="albums-photo-card">
                <img
                  src={photo.thumbnail_url || photo.image_url}
                  alt={photo.title || photo.original_filename}
                  loading="lazy"
                />
                <div className="albums-photo-actions">
                  <button type="button" className="wc-icon-btn" onClick={() => openEdit(photo)} title="编辑信息">
                    <Pencil size={13} />
                  </button>
                  <button
                    type="button"
                    className="wc-icon-btn"
                    onClick={() => handleSetCover(photo.id)}
                    title={album?.cover_photo_id === photo.id ? '当前封面' : '设为封面'}
                    disabled={album?.cover_photo_id === photo.id}
                  >
                    <Star size={13} />
                  </button>
                  <button type="button" className="wc-icon-btn wc-icon-btn-danger" onClick={() => handleDeletePhoto(photo.id)} title="删除">
                    <Trash2 size={13} />
                  </button>
                </div>
                <div className="albums-photo-meta">
                  {album?.cover_photo_id === photo.id && (
                    <span className="wc-badge wc-badge-success albums-photo-cover-badge"><Star size={10} /> 封面</span>
                  )}
                  <span className="albums-photo-title" title={photo.title || photo.original_filename}>
                    {photo.title || photo.original_filename || <><Camera size={11} /> 未命名</>}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
