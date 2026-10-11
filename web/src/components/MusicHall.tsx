'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Icon } from '@iconify/react'
import {
  type MusicHomeResponse,
  type MusicTrack,
  type MusicPlaylist,
  getMusicHome,
  getNeteasePlayerUrl,
  getRandomTracks,
  getPlaylistTracks,
  formatDuration,
  parseTags,
  MUSIC_CATEGORY_LABEL,
  MUSIC_STATUS_LABEL,
} from '@/lib/api'
import { useMusicContext } from '@/contexts/MusicContext'
import { Chip } from '@/components/ui/Chip'
import PageIntroCard, { PageIntroBadge } from '@/components/PageIntroCard'

type MusicHallProps = {
  locale: string
  compactLayout?: boolean
  /** 服务端渲染时预取的音乐馆首页数据，用于跳过客户端首次挂载的重复请求 */
  initialHome?: MusicHomeResponse | null
}

type SelectedPlaylist = MusicPlaylist | null

function SectionTitle({ icon, title, desc }: { icon: string; title: string; desc?: string }) {
  return (
    <div className="flex items-end justify-between gap-2 max-md:gap-1.5">
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 max-md:gap-1">
          <Icon icon={icon} className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" style={{ color: 'var(--theme-primary-500)' }} />
          <h2 className="truncate text-xs font-bold text-gray-900 dark:text-gray-100 sm:text-lg md:text-xl">
            {title}
          </h2>
        </div>
        {desc ? (
          <p className="mt-0.5 hidden text-xs text-gray-500 dark:text-gray-400 sm:block">{desc}</p>
        ) : null}
      </div>
    </div>
  )
}

/** 网易云风格：播放中跳动的均衡器频谱条 */
function EqBars({ className = '' }: { className?: string }) {
  return (
    <span className={`flex items-end gap-[2px] ${className}`} aria-hidden>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-[2.5px] origin-bottom rounded-full bg-[var(--theme-primary-500)]"
          style={{ height: '100%', animation: `music-eq-bounce 0.9s ease-in-out ${i * 0.18}s infinite` }}
        />
      ))}
    </span>
  )
}

export default function MusicHall({ locale, compactLayout = false, initialHome = null }: MusicHallProps) {
  const ctx = useMusicContext()
  const setNowPlaying = ctx?.setNowPlaying
  const globalNowPlaying = ctx?.nowPlaying
  const recentTracks = ctx?.recentTracks ?? []
  // 服务端注入的初始数据直接作为初值，首次挂载不再重复请求
  const [home, setHome] = useState<MusicHomeResponse | null>(initialHome)
  const [tracks, setTracks] = useState<MusicTrack[]>(initialHome?.recent_tracks ?? [])
  // acceptedIndex 用于在没有全局播放时（极少情况）或用户浏览时暂存选中态
  // 但为了简化，我们让右侧卡片始终显示“当前播放”或“通过点击列表触发播放”
  // 这里保留 selectedIndex 仅用于并在加载时初始化，主要 UI 依赖 globalNowPlaying
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [loading, setLoading] = useState(!initialHome)
  const [recentOpen, setRecentOpen] = useState(false)
  const [selectedPlaylist, setSelectedPlaylist] = useState<SelectedPlaylist>(null)
  const [playlistTracks, setPlaylistTracks] = useState<MusicTrack[]>([])
  const [playlistTracksLoading, setPlaylistTracksLoading] = useState(false)

  // 优先使用全局播放的歌曲作为“当前选中/展示”的歌曲
  // 如果全局没播，降级使用本地列表的第一首（selectedIndex）
  const selectedTrack = useMemo(() => {
    if (globalNowPlaying?.track) return globalNowPlaying.track
    if (!tracks.length) return null
    return tracks[selectedIndex] ?? null
  }, [globalNowPlaying, tracks, selectedIndex])

  // 全局播放器是否正在播放（用于 EQ 均衡器 / 封面光环动效）
  const isPlaying = !!ctx?.nowPlaying

  // 播放指定歌曲（用户点击列表，或点击上一首/下一首）
  const handlePlay = useCallback((track: MusicTrack) => {
    if (!setNowPlaying) return
    // 标记为“用户手动点歌”，用于全局播放器避免不可播时自动跳歌造成“点1选2”的错觉
    try {
      const nid = track?.netease_id != null ? String(track.netease_id) : ''
      if (/^\d+$/.test(nid)) sessionStorage.setItem('music:lastManualNeteaseId', nid)
    } catch {
      // ignore
    }
    // 找到该歌曲在当前列表中的 index（如果存在）
    // 注意：如果 tracks 是推荐流，而播放的是歌单里的，这里可能找不到，导致 index=-1
    // 但 setNowPlaying 允许传新列表
    const idx = tracks.findIndex(t => t.id === track.id)
    setNowPlaying(track, tracks, idx >= 0 ? idx : 0)
  }, [setNowPlaying, tracks])

  // 播放歌单内的歌曲（使用歌单曲目列表作为播放队列）
  const handlePlayFromPlaylist = useCallback((track: MusicTrack) => {
    if (!setNowPlaying) return
    try {
      const nid = track?.netease_id != null ? String(track.netease_id) : ''
      if (/^\d+$/.test(nid)) sessionStorage.setItem('music:lastManualNeteaseId', nid)
    } catch {
      // ignore
    }
    const idx = playlistTracks.findIndex(t => t.id === track.id)
    setNowPlaying(track, playlistTracks, idx >= 0 ? idx : 0)
  }, [setNowPlaying, playlistTracks])

  // 网易云风：hover 歌单封面中央播放按钮 → 加载歌单并直接播放第一首
  const handlePlayPlaylist = useCallback(async (pl: MusicPlaylist) => {
    if (!setNowPlaying) return
    setSelectedPlaylist(pl)
    let list = playlistTracks
    if (selectedPlaylist?.id !== pl.id || playlistTracks.length === 0) {
      try {
        const fetched = await getPlaylistTracks(pl.id)
        setPlaylistTracks(fetched)
        list = fetched
      } catch {
        return
      }
    }
    const track = list[0]
    if (!track) return
    try {
      const nid = track?.netease_id != null ? String(track.netease_id) : ''
      if (/^\d+$/.test(nid)) sessionStorage.setItem('music:lastManualNeteaseId', nid)
    } catch {
      // ignore
    }
    setNowPlaying(track, list, 0)
  }, [setNowPlaying, playlistTracks, selectedPlaylist])

  // 上一首/下一首控制
  const handlePrevNext = useCallback((direction: 'prev' | 'next') => {
    if (!selectedTrack || !tracks.length || !setNowPlaying) return
    const currentIdx = tracks.findIndex(t => t.id === selectedTrack.id)
    // 如果当前歌不在列表里（比如是初始加载），默认从 0 开始
    const baseIdx = currentIdx >= 0 ? currentIdx : 0
    let nextIdx = direction === 'next' ? baseIdx + 1 : baseIdx - 1
    // 循环播放
    nextIdx = ((nextIdx % tracks.length) + tracks.length) % tracks.length
    const nextTrack = tracks[nextIdx]
    if (nextTrack) {
      setNowPlaying(nextTrack, tracks, nextIdx)
    }
  }, [selectedTrack, tracks, setNowPlaying])

  const hasValidNeteaseId =
    selectedTrack?.netease_id != null && /^\d+$/.test(String(selectedTrack.netease_id))
  // 音乐馆内自动播放：如果当前展示的歌就是正在播放的歌，且有 ID，生成 URL
  // 这里要注意：GlobalMusicPlayer 已经在播放了。
  // 右侧卡片本来是用来“控制播放”的。如果 Global 已经在播，右侧卡片应该显示“正在播放”。
  // 原有的 neteasePlayerUrl 逻辑是用于在右侧卡片里显示 an iframe（如果不使用全局播放器的话）。
  // 但既然有了 GlobalMusicPlayer，右侧卡片其实不需要再渲染 iframe 了，除非用户通过某种方式禁用了全局。
  // 为了从简，保持原有 UI 逻辑：如果支持网易云，显示“正在底部播放器中播放”的提示（原代码 L618）
  const neteasePlayerUrl = selectedTrack && hasValidNeteaseId ? getNeteasePlayerUrl(selectedTrack.netease_id, 126, true) : null

  const tags = useMemo(() => parseTags(selectedTrack?.tags ?? null), [selectedTrack?.tags])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const h = await getMusicHome()
      setHome(h)
      let list: MusicTrack[] = []
      if (h?.recent_tracks?.length) {
        list = h.recent_tracks
        setTracks(list)
      } else {
        const random = await getRandomTracks(30)
        list = random ?? []
        setTracks(list)
      }
      // 恢复上次选中的曲目（切换页面后再回来保持记忆）
      // 这里的逻辑不再需要，因为现在主要依赖 globalNowPlaying
      // 如果 globalNowPlaying 存在，会优先显示它
      // 如果不存在，就显示列表的第一首
      setSelectedIndex(0) // 确保至少有一个默认选中项
      setLoading(false)
    } catch {
      setHome(null)
      setTracks([])
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // 服务端已注入初始数据时，首次挂载不再重复请求 getMusicHome；
    // 最近播放为空时按原逻辑补拉随机曲目兜底
    if (initialHome) {
      if (initialHome.recent_tracks?.length) return undefined
      let cancelled = false
      getRandomTracks(30)
        .then((random) => {
          if (!cancelled) setTracks(random ?? [])
        })
        .catch(() => {
          // 拉取失败保持空列表，不覆盖服务端数据
        })
      return () => {
        cancelled = true
      }
    }
    // 服务端未取到数据（null/undefined）时，兜底走完整加载
    load()
    return undefined
  }, [initialHome, load])

  // 选中歌单时加载歌单内的歌曲
  useEffect(() => {
    if (!selectedPlaylist) {
      setPlaylistTracks([])
      return
    }
    let cancelled = false
    setPlaylistTracksLoading(true)
    getPlaylistTracks(selectedPlaylist.id).then((list) => {
      if (!cancelled) {
        setPlaylistTracks(list)
        setPlaylistTracksLoading(false)
      }
    }).catch(() => {
      if (!cancelled) {
        setPlaylistTracks([])
        setPlaylistTracksLoading(false)
      }
    })
    return () => { cancelled = true }
  }, [selectedPlaylist])

  useEffect(() => {
    try {
      const raw = localStorage.getItem('musicHall:recentOpen')
      if (raw === '1') setRecentOpen(true)
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem('musicHall:recentOpen', recentOpen ? '1' : '0')
    } catch {
      // ignore
    }
  }, [recentOpen])

  const titleText =
    locale === 'zh' ? '音乐馆' : locale === 'ja' ? '音楽館' : locale === 'ko' ? '뮤직' : 'Music'
  const subTitleText =
    locale === 'zh'
      ? '像网易云一样浏览歌单与最近播放'
      : locale === 'ja'
        ? 'プレイリストと最近再生をまとめてチェック'
        : locale === 'ko'
          ? '플레이리스트와 최근 재생을 한눈에'
          : 'Browse playlists and recent plays'

  const playlists = home?.playlists ?? []
  const stats = home?.stats

  return (
    <div className="relative z-10 space-y-3 max-md:space-y-3 sm:space-y-8">
      {/* 手机端：正在播放 */}
      <div className="mobile-app-section sticky top-14 z-30 max-md:mobile-page-card rounded-xl border border-gray-200/80 bg-white p-2.5 shadow-sm dark:border-white/10 dark:bg-gray-900/95 md:hidden">
        <div className="flex items-center gap-2">
          <div
            className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-black/5 dark:border-white/10"
            style={
              selectedTrack?.cover_image_url
                ? {
                    backgroundImage: `url(${selectedTrack.cover_image_url})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }
                : {
                    background: 'linear-gradient(135deg, var(--theme-primary-400), var(--theme-secondary-500))',
                  }
            }
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                {locale === 'zh' ? '正在播放' : 'Now playing'}
              </p>
              {isPlaying && selectedTrack ? <EqBars className="h-2.5" /> : null}
            </div>
            <p className="line-clamp-1 text-xs font-semibold text-gray-900 dark:text-gray-100">
              {selectedTrack?.title ?? (loading ? (locale === 'zh' ? '加载中…' : 'Loading…') : '--')}
            </p>
            <p className="truncate text-[10px] text-gray-600 dark:text-gray-400">{selectedTrack?.artist ?? ''}</p>
          </div>
          <div className="flex shrink-0 items-center gap-0.5">
            <button
              type="button"
              onClick={() => handlePrevNext('prev')}
              className="rounded-md p-1 text-gray-600 dark:text-gray-300"
              aria-label="Prev"
            >
              <Icon icon="mdi:skip-previous" className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => handlePrevNext('next')}
              className="rounded-md p-1 text-gray-600 dark:text-gray-300"
              aria-label="Next"
            >
              <Icon icon="mdi:skip-next" className="h-4 w-4" />
            </button>
          </div>
        </div>
        {selectedTrack && hasValidNeteaseId ? (
          <p className="mt-1.5 flex items-center gap-1.5 text-[10px] text-green-600 dark:text-green-400">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-green-500" />
            {locale === 'zh' ? '底部播放器播放中' : 'Playing in bottom bar'}
          </p>
        ) : null}
        {selectedTrack ? (
          <div className="chip-scroll -mx-0.5 mt-1.5 flex gap-1 overflow-x-auto pb-0.5">
            {selectedTrack.duration != null && <Chip>{formatDuration(selectedTrack.duration)}</Chip>}
            <Chip>
              {(MUSIC_CATEGORY_LABEL[selectedTrack.category] || selectedTrack.category) +
                ' · ' +
                (MUSIC_STATUS_LABEL[selectedTrack.status] || selectedTrack.status)}
            </Chip>
            {tags.slice(0, 3).map((tg) => (
              <Chip key={tg}>{tg}</Chip>
            ))}
          </div>
        ) : null}
      </div>

      {stats ? (
        <div className="chip-scroll flex gap-1 overflow-x-auto pb-0.5 md:hidden">
          <Chip>
            {stats.total_playlists} {locale === 'zh' ? '歌单' : 'lists'}
          </Chip>
          <Chip>
            {stats.total_tracks} {locale === 'zh' ? '曲' : 'tracks'}
          </Chip>
          <Chip>
            {stats.total_play_count} {locale === 'zh' ? '播放' : 'plays'}
          </Chip>
        </div>
      ) : null}

      <PageIntroCard
        title={titleText}
        subtitle={subTitleText}
        meta={stats ? (
          <>
            <PageIntroBadge icon="mdi:playlist-music-outline">
              {stats.total_playlists} {locale === 'zh' ? '个歌单' : 'playlists'}
            </PageIntroBadge>
            <PageIntroBadge icon="mdi:music-note">
              {stats.total_tracks} {locale === 'zh' ? '首歌曲' : 'tracks'}
            </PageIntroBadge>
            <PageIntroBadge icon="mdi:play-outline">
              {stats.total_play_count} {locale === 'zh' ? '次播放' : 'plays'}
            </PageIntroBadge>
          </>
        ) : undefined}
        actions={
          <div className="relative w-[260px]">
            <Icon
              icon="mdi:magnify"
              className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500 dark:text-gray-400"
              aria-hidden
            />
            <input
              className="h-10 w-full rounded-xl border pl-10 pr-3 text-sm text-gray-800 placeholder:text-gray-500 focus:outline-none focus:ring-2 dark:text-gray-100"
              style={{ backgroundColor: 'var(--theme-card-bg-80)', borderColor: 'var(--theme-card-border)' }}
              placeholder={locale === 'zh' ? '搜索（UI 预留）' : 'Search (UI only)'}
              disabled
            />
          </div>
        }
      />

      <div className={`grid grid-cols-1 gap-3 ${compactLayout ? '' : 'lg:grid-cols-12 lg:gap-6'}`}>
        <div className={`space-y-4 max-md:space-y-3 lg:space-y-8 ${compactLayout ? '' : 'lg:col-span-8'}`}>
          <section
            className="mobile-app-section max-md:mobile-page-card space-y-2 rounded-2xl border p-3 shadow-sm max-md:space-y-2 sm:space-y-4 sm:rounded-3xl sm:p-5"
            style={{ backgroundColor: 'var(--theme-card-bg-90)', borderColor: 'var(--theme-card-border)' }}
          >
            <SectionTitle
              icon="mdi:playlist-music"
              title={locale === 'zh' ? '推荐歌单' : locale === 'ja' ? 'おすすめプレイリスト' : locale === 'ko' ? '추천 플레이리스트' : 'Playlists'}
              desc={locale === 'zh' ? '来自接口 playlists' : 'From API playlists'}
            />

            {loading ? (
              <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-3 sm:gap-4 md:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="aspect-square animate-pulse rounded-xl bg-white/60 dark:bg-gray-900/50 sm:rounded-2xl" />
                ))}
              </div>
            ) : playlists.length ? (
              <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-3 sm:gap-4 md:grid-cols-4">
                {playlists.slice(0, 12).map((pl) => {
                  const isSelected = selectedPlaylist?.id === pl.id
                  return (
                    <button
                      key={pl.id}
                      type="button"
                      onClick={() => setSelectedPlaylist(isSelected ? null : pl)}
                      className="group overflow-hidden rounded-lg text-left transition-all duration-200 sm:rounded-xl"
                      style={{
                        background: 'var(--theme-card-bg)',
                        boxShadow: isSelected
                          ? '0 0 0 2px var(--theme-primary-400), 0 8px 30px rgba(0,0,0,0.12)'
                          : '0 1px 3px rgba(0,0,0,0.05)',
                      }}
                      title={pl.description ?? pl.title}
                    >
                      <div
                        className="relative aspect-square overflow-hidden"
                        style={
                          pl.cover_image_url
                            ? {
                              backgroundImage: `url(${pl.cover_image_url})`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                            }
                            : {
                              background: 'linear-gradient(135deg, var(--theme-primary-300), var(--theme-secondary-400))',
                            }
                        }
                      >
                        {/* 网易云风：hover 封面变暗 + 中央浮现播放按钮（点击直接播歌单） */}
                        <div className="absolute inset-0 bg-black/0 transition-colors duration-200 group-hover:bg-black/40" aria-hidden />
                        <div
                          className="absolute inset-0 flex cursor-pointer items-center justify-center opacity-0 transition-all duration-200 group-hover:scale-100 group-hover:opacity-100 scale-90"
                          onClick={(e) => {
                            e.stopPropagation()
                            handlePlayPlaylist(pl)
                          }}
                          role="button"
                          tabIndex={-1}
                          aria-label={locale === 'zh' ? `播放歌单 ${pl.title}` : `Play ${pl.title}`}
                        >
                          <Icon icon="mdi:play-circle" className="h-8 w-8 text-white drop-shadow-lg sm:h-12 sm:w-12" />
                        </div>
                        {/* 曲目数角标（网易云风格：封面右下角） */}
                        <span className="absolute right-1 bottom-1 rounded-md bg-black/50 px-1.5 py-0.5 text-[9px] font-medium text-white backdrop-blur-sm sm:right-2 sm:bottom-2 sm:text-[11px]">
                          {pl.track_count} {locale === 'zh' ? '首' : ''}
                        </span>
                        {isSelected && (
                          <div className="absolute inset-0 bg-[var(--theme-primary-500)]/25 flex items-center justify-center">
                            <Icon icon="mdi:check-circle" className="h-6 w-6 text-white drop-shadow-lg sm:h-10 sm:w-10" />
                          </div>
                        )}
                      </div>
                      <div className="relative p-1.5 sm:p-2.5">
                        <p className="line-clamp-1 text-[11px] font-semibold leading-tight text-gray-900 transition-colors duration-150 group-hover:text-[var(--theme-primary-600)] dark:text-gray-100 sm:text-sm">
                          {pl.title}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            ) : (
              <div
                className="rounded-2xl p-4 text-sm text-gray-500 dark:text-gray-400"
                style={{
                  backgroundColor: 'var(--theme-card-bg-80)',
                  borderColor: 'var(--theme-card-border)',
                }}
              >
                {locale === 'zh' ? '暂无歌单' : 'No playlists'}
              </div>
            )}

            {selectedPlaylist && (
              <div
                className="mobile-app-section max-md:mobile-page-card mt-2 animate-in overflow-hidden rounded-xl border p-2.5 fade-in slide-in-from-top-2 duration-200 sm:mt-4 sm:rounded-2xl sm:p-4"
                style={{
                  backgroundColor: 'var(--theme-card-bg-90)',
                  borderColor: 'var(--theme-card-border)',
                }}
              >
                <div
                  className="sticky top-16 z-20 -mx-2.5 mb-2 flex items-start gap-2 border-b px-2.5 pb-2 backdrop-blur-md sm:static sm:mx-0 sm:mb-0 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none sm:gap-4"
                  style={{ borderColor: 'var(--theme-card-border)' }}
                >
                  <div
                    className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-black/5 dark:border-white/10 sm:h-24 sm:w-24 sm:rounded-xl"
                    style={
                      selectedPlaylist.cover_image_url
                        ? {
                          backgroundImage: `url(${selectedPlaylist.cover_image_url})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                        }
                        : {
                          background: 'linear-gradient(135deg, var(--theme-primary-400), var(--theme-secondary-500))',
                        }
                    }
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-xs font-bold text-gray-900 dark:text-gray-100 sm:text-base">
                        {selectedPlaylist.title}
                      </h3>
                      <Chip className="sm:hidden">{selectedPlaylist.track_count}</Chip>
                      <span className="hidden rounded-full bg-[var(--theme-primary-100)] px-2 py-0.5 text-[11px] text-[var(--theme-primary-700)] dark:bg-[var(--theme-primary-900)]/30 dark:text-[var(--theme-primary-300)] sm:inline">
                        {selectedPlaylist.track_count} {locale === 'zh' ? '首' : 'tracks'}
                      </span>
                    </div>
                    {selectedPlaylist.description ? (
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {selectedPlaylist.description}
                      </p>
                    ) : null}
                    {selectedPlaylist.tags ? (
                      <div className="chip-scroll mt-1 flex gap-1 overflow-x-auto pb-0.5 sm:mt-2 sm:flex-wrap sm:overflow-visible">
                        {parseTags(selectedPlaylist.tags).map((tag) => (
                          <Chip key={tag}>{tag}</Chip>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedPlaylist(null)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10"
                    aria-label={locale === 'zh' ? '关闭' : 'Close'}
                  >
                    <Icon icon="mdi:close" className="w-5 h-5" />
                  </button>
                </div>

                {/* 歌单歌曲列表 */}
                <div className="mt-4">
                  {playlistTracksLoading ? (
                    <div className="space-y-2">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-12 rounded-xl bg-gray-100/50 dark:bg-white/5 animate-pulse" />
                      ))}
                    </div>
                  ) : playlistTracks.length > 0 ? (
                    <div
                      className="max-md:mobile-feed-panel max-md:mobile-feed-list overflow-hidden rounded-xl border sm:rounded-2xl"
                      style={{
                        backgroundColor: 'var(--theme-card-bg-80)',
                        borderColor: 'var(--theme-card-border)',
                      }}
                    >
                      <div className="divide-y max-md:divide-y-0" style={{ borderColor: 'var(--theme-card-border)' }}>
                        {playlistTracks.map((tr) => {
                          const active = selectedTrack?.id === tr.id
                          return (
                            <button
                              key={tr.id}
                              type="button"
                              onClick={() => handlePlayFromPlaylist(tr)}
                              className={`mobile-feed-item group flex w-full items-center gap-2.5 p-2.5 text-left transition-colors sm:gap-3 sm:p-3 ${active
                                ? 'bg-[var(--theme-primary-50)] dark:bg-white/5'
                                : 'hover:bg-black/5 dark:hover:bg-white/5'
                                }`}
                            >
                              <div
                                className="h-8 w-8 shrink-0 overflow-hidden rounded-lg border border-black/5 dark:border-white/10 sm:h-10 sm:w-10"
                                style={
                                  tr.cover_image_url
                                    ? {
                                      backgroundImage: `url(${tr.cover_image_url})`,
                                      backgroundSize: 'cover',
                                      backgroundPosition: 'center',
                                    }
                                    : {
                                      background: 'linear-gradient(135deg, var(--theme-primary-400), var(--theme-secondary-500))',
                                    }
                                }
                              />
                              <div className="min-w-0 flex-grow">
                                <p className="line-clamp-1 text-xs font-semibold text-gray-900 dark:text-gray-100 sm:text-sm">
                                  {tr.title}
                                </p>
                                <p className="truncate text-[10px] text-gray-600 dark:text-gray-400 sm:text-[11px]">
                                  {tr.artist}
                                  {tr.duration != null ? ` · ${formatDuration(tr.duration)}` : ''}
                                </p>
                              </div>
                              <div className="flex h-4 w-4 shrink-0 items-center justify-center sm:h-5 sm:w-5">
                                {active && isPlaying ? (
                                  <EqBars className="h-full w-full" />
                                ) : (
                                  <Icon
                                    icon={active ? 'mdi:play-circle' : 'mdi:play-circle-outline'}
                                    className={`h-4 w-4 sm:h-5 sm:w-5 transition-all duration-150 ${active
                                      ? 'text-[var(--theme-primary-600)]'
                                      : 'text-gray-400 group-hover:scale-110 group-hover:text-[var(--theme-primary-600)] dark:text-gray-500'
                                      }`}
                                  />
                                )}
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {locale === 'zh' ? '该歌单暂无歌曲' : 'No tracks in this playlist'}
                    </p>
                  )}
                </div>
              </div>
            )}
          </section>

          <section
            className="mobile-app-section max-md:mobile-page-card space-y-2 rounded-2xl border p-3 shadow-sm max-md:space-y-2 sm:space-y-4 sm:rounded-3xl sm:p-5"
            style={{ backgroundColor: 'var(--theme-card-bg-90)', borderColor: 'var(--theme-card-border)' }}
          >
            <div className="flex items-center justify-between gap-2">
              <SectionTitle
                icon="mdi:history"
                title={locale === 'zh' ? '最近播放' : locale === 'ja' ? '最近再生' : locale === 'ko' ? '최근 재생' : 'Recent'}
                desc={locale === 'zh' ? '点击歌曲播放' : 'Tap to play'}
              />

              <button
                type="button"
                onClick={() => setRecentOpen((v) => !v)}
                className="flex shrink-0 items-center gap-1 rounded-lg bg-black/5 px-2 py-1 text-[10px] text-gray-700 dark:bg-white/10 dark:text-gray-200 sm:gap-1.5 sm:rounded-xl sm:px-2.5 sm:py-1.5 sm:text-xs"
                aria-expanded={recentOpen}
                aria-controls="music-hall-recent"
              >
                <span>
                  {recentOpen
                    ? locale === 'zh'
                      ? '收起'
                      : 'Collapse'
                    : locale === 'zh'
                      ? '展开'
                      : 'Expand'}
                </span>
                <Icon
                  icon="mdi:chevron-down"
                  className={`w-4 h-4 transition-transform duration-200 ${recentOpen ? 'rotate-180' : ''}`}
                />
              </button>
            </div>

            <div id="music-hall-recent">
              {recentOpen ? (
                recentTracks.length ? (
                  <div
                    className="max-md:mobile-feed-panel max-md:mobile-feed-list overflow-hidden rounded-xl border sm:rounded-3xl"
                    style={{
                      backgroundColor: 'var(--theme-card-bg-90)',
                      borderColor: 'var(--theme-card-border)',
                    }}
                  >
                    <div className="divide-y max-md:divide-y-0" style={{ borderColor: 'var(--theme-card-border)' }}>
                      {recentTracks.map((tr) => {
                        const active = selectedTrack?.id === tr.id
                        const trTags = parseTags(tr.tags ?? null)
                        return (
                          <button
                            key={tr.id}
                            type="button"
                            onClick={() => handlePlay(tr)}
                            className={`mobile-feed-item group flex w-full items-center gap-2.5 p-2.5 text-left transition-colors sm:gap-3 sm:p-4 ${active
                              ? 'bg-[var(--theme-primary-50)] dark:bg-white/5'
                              : 'hover:bg-black/5 dark:hover:bg-white/5'
                              }`}
                          >
                            <div
                              className="h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-black/5 dark:border-white/10 sm:h-12 sm:w-12 sm:rounded-xl"
                              style={
                                tr.cover_image_url
                                  ? {
                                    backgroundImage: `url(${tr.cover_image_url})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                  }
                                  : {
                                    background:
                                      'linear-gradient(135deg, var(--theme-primary-400), var(--theme-secondary-500))',
                                  }
                              }
                            />
                            <div className="min-w-0 flex-1">
                              <p className="line-clamp-1 text-xs font-semibold text-gray-900 dark:text-gray-100 sm:text-sm">
                                {tr.title}
                              </p>
                              <div className="chip-scroll -mx-0.5 mt-1 flex gap-1 overflow-x-auto pb-0.5 md:hidden">
                                <Chip>{tr.artist}</Chip>
                                {tr.duration != null && <Chip>{formatDuration(tr.duration)}</Chip>}
                                {trTags.slice(0, 2).map((tag) => (
                                  <Chip key={tag}>{tag}</Chip>
                                ))}
                              </div>
                              <p className="mt-0.5 hidden truncate text-[11px] text-gray-600 dark:text-gray-400 sm:block">
                                {tr.artist}
                                {tr.duration != null ? ` · ${formatDuration(tr.duration)}` : ''}
                                {trTags.length ? ` · ${trTags.slice(0, 2).join(' / ')}` : ''}
                              </p>
                            </div>
                            <div className="flex h-5 w-5 shrink-0 items-center justify-center sm:h-6 sm:w-6">
                              {active && isPlaying ? (
                                <EqBars className="h-full w-full" />
                              ) : (
                                <Icon
                                  icon={active ? 'mdi:play-circle' : 'mdi:play-circle-outline'}
                                  className={`h-5 w-5 sm:h-6 sm:w-6 transition-all duration-150 ${active
                                    ? 'text-[var(--theme-primary-600)]'
                                    : 'text-gray-400 group-hover:scale-110 group-hover:text-[var(--theme-primary-600)] dark:text-gray-500'
                                    }`}
                                />
                              )}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <div
                    className="rounded-2xl p-4 text-sm text-gray-500 dark:text-gray-400"
                    style={{
                      backgroundColor: 'var(--theme-card-bg-80)',
                      borderColor: 'var(--theme-card-border)',
                    }}
                  >
                    {locale === 'zh' ? '暂无最近播放记录' : 'No recent plays'}
                  </div>
                )
              ) : recentTracks.length ? (
                <button
                  type="button"
                  onClick={() => setRecentOpen(true)}
                  className="mobile-feed-item flex w-full items-center gap-2.5 rounded-xl p-2.5 text-left transition-colors sm:gap-3 sm:rounded-2xl sm:p-4"
                  style={{
                    backgroundColor: 'var(--theme-card-bg-80)',
                    borderColor: 'var(--theme-card-border)',
                  }}
                  aria-label={locale === 'zh' ? '展开最近播放' : 'Expand recent plays'}
                >
                  <div
                    className="h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-black/5 dark:border-white/10 sm:h-12 sm:w-12 sm:rounded-xl"
                    style={
                      recentTracks[0].cover_image_url
                        ? {
                          backgroundImage: `url(${recentTracks[0].cover_image_url})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                        }
                        : {
                          background:
                            'linear-gradient(135deg, var(--theme-primary-400), var(--theme-secondary-500))',
                        }
                    }
                  />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-xs font-semibold text-gray-900 dark:text-gray-100 sm:text-sm">
                      {recentTracks[0].title}
                    </p>
                    <div className="mt-0.5 flex items-center gap-1">
                      <Chip>{recentTracks.length}</Chip>
                      <span className="truncate text-[10px] text-gray-600 dark:text-gray-400">
                        {recentTracks[0].artist}
                      </span>
                    </div>
                  </div>
                  <Icon icon="mdi:chevron-down" className="h-4 w-4 shrink-0 text-gray-500" />
                </button>
              ) : (
                <div className="rounded-2xl p-4 bg-white/60 dark:bg-gray-900/50 text-sm text-gray-500 dark:text-gray-400">
                  {locale === 'zh' ? '暂无最近播放记录' : 'No recent plays'}
                </div>
              )
              }
            </div>
          </section>
        </div>

        <aside className={compactLayout ? 'hidden' : 'relative z-20 hidden lg:col-span-4 lg:block'}>
          <div className="lg:sticky lg:top-24 space-y-4">
            <div
              className="rounded-3xl p-[1px] shadow-lg shadow-black/5 dark:shadow-black/20"
              style={{
                background: 'linear-gradient(135deg, var(--theme-primary-400), var(--theme-secondary-500), var(--theme-primary-400))',
              }}
            >
              <div className="rounded-[22px] p-5 bg-white/95 dark:bg-gray-900/90 backdrop-blur-xl border border-white/20 dark:border-white/5 shadow-inner">
                {/* 标题行 + 上下曲 */}
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-[11px] font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        {locale === 'zh' ? '正在播放' : locale === 'ja' ? '再生中' : locale === 'ko' ? '재생 중' : 'Now playing'}
                      </p>
                      {isPlaying && selectedTrack ? <EqBars className="h-3" /> : null}
                    </div>
                    <p className="mt-0.5 text-base font-bold text-gray-900 dark:text-gray-100 truncate">
                      {selectedTrack?.title ?? (loading ? (locale === 'zh' ? '加载中…' : 'Loading…') : '--')}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{selectedTrack?.artist ?? ''}</p>
                  </div>
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => handlePrevNext('prev')}
                      className="p-2.5 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-[var(--theme-primary-100)] dark:hover:bg-white/10 hover:text-[var(--theme-primary-600)] dark:hover:text-[var(--theme-primary-400)] transition-colors"
                      aria-label="Prev"
                    >
                      <Icon icon="mdi:skip-previous" className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePrevNext('next')}
                      className="p-2.5 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-[var(--theme-primary-100)] dark:hover:bg-white/10 hover:text-[var(--theme-primary-600)] dark:hover:text-[var(--theme-primary-400)] transition-colors"
                      aria-label="Next"
                    >
                      <Icon icon="mdi:skip-next" className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* 封面 */}
                <div
                  className={`mt-5 aspect-square overflow-hidden rounded-2xl border border-black/10 shadow-md ring-1 ring-black/5 dark:border-white/10 dark:ring-white/5 ${isPlaying ? 'music-cover-breathe' : ''}`}
                  style={
                    selectedTrack?.cover_image_url
                      ? {
                        backgroundImage: `url(${selectedTrack.cover_image_url})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }
                      : {
                        background: 'linear-gradient(135deg, var(--theme-primary-400), var(--theme-secondary-500))',
                      }
                  }
                />

                {/* 元信息标签 */}
                {selectedTrack ? (
                  <div className="mt-4 flex flex-wrap items-center gap-1.5">
                    {selectedTrack.album ? (
                      <span className="text-[11px] px-2.5 py-1 rounded-lg bg-gray-100/80 dark:bg-white/10 text-gray-600 dark:text-gray-300 border border-gray-200/60 dark:border-white/10">
                        {selectedTrack.album}
                      </span>
                    ) : null}
                    {selectedTrack.duration != null ? (
                      <span className="text-[11px] px-2.5 py-1 rounded-lg bg-gray-100/80 dark:bg-white/10 text-gray-600 dark:text-gray-300 border border-gray-200/60 dark:border-white/10">
                        {formatDuration(selectedTrack.duration)}
                      </span>
                    ) : null}
                    {selectedTrack.year != null ? (
                      <span className="text-[11px] px-2.5 py-1 rounded-lg bg-gray-100/80 dark:bg-white/10 text-gray-600 dark:text-gray-300 border border-gray-200/60 dark:border-white/10">
                        {selectedTrack.year}
                      </span>
                    ) : null}
                    <span className="text-[11px] px-2.5 py-1 rounded-lg bg-gray-100/80 dark:bg-white/10 text-gray-600 dark:text-gray-300 border border-gray-200/60 dark:border-white/10">
                      {(MUSIC_CATEGORY_LABEL[selectedTrack.category] || selectedTrack.category) +
                        ' · ' +
                        (MUSIC_STATUS_LABEL[selectedTrack.status] || selectedTrack.status)}
                    </span>
                    {tags.slice(0, 4).map((tg) => (
                      <span
                        key={tg}
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-[var(--theme-primary-100)] dark:bg-[var(--theme-primary-900)/30 text-[var(--theme-primary-700)] dark:text-[var(--theme-primary-300)] border border-[var(--theme-primary-200)]/50 dark:border-[var(--theme-primary-700)]/30"
                      >
                        {tg}
                      </span>
                    ))}
                  </div>
                ) : null}

                {/* 播放器 / 提示 */}
                <div className="mt-4">
                  {selectedTrack && !hasValidNeteaseId ? (
                    <div className="rounded-xl px-4 py-3 text-sm text-gray-600 dark:text-gray-400 bg-amber-50/80 dark:bg-amber-900/20 border border-amber-200/60 dark:border-amber-700/30 flex items-start gap-2">
                      <Icon icon="mdi:information-outline" className="w-5 h-5 flex-shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                      <span>
                        {locale === 'zh'
                          ? '该歌曲暂不支持在线播放。需在后台为歌曲填写网易云歌曲 ID（netease_id）后才可嵌入播放。'
                          : 'This track cannot be played here. Add a NetEase song ID (netease_id) in the backend to enable embedded playback.'}
                      </span>
                    </div>
                  ) : neteasePlayerUrl ? (
                    <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-gray-900/70 shadow-sm px-4 py-4 flex items-center gap-3">
                      <span className="inline-block w-3 h-3 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-100">正在底部播放器中播放</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">切换页面音乐不会中断</p>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl px-4 py-3 text-sm text-gray-500 dark:text-gray-400 bg-gray-100/80 dark:bg-white/5 border border-gray-200/60 dark:border-white/10 flex items-center gap-2">
                      <Icon icon="mdi:loading" className="w-5 h-5 animate-spin flex-shrink-0" />
                      <span>{loading ? (locale === 'zh' ? '加载中…' : 'Loading…') : '--'}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

