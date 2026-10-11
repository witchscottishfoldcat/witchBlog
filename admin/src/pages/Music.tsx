import { useEffect, useState, useRef } from 'react';
import {
  Plus,
  Music2,
  RefreshCw,
  Trash2,
  ExternalLink,
  Play,
  X,
  Loader2,
  CloudSync,
  ChevronLeft,
  ListMusic,
  User,
  Disc,
  Clock,
} from 'lucide-react';
import { musicApi, type MusicLibrary, type MusicTrack, type PlayerResponse } from '../services/musicApi';
import { useToast } from '../components/Toast';
import { ConfirmModal } from '../components/Modal';
import { sanitizeIframeEmbed } from '../utils/sanitize';
import './Music.css';

const formatDuration = (sec?: number) => {
  if (sec == null) return '-';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export default function Music() {
  const [libraries, setLibraries] = useState<MusicLibrary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importForm, setImportForm] = useState({
    netease_playlist_id: '',
    title: '',
    description: '',
    tags: '',
    is_public: true,
  });

  // 二级视图：当前选中的歌单 (Level 2 Detail View)
  const [selectedLibrary, setSelectedLibrary] = useState<MusicLibrary | null>(null);
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [tracksLoading, setTracksLoading] = useState(false);

  const [playingTrack, setPlayingTrack] = useState<{ id: number; title?: string; iframe?: string } | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  useEffect(() => {
    loadLibraries();
  }, []);

  useEffect(() => {
    if (selectedLibrary) {
      loadTracks(selectedLibrary.id);
    }
  }, [selectedLibrary]);

  const loadLibraries = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await musicApi.getLibraries();
      setLibraries(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.response?.data?.detail || e?.message || '加载歌单列表失败');
      setLibraries([]);
    } finally {
      setLoading(false);
    }
  };

  const loadTracks = async (libId: number) => {
    setTracksLoading(true);
    try {
      const lib = await musicApi.getLibrary(libId);
      setTracks(lib.tracks || []);
    } catch (e) {
      console.error('加载曲目列表失败:', e);
      toast.error('加载曲目失败');
      setTracks([]);
    } finally {
      setTracksLoading(false);
    }
  };

  const handleImport = async () => {
    if (!importForm.netease_playlist_id.trim()) {
      toast.error('请输入网易云歌单 ID');
      return;
    }
    setImportLoading(true);
    try {
      await musicApi.importFromNetease({
        netease_playlist_id: importForm.netease_playlist_id.trim(),
        title: importForm.title || undefined,
        description: importForm.description || undefined,
        tags: importForm.tags || undefined,
        is_public: importForm.is_public,
      });
      setShowImport(false);
      setImportForm({ netease_playlist_id: '', title: '', description: '', tags: '', is_public: true });
      toast.success('歌单导入成功');
      loadLibraries();
    } catch (e: any) {
      const msg = e?.response?.data?.detail || e?.message || '导入失败';
      toast.error(typeof msg === 'object' ? JSON.stringify(msg) : msg);
    } finally {
      setImportLoading(false);
    }
  };

  const handleSync = async (id: number) => {
    try {
      await musicApi.syncLibrary(id);
      toast.success('歌单同步成功');
      loadLibraries();
      if (selectedLibrary?.id === id) {
        loadTracks(id);
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || e?.message || '同步失败');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await musicApi.deleteLibrary(deleteTargetId);
      toast.success('歌单已删除');
      if (selectedLibrary?.id === deleteTargetId) {
        setSelectedLibrary(null);
      }
      loadLibraries();
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || e?.message || '删除失败');
    } finally {
      setDeleteTargetId(null);
    }
  };

  const handlePlay = async (track: MusicTrack) => {
    if (playingTrack?.id === track.id) {
      setPlayingTrack(null);
      return;
    }
    try {
      const res = (await musicApi.getTrackPlayer(track.id)) as PlayerResponse;
      setPlayingTrack({ id: track.id, title: track.title, iframe: res?.iframe_code });
      musicApi.recordPlay(track.id).catch(() => {});
    } catch (_) {
      toast.error('获取播放器失败');
    }
  };

  // iframe_code 来自后端存储，须经白名单净化后再注入，防止存储型 XSS
  const playerIframeHtml = playingTrack?.iframe ? sanitizeIframeEmbed(playingTrack.iframe) : '';

  return (
    <div className="wc-page music-page">
      {/* 顶部 Header 导航 */}
      <div className="wc-page-header">
        <div className="wc-page-heading">
          <span className="wc-accent-bar" />
          {selectedLibrary ? (
            <button
              type="button"
              className="wc-btn wc-btn-ghost"
              onClick={() => setSelectedLibrary(null)}
            >
              <ChevronLeft size={18} /> 返回歌单列表
            </button>
          ) : null}
          <div>
            <h1 className="wc-page-title">
              {selectedLibrary ? selectedLibrary.title : '音乐馆'}
            </h1>
            <p className="wc-page-subtitle">
              {selectedLibrary
                ? selectedLibrary.description || `共 ${tracks.length} 首曲目`
                : '基于网易云音乐，管理歌单与播放'}
            </p>
          </div>
        </div>

        <div className="wc-page-actions">
          {!selectedLibrary && (
            <>
              <button type="button" className="wc-btn wc-btn-secondary" onClick={loadLibraries}>
                <RefreshCw size={15} /> 刷新
              </button>
              <button type="button" className="wc-btn wc-btn-primary" onClick={() => setShowImport(true)}>
                <Plus size={15} /> 从网易云导入歌单
              </button>
            </>
          )}
        </div>
      </div>

      {error && <div className="wc-alert wc-alert-error">{error}</div>}

      {/* 导入弹窗 */}
      {showImport && (
        <div className="wc-modal-overlay">
          <div className="wc-modal">
            <div className="wc-modal-header">
              <h2 className="wc-modal-title">从网易云导入歌单</h2>
              <button type="button" className="wc-icon-btn" onClick={() => setShowImport(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="wc-modal-body">
              <div className="wc-field">
                <label className="wc-label">网易云歌单 ID<span className="wc-required">*</span></label>
                <input
                  type="text"
                  className="wc-input"
                  placeholder="例如: 24381923"
                  value={importForm.netease_playlist_id}
                  onChange={(e) => setImportForm({ ...importForm, netease_playlist_id: e.target.value })}
                />
                <p className="wc-help">可从网易云歌单链接 https://music.163.com/#/playlist?id=xxx 中获取数字 ID</p>
              </div>
              <div className="wc-field">
                <label className="wc-label">自定义歌单名称（可选）</label>
                <input
                  type="text"
                  className="wc-input"
                  placeholder="留空自动使用网易云歌单名"
                  value={importForm.title}
                  onChange={(e) => setImportForm({ ...importForm, title: e.target.value })}
                />
              </div>
              <div className="wc-field">
                <label className="wc-label">描述（可选）</label>
                <input
                  type="text"
                  className="wc-input"
                  placeholder="简短描述"
                  value={importForm.description}
                  onChange={(e) => setImportForm({ ...importForm, description: e.target.value })}
                />
              </div>
            </div>
            <div className="wc-modal-footer">
              <button type="button" className="wc-btn wc-btn-secondary" onClick={() => setShowImport(false)}>
                取消
              </button>
              <button type="button" className="wc-btn wc-btn-primary" onClick={handleImport} disabled={importLoading}>
                {importLoading ? '导入中...' : '确认导入'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 一级视图：歌单行卡片列表 (Level 1 Playlist Rows) */}
      {!selectedLibrary && (
        <>
          {loading ? (
            <div className="wc-loading">
              <Loader2 size={18} className="wc-spinner" /> 加载歌单列表...
            </div>
          ) : libraries.length === 0 ? (
            <div className="wc-empty">
              <div className="wc-empty-icon">
                <Music2 size={28} strokeWidth={1.5} />
              </div>
              <p>暂无歌单</p>
              <p className="wc-help">点击右上角「从网易云导入歌单」添加歌单</p>
            </div>
          ) : (
            <div className="wc-list music-playlist-list">
              {libraries.map((lib) => (
                <div key={lib.id} className="wc-list-row music-playlist-row">
                  {/* 歌单封面 */}
                  {lib.cover_image_url ? (
                    <img src={lib.cover_image_url} alt="" className="music-cover-thumb" />
                  ) : (
                    <div className="music-cover-thumb music-cover-placeholder">
                      <Music2 size={24} />
                    </div>
                  )}

                  {/* 歌单信息 */}
                  <div className="wc-list-row-main music-playlist-main">
                    <div className="music-title-wrap">
                      <h3
                        className="wc-list-row-title music-playlist-title"
                        onClick={() => setSelectedLibrary(lib)}
                      >
                        {lib.title}
                      </h3>
                      <span className="wc-badge wc-badge-info">{lib.track_count ?? 0} 首</span>
                    </div>

                    <p className="wc-list-row-desc">{lib.description || '网易云音乐导入歌单'}</p>

                    <div className="wc-list-row-meta">
                      {lib.tags && <span className="wc-tag">{lib.tags}</span>}
                      {lib.netease_url && (
                        <a
                          href={lib.netease_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="wc-link"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink size={12} /> 网易云源 ↗
                        </a>
                      )}
                    </div>
                  </div>

                  {/* 操纵按钮 */}
                  <div className="wc-list-row-actions music-playlist-actions">
                    <button
                      type="button"
                      className="wc-btn wc-btn-secondary"
                      onClick={() => setSelectedLibrary(lib)}
                    >
                      <ListMusic size={15} /> 查看曲目
                    </button>

                    <button
                      type="button"
                      className="wc-icon-btn"
                      onClick={() => handleSync(lib.id)}
                      title="同步网易云歌单"
                    >
                      <CloudSync size={16} />
                    </button>

                    <button
                      type="button"
                      className="wc-icon-btn wc-icon-btn-danger"
                      onClick={() => setDeleteTargetId(lib.id)}
                      title="删除歌单"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* 二级视图：歌单曲目列表 (Level 2 Tracks Detail View) */}
      {selectedLibrary && (
        <div className="music-detail-view">
          {/* 歌单头部 Banner */}
          <div className="wc-card music-detail-header-card">
            {selectedLibrary.cover_image_url ? (
              <img src={selectedLibrary.cover_image_url} alt="" className="music-detail-cover" />
            ) : (
              <div className="music-detail-cover music-cover-placeholder">
                <Music2 size={36} />
              </div>
            )}
            <div className="music-detail-info">
              <h2 className="music-detail-title">{selectedLibrary.title}</h2>
              <p className="music-detail-desc">{selectedLibrary.description || '暂无详细描述'}</p>
              <div className="music-detail-meta">
                <span className="wc-badge wc-badge-info">{tracks.length} 首歌曲</span>
                {selectedLibrary.netease_url && (
                  <a
                    href={selectedLibrary.netease_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="wc-link"
                  >
                    <ExternalLink size={13} /> 打开网易云源链接
                  </a>
                )}
              </div>
            </div>
            <div className="music-detail-header-actions">
              <button
                type="button"
                className="wc-btn wc-btn-secondary"
                onClick={() => handleSync(selectedLibrary.id)}
              >
                <CloudSync size={15} /> 同步最新歌曲
              </button>
            </div>
          </div>

          {/* 曲目列表 Table */}
          {tracksLoading ? (
            <div className="wc-loading">
              <Loader2 size={18} className="wc-spinner" /> 加载曲目集中...
            </div>
          ) : tracks.length === 0 ? (
            <div className="wc-empty">
              <p>暂无歌曲曲目</p>
            </div>
          ) : (
            <div className="wc-card music-track-table-card">
              <div className="wc-list music-track-table">
                {/* 表头 */}
                <div className="music-track-row music-track-row-header">
                  <span className="col-num">#</span>
                  <span className="col-title"><Music2 size={13} /> 歌曲标题</span>
                  <span className="col-artist"><User size={13} /> 歌手</span>
                  <span className="col-album"><Disc size={13} /> 专辑</span>
                  <span className="col-duration"><Clock size={13} /> 时长</span>
                  <span className="col-actions">操作</span>
                </div>

                {/* 歌曲行 */}
                {tracks.map((track, idx) => (
                  <div
                    key={track.id}
                    className={`music-track-row ${playingTrack?.id === track.id ? 'is-playing' : ''}`}
                  >
                    <span className="col-num">{idx + 1}</span>
                    <span className="col-title font-medium">{track.title}</span>
                    <span className="col-artist">{track.artist || '未知歌手'}</span>
                    <span className="col-album">{track.album || '未知专辑'}</span>
                    <span className="col-duration">{formatDuration(track.duration)}</span>
                    <span className="col-actions">
                      <button
                        type="button"
                        className={`wc-btn ${playingTrack?.id === track.id ? 'wc-btn-primary' : 'wc-btn-secondary'}`}
                        onClick={() => handlePlay(track)}
                      >
                        <Play size={13} /> {playingTrack?.id === track.id ? '播放中' : '播放'}
                      </button>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 底部悬浮播放器 */}
      {playingTrack && (
        <div className="music-player-fixed-bar">
          <div className="player-inner">
            <span className="player-track-name">正在播放: {playingTrack.title || '未知曲目'}</span>
            {playerIframeHtml ? (
              <div
                ref={playerContainerRef}
                className="player-iframe-container"
                dangerouslySetInnerHTML={{ __html: playerIframeHtml }}
              />
            ) : (
              <span className="player-no-iframe">外链播放器不可用</span>
            )}
            <button
              type="button"
              className="wc-icon-btn"
              onClick={() => setPlayingTrack(null)}
              title="关闭播放器"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* 删除确认弹窗 */}
      <ConfirmModal
        isOpen={deleteTargetId !== null}
        title="确认删除歌单"
        message="确定要彻底删除这个歌单及其记录吗？"
        variant="danger"
        confirmText="删除歌单"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
}
