'use client'

import { useEffect, useState, useMemo, useCallback, memo } from 'react'
import { useTranslations } from 'next-intl'
import { Icon } from '@iconify/react'
import {
  type MusicTrack,
  type MusicHomeResponse,
  getMusicHome,
  getRandomTracks,
  getNeteasePlayerUrl,
  formatDuration,
  parseTags,
  MUSIC_CATEGORY_LABEL,
  MUSIC_STATUS_LABEL,
} from '@/lib/api'
import { useMusicContext } from '@/contexts/MusicContext'

type MusicPlayerProps = {
  /**
   * 展示变体：
   * - sidebar：右侧栏的小卡片（默认）
   * - page：音乐馆页面的大卡片样式
   */
  variant?: 'sidebar' | 'page'
}

function MusicPlayer({ variant = 'sidebar' }: MusicPlayerProps) {
  const t = useTranslations('blog')
  const musicContext = useMusicContext()
  const nowPlaying = musicContext?.nowPlaying ?? null
  const [homeData, setHomeData] = useState<MusicHomeResponse | null>(null)
  const [fallbackTracks, setFallbackTracks] = useState<MusicTrack[]>([])
  const [tracksLoading, setTracksLoading] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false) // 首页接口和随机接口都拿不到曲目时为 true
  const [isExpanded, setIsExpanded] = useState(variant === 'page')
  const [isHidden, setIsHidden] = useState(false)
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0)
  const [isDark, setIsDark] = useState(false)

  const tracks = useMemo(
    () => (homeData?.recent_tracks?.length ? homeData.recent_tracks : fallbackTracks),
    [homeData, fallbackTracks]
  )
  const stats = homeData?.stats
  const playlists = homeData?.playlists ?? []

  const loadTracks = useCallback(async () => {
    setTracksLoading(true)
    setLoadFailed(false)
    const home = await getMusicHome()
    if (home?.recent_tracks?.length) {
      setHomeData(home)
      setFallbackTracks([])
      setTracksLoading(false)
      return
    }
    const random = await getRandomTracks(10)
    setHomeData(home ?? null)
    setFallbackTracks(Array.isArray(random) && random.length ? random : [])
    setLoadFailed(!(Array.isArray(random) && random.length))
    setTracksLoading(false)
  }, [])

  useEffect(() => {
    loadTracks()
  }, [loadTracks])

  // 检测深色模式
  useEffect(() => {
    if (typeof window === 'undefined') return

    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'))
    }

    checkDarkMode()

    const observer = new MutationObserver(checkDarkMode)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })

    return () => observer.disconnect()
  }, [])

  const currentTrack = useMemo(
    () => (tracks.length ? tracks[currentTrackIndex % tracks.length] : null),
    [tracks, currentTrackIndex]
  )

  // 侧栏优先使用音乐馆同步的「正在播放」，切页后继续播
  const effectiveTrack = useMemo(
    () => (variant === 'sidebar' && nowPlaying?.track ? nowPlaying.track : currentTrack),
    [variant, nowPlaying, currentTrack]
  )

  const handlePrev = useCallback(() => {
    setCurrentTrackIndex((prev) => (tracks.length ? (prev - 1 + tracks.length) % tracks.length : 0))
  }, [tracks.length])

  const handleNext = useCallback(() => {
    setCurrentTrackIndex((prev) => (tracks.length ? (prev + 1) % tracks.length : 0))
  }, [tracks.length])

  const trackTitle = effectiveTrack?.title ?? ''
  const trackArtist = effectiveTrack?.artist ?? ''
  const trackCover = effectiveTrack?.cover_image_url ?? null
  // 仅当 netease_id 为数字时才嵌入网易云播放器（测试 ID 如 test_xxx 会跳过）
  const hasValidNeteaseId = effectiveTrack?.netease_id != null && /^\d+$/.test(String(effectiveTrack.netease_id))
  const neteasePlayerUrl = hasValidNeteaseId && effectiveTrack ? getNeteasePlayerUrl(effectiveTrack.netease_id, 86) : null
  const trackTags = useMemo(() => parseTags(effectiveTrack?.tags ?? null), [effectiveTrack?.tags])
  const categoryLabel = effectiveTrack ? (MUSIC_CATEGORY_LABEL[effectiveTrack.category] || effectiveTrack.category) : ''
  const statusLabel = effectiveTrack ? (MUSIC_STATUS_LABEL[effectiveTrack.status] || effectiveTrack.status) : ''

  // 如果隐藏了，不显示任何内容
  if (variant !== 'page' && isHidden) {
    return (
      <button
        onClick={() => setIsHidden(false)}
        className="flex items-center justify-center w-full h-12 rounded-lg text-gray-600 dark:text-gray-400 hover:text-[var(--theme-primary-500)] dark:hover:text-[var(--theme-primary-400)] hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-200"
        aria-label={t('musicTooltip')}
      >
        <Icon icon="mdi:music" className="w-6 h-6" />
        <span className="ml-2 text-sm">显示音乐播放器</span>
      </button>
    )
  }

  const sidebarHasGlobalTrack = variant === 'sidebar' && nowPlaying?.track
  if (tracksLoading && !sidebarHasGlobalTrack) {
    return (
      <div className="flex items-center justify-center w-full h-12 rounded-xl bg-black/5 dark:bg-white/5 text-gray-500 dark:text-gray-400 text-sm">
        <Icon icon="mdi:loading" className="w-5 h-5 animate-spin mr-2" />
        加载音乐…
      </div>
    )
  }

  if (!effectiveTrack) {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-[3rem] rounded-xl bg-black/5 dark:bg-white/5 text-gray-500 dark:text-gray-400 text-sm p-3 gap-2">
        {loadFailed ? (
          <>
            <span>加载失败，请检查网络或后端服务（/api/music）</span>
            <button
              type="button"
              onClick={() => loadTracks()}
              className="text-[var(--theme-primary-500)] dark:text-[var(--theme-primary-400)] hover:underline"
            >
              重试
            </button>
          </>
        ) : (
          <span>暂无歌曲</span>
        )}
      </div>
    )
  }

  // 首页侧栏：仅展示当前歌曲 + 进度条，不提供选歌/切歌
  if (variant === 'sidebar') {
    return (
      <div className="w-full space-y-3">
        <div
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl backdrop-blur-sm transition-all duration-200 w-full"
          style={{
            backgroundColor: isDark ? 'rgba(30, 30, 30, 0.6)' : 'rgba(250, 250, 248, 0.8)',
            boxShadow: isDark ? '0 1px 4px rgba(0, 0, 0, 0.2)' : '0 1px 4px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.03)',
          }}
        >
          <div
            className="w-10 h-10 rounded-full flex-shrink-0 overflow-hidden"
            style={
              trackCover
                ? { backgroundImage: `url(${trackCover})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                : { background: 'linear-gradient(135deg, var(--theme-primary-400), var(--theme-secondary))' }
            }
          >
            {!trackCover && <div className="w-full h-full flex items-center justify-center text-white text-xl">🎵</div>}
          </div>
          <div className="flex-grow min-w-0">
            <p className="text-xs font-medium text-gray-700 dark:text-gray-200 truncate leading-tight">{trackTitle}</p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate leading-tight mt-0.5">{trackArtist}</p>
            {stats && (
              <p className="text-[9px] text-gray-400 dark:text-gray-500 mt-0.5">
                {stats.total_tracks} 首 · {stats.total_play_count} 次播放
              </p>
            )}
          </div>
          <button
            onClick={() => setIsHidden(true)}
            className="p-1 rounded text-gray-500 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors flex-shrink-0"
            aria-label="隐藏播放器"
            title="隐藏播放器"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          </button>
        </div>
        {neteasePlayerUrl ? (
          <div className="w-full rounded-lg border border-black/10 dark:border-white/10 px-3 py-2 flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span>正在底部播放器中播放</span>
          </div>
        ) : (
          <div className="w-full rounded-lg border border-black/10 dark:border-white/10 px-3 py-3 text-center text-xs text-gray-500 dark:text-gray-400">
            该歌曲暂不支持在线播放
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="w-full">
      {isExpanded || variant === 'page' ? (
        /* 展开时：渐变描边 + 玻璃底 */
        <div
          className={`rounded-[22px] p-[1px] transition-all duration-500 ease-out ${variant === 'page' ? 'w-full' : 'w-full max-w-[268px]'
            }`}
          style={{
            background: 'linear-gradient(135deg, var(--theme-primary-400), var(--theme-secondary-500), var(--theme-primary-400))',
            boxShadow: isDark
              ? '0 25px 50px -12px rgba(0,0,0,0.4), 0 0 30px -8px var(--theme-primary-500)'
              : '0 25px 50px -12px rgba(0,0,0,0.15), 0 0 30px -10px var(--theme-primary-400)',
          }}
        >
          <div
            className="backdrop-blur-2xl rounded-3xl w-full p-4 overflow-hidden"
            style={{
              background: isDark
                ? 'linear-gradient(160deg, rgba(17, 24, 39, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%)'
                : 'linear-gradient(160deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.95) 100%)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12)',
            }}
          >
            <div className="relative">
              {/* 背景渐变装饰 */}
              <div
                className="absolute -inset-1 rounded-3xl opacity-30 blur-xl -z-10"
                style={{
                  background: `linear-gradient(135deg, var(--theme-primary-400), var(--theme-secondary))`
                }}
              />

              <div className="relative space-y-3">
                {/* 顶部：统计 + 收起（仅 page 变体有展开/收起） */}
                <div className="flex items-center justify-between gap-2">
                  {stats && (
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate flex items-center gap-1.5">
                      <span>{stats.total_playlists} 个歌单</span>
                      <span aria-hidden>·</span>
                      <span>{stats.total_tracks} 首</span>
                      <span aria-hidden>·</span>
                      <span>{stats.total_play_count} 次播放</span>
                    </p>
                  )}
                  {variant === 'page' && (
                    <button
                      onClick={() => setIsExpanded(false)}
                      className="p-1 rounded-full backdrop-blur-sm hover:bg-white/10 dark:hover:bg-white/5 flex-shrink-0"
                      aria-label="收起"
                    >
                      <svg className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* 歌单列表（接口 playlists）- 仅 page 变体 */}
                {variant === 'page' && playlists.length > 0 && (
                  <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                    {playlists.slice(0, 5).map((pl) => (
                      <span
                        key={pl.id}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] whitespace-nowrap flex-shrink-0 border"
                        style={{
                          backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                          borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                          color: 'var(--theme-primary-600)',
                        }}
                        title={pl.description ?? pl.title}
                      >
                        {pl.cover_image_url && (
                          <span
                            className="w-4 h-4 rounded flex-shrink-0"
                            style={{
                              backgroundImage: `url(${pl.cover_image_url})`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                            }}
                          />
                        )}
                        {pl.title}
                        <span className="opacity-70">({pl.track_count})</span>
                      </span>
                    ))}
                  </div>
                )}

                {/* 当前曲目：封面 + 信息（接口 Track 字段） */}
                <div className="flex items-start gap-3">
                  <div
                    className="w-14 h-14 rounded-xl flex-shrink-0 overflow-hidden border border-white/10"
                    style={
                      trackCover
                        ? {
                          backgroundImage: `url(${trackCover})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                        }
                        : {
                          background: 'linear-gradient(135deg, var(--theme-primary-400), var(--theme-secondary))',
                        }
                    }
                  >
                    {!trackCover && (
                      <div className="w-full h-full flex items-center justify-center text-white text-xl">🎵</div>
                    )}
                  </div>
                  <div className="flex-grow min-w-0">
                    <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">{trackTitle}</p>
                    <p className="text-[10px] text-gray-600 dark:text-gray-400 truncate">{trackArtist}</p>
                    <div className="flex flex-wrap items-center gap-1 mt-1">
                      {currentTrack?.album && (
                        <span className="text-[9px] text-gray-500 dark:text-gray-500 truncate max-w-[120px]" title={currentTrack.album}>
                          {currentTrack.album}
                        </span>
                      )}
                      {currentTrack?.duration != null && (
                        <span className="text-[9px] text-gray-500 dark:text-gray-500">
                          {formatDuration(currentTrack.duration)}
                        </span>
                      )}
                      {currentTrack?.year != null && (
                        <span className="text-[9px] text-gray-500 dark:text-gray-500">{currentTrack.year}</span>
                      )}
                      {categoryLabel && (
                        <span
                          className="text-[8px] px-1.5 py-0.5 rounded"
                          style={{
                            backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                            color: 'var(--theme-primary-500)',
                          }}
                        >
                          {categoryLabel}
                        </span>
                      )}
                      {statusLabel && (
                        <span className="text-[8px] text-gray-500 dark:text-gray-500">{statusLabel}</span>
                      )}
                      {currentTrack?.rating != null && (
                        <span className="text-[9px] text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                          <Icon icon="mdi:star" className="w-3 h-3" />
                          {currentTrack.rating.toFixed(1)}
                        </span>
                      )}
                      {currentTrack?.is_favorite && (
                        <Icon icon="mdi:heart" className="w-3.5 h-3.5 text-pink-500" aria-label="已收藏" />
                      )}
                      {currentTrack?.play_count != null && currentTrack.play_count > 0 && (
                        <span className="text-[9px] text-gray-500 dark:text-gray-500">
                          {currentTrack.play_count} 次
                        </span>
                      )}
                    </div>
                    {trackTags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {trackTags.slice(0, 4).map((tag) => (
                          <span
                            key={tag}
                            className="text-[8px] px-1.5 py-0.5 rounded-full border border-white/10"
                            style={{
                              backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.2)',
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* 曲目列表（可点击切歌）- 仅音乐馆 page 变体 */}
                {variant === 'page' && tracks.length > 1 && (
                  <div className="max-h-24 overflow-y-auto rounded-lg border border-white/10 scrollbar-thin" style={{ backgroundColor: isDark ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.04)' }}>
                    {tracks.map((tr, i) => (
                      <button
                        key={tr.id}
                        type="button"
                        onClick={() => setCurrentTrackIndex(i)}
                        className={`w-full text-left px-2 py-1.5 rounded flex items-center gap-2 text-[10px] transition-colors ${i === currentTrackIndex % tracks.length
                          ? 'bg-[var(--theme-primary-500)]/20 text-[var(--theme-primary-600)] dark:text-[var(--theme-primary-400)]'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-white/5 dark:hover:bg-white/5'
                          }`}
                      >
                        <span className="w-4 flex-shrink-0 text-center opacity-70">{i + 1}</span>
                        <span className="truncate flex-1">{tr.title}</span>
                        <span className="truncate max-w-[80px] opacity-80">{tr.artist}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* 播放指示器（iframe 在全局播放器中渲染） */}
                {neteasePlayerUrl ? (
                  <div className="w-full rounded-lg border border-white/10 px-3 py-3 flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                    <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span>正在底部播放器中播放</span>
                  </div>
                ) : currentTrack ? (
                  <div className="w-full rounded-lg border border-white/10 px-3 py-4 text-center text-xs text-gray-500 dark:text-gray-400">
                    该歌曲暂不支持在线播放
                  </div>
                ) : null}

                {/* 上一首 / 下一首 */}
                <div className="flex items-center justify-center gap-1.5">
                  <button
                    className="p-1.5 rounded-full backdrop-blur-sm hover:bg-white/10 dark:hover:bg-white/5 transition-all hover:scale-110 active:scale-95"
                    style={{
                      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.15)',
                    }}
                    aria-label="上一首"
                    onClick={handlePrev}
                  >
                    <span className="text-sm">⏮</span>
                  </button>
                  <button
                    className="p-1.5 rounded-full backdrop-blur-sm hover:bg-white/10 dark:hover:bg-white/5 transition-all hover:scale-110 active:scale-95"
                    style={{
                      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.15)',
                    }}
                    aria-label="下一首"
                    onClick={handleNext}
                  >
                    <span className="text-sm">⏭</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* 折叠状态：紧凑的横向卡片 */
        <div
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl backdrop-blur-sm transition-all duration-200 hover:shadow-md cursor-pointer w-full"
          style={{
            backgroundColor: isDark ? 'rgba(30, 30, 30, 0.6)' : 'rgba(250, 250, 248, 0.8)',
            boxShadow: isDark
              ? '0 1px 4px rgba(0, 0, 0, 0.2)'
              : '0 1px 4px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.03)',
          }}
          onClick={() => setIsExpanded(true)}
        >
          {/* 左侧：圆形专辑封面 */}
          <div
            className="w-10 h-10 rounded-full flex-shrink-0 overflow-hidden relative group"
            style={
              trackCover
                ? {
                  backgroundImage: `url(${trackCover})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }
                : {
                  background: 'linear-gradient(135deg, var(--theme-primary-400), var(--theme-secondary))',
                }
            }
          >
            {!trackCover && (
              <div className="w-full h-full flex items-center justify-center text-white text-xl">🎵</div>
            )}
          </div>

          {/* 中间：歌名 / 艺人，下方可选统计 */}
          <div className="flex-grow min-w-0">
            <p className="text-xs font-medium text-gray-700 dark:text-gray-200 truncate leading-tight">
              {trackTitle}
            </p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate leading-tight mt-0.5">
              {trackArtist}
            </p>
            {stats && (
              <p className="text-[9px] text-gray-400 dark:text-gray-500 mt-0.5">
                {stats.total_tracks} 首 · {stats.total_play_count} 次播放
              </p>
            )}
          </div>

          {/* 右侧：两个图标 */}
          <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIsHidden(true)
              }}
              className="p-1 rounded text-gray-500 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors"
              aria-label="隐藏播放器"
              title="隐藏播放器"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIsExpanded(true)
              }}
              className="p-1 rounded text-gray-500 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors"
              aria-label="展开播放器"
              title="展开播放器"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const MemoizedMusicPlayer = memo(MusicPlayer)
export default MemoizedMusicPlayer

