'use client'

import { useEffect, useState, useRef } from 'react'
import { Icon } from '@iconify/react'
import { useMusicContext } from '@/contexts/MusicContext'
import { getRandomTracks, checkSongPlayable, getNeteaseSongUrl } from '@/lib/api'

function formatTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return '--:--'
  const s = Math.floor(sec)
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${r.toString().padStart(2, '0')}`
}

/**
 * 全局音乐播放器 —— 固定在页面底部的浮动播放条
 * 在 layout 层级渲染，跨页面不销毁，保证音乐持续播放
 *
 * iframe URL 完全由本组件从 nowPlaying 推导，不依赖外部传入，
 * 避免多组件设置不同参数的 URL 导致 iframe 重建。
 */
export default function GlobalMusicPlayer() {
  const ctx = useMusicContext()
  const nowPlaying = ctx?.nowPlaying ?? null
  const setNowPlaying = ctx?.setNowPlaying
  const clearNowPlaying = ctx?.clearNowPlaying
  const playNext = ctx?.playNext
  const [minimized, setMinimized] = useState(true)
  const [initializing, setInitializing] = useState(true)
  const [isDark, setIsDark] = useState(false)
  const [audioSrc, setAudioSrc] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [isUnplayable, setIsUnplayable] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const autoPlayTriedRef = useRef(false)
  const lastCheckedIdRef = useRef<string | null>(null)
  const skipCountRef = useRef(0)

  // 展开播放条时抬高页面底部留白，避免遮挡正文与看板娘
  useEffect(() => {
    if (typeof document === 'undefined') return
    const expanded = Boolean(nowPlaying && !minimized)
    if (expanded) {
      document.body.setAttribute('data-music-player-expanded', '')
    } else {
      document.body.removeAttribute('data-music-player-expanded')
    }
    return () => document.body.removeAttribute('data-music-player-expanded')
  }, [nowPlaying, minimized])

  // 页面首次加载时自动获取随机歌曲并播放
  useEffect(() => {
    if (autoPlayTriedRef.current || nowPlaying) return
    autoPlayTriedRef.current = true

    getRandomTracks(10).then((tracks) => {
      if (tracks.length > 0 && setNowPlaying) {
        const idx = Math.floor(Math.random() * tracks.length)
        setNowPlaying(tracks[idx], tracks, idx)
      }
    }).catch(() => {
      // 网络错误时静默忽略，不影响页面
    }).finally(() => {
      setInitializing(false)
    })
  }, [nowPlaying, setNowPlaying])

  // 检测当前歌曲是否可播放（VIP 检测），不可播放时：
  // - 自动播放/随机播放：自动跳过
  // - 用户手动点歌：不自动跳过（避免“点1选2”错觉），仅提示不可播放
  useEffect(() => {
    const neteaseId = nowPlaying?.track?.netease_id
    if (!neteaseId || !playNext) return
    // 避免重复检查同一首歌
    if (lastCheckedIdRef.current === String(neteaseId)) return
    lastCheckedIdRef.current = String(neteaseId)

    // 防止全是 VIP 时死循环，最多连续跳 10 次，然后重新获取一批随机歌曲
    if (skipCountRef.current >= 10) {
      skipCountRef.current = 0
      // 重新获取一批随机歌曲尝试播放
      getRandomTracks(10).then((newTracks) => {
        if (newTracks.length > 0 && setNowPlaying) {
          const idx = Math.floor(Math.random() * newTracks.length)
          setNowPlaying(newTracks[idx], newTracks, idx)
        }
      })
      return
    }

    checkSongPlayable(String(neteaseId)).then((playable) => {
      if (!playable) {
        let manual = false
        try {
          const lastManual = sessionStorage.getItem('music:lastManualNeteaseId')
          if (lastManual && lastManual === String(neteaseId)) {
            manual = true
            sessionStorage.removeItem('music:lastManualNeteaseId')
          }
        } catch {
          // ignore
        }
        if (manual) {
          setIsUnplayable(true)
          console.log(`[MusicPlayer] 歌曲 ${nowPlaying.track.title} (${neteaseId}) 不可播放（VIP），用户手动选择：不自动跳过`)
          return
        }
        console.log(`[MusicPlayer] 歌曲 ${nowPlaying.track.title} (${neteaseId}) 不可播放（VIP），自动跳过`)
        skipCountRef.current += 1
        playNext()
      } else {
        // 可播放，重置跳歌计数
        skipCountRef.current = 0
      }
    })
  }, [nowPlaying, playNext, setNowPlaying])

  // 检测深色模式
  useEffect(() => {
    if (typeof window === 'undefined') return
    const check = () => setIsDark(document.documentElement.classList.contains('dark'))
    check()
    const obs = new MutationObserver(check)
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])

  const track = nowPlaying?.track ?? null
  const trackTitle = track?.title ?? ''
  const trackArtist = track?.artist ?? ''
  const trackCover = track?.cover_image_url ?? null
  // 后端/网易云提供的歌曲时长（秒），优先作为“真实总时长”
  const trackDurationSec = track?.duration != null && Number.isFinite(track.duration) ? Number(track.duration) : null
  const neteaseId =
    track?.netease_id != null && /^\d+$/.test(String(track.netease_id)) ? String(track.netease_id) : null

  // 获取直链给 <audio>（必须在所有 return 之前调用，避免 hook 数量变化）
  useEffect(() => {
    let cancelled = false
    setAudioSrc(null)
    setIsPlaying(false)
    setCurrentTime(0)
    setDuration(0)
    setIsUnplayable(false)
    if (!neteaseId) return
    getNeteaseSongUrl(neteaseId).then((url) => {
      if (cancelled) return
      setAudioSrc(url)
      if (!url) setIsUnplayable(true)
    })
    return () => {
      cancelled = true
    }
  }, [neteaseId])

  // 没有播放内容且不在加载时时不渲染
  if (!nowPlaying) {
    if (initializing) {
      // 加载状态显示（仅在最小化模式下显示 Loading 条，或者也可以渲染一个骨架屏，这里复用最小化按钮样式）
      return (
        <div
          className="fixed left-1/2 z-[9991] flex -translate-x-1/2 items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] shadow-lg max-md:bottom-[calc(var(--mobile-tab-bar-total,3.5rem)+0.35rem)] max-md:max-w-[calc(100vw-1.5rem)] bottom-[max(0.5rem,env(safe-area-inset-bottom,0.5rem))] sm:gap-1.5 sm:rounded-xl sm:px-4 sm:py-1.5 sm:text-xs"
          style={{
            backgroundColor: isDark ? 'rgba(15, 23, 42, 0.97)' : 'rgba(255, 255, 255, 0.97)',
            color: isDark ? '#e2e8f0' : '#334155',
            backdropFilter: 'blur(12px)',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
          }}
        >
          <Icon icon="mdi:loading" className="h-3 w-3 shrink-0 animate-spin text-[var(--theme-primary-500)] sm:h-3.5 sm:w-3.5" />
          <span className="max-w-[28vw] truncate sm:max-w-[120px]">正在初始化...</span>
        </div>
      )
    }
    return null
  }

  if (!neteaseId) return null
  const totalDurationSec = trackDurationSec ?? duration

  return (
    <>
      {/* 最小化时的浮动拉柄 —— 独立于播放条容器，不受 transform 影响 */}
      {minimized && (
        <button
          onClick={() => setMinimized(false)}
          className="global-music-mini-handle fixed left-1/2 z-[9991] flex max-w-[calc(100vw-1.5rem)] -translate-x-1/2 items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] shadow-lg max-md:bottom-[calc(var(--mobile-tab-bar-total,3.5rem)+0.35rem)] bottom-[max(0.5rem,env(safe-area-inset-bottom,0.5rem))] sm:gap-1.5 sm:rounded-xl sm:px-4 sm:py-1.5 sm:text-xs"
          style={{
            backgroundColor: isDark ? 'rgba(15, 23, 42, 0.97)' : 'rgba(255, 255, 255, 0.97)',
            color: isDark ? '#e2e8f0' : '#334155',
            backdropFilter: 'blur(12px)',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
          }}
        >
          <Icon icon="mdi:music" className="h-3 w-3 shrink-0 text-green-500 sm:h-3.5 sm:w-3.5" />
          <span className="max-w-[32vw] truncate sm:max-w-[200px]">{trackTitle}</span>
          <Icon icon="mdi:chevron-up" className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5" />
        </button>
      )}

      {/* 播放条主体 —— 最小化时完全滑出屏幕 */}
      <div
        className="global-music-player fixed bottom-0 max-md:bottom-[var(--mobile-tab-bar-total,3.5rem)] left-0 right-0 z-[9990] border-t pb-safe max-md:!pb-0"
        style={{
          transform: minimized
            ? 'translateY(calc(100% + var(--mobile-tab-bar-total, 0px)))'
            : 'translateY(0)',
          transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
          backgroundColor: isDark ? 'rgba(15, 23, 42, 0.97)' : 'rgba(255, 255, 255, 0.97)',
          borderColor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.12)',
          boxShadow: isDark
            ? '0 -4px 24px rgba(0,0,0,0.5), 0 -1px 0 rgba(255,255,255,0.06)'
            : '0 -4px 24px rgba(0,0,0,0.1), 0 -1px 0 rgba(0,0,0,0.06)',
          backdropFilter: 'blur(16px)',
        }}
      >
        <div
          className="flex justify-center py-1 max-md:py-0.5 sm:py-1.5"
          style={{
            paddingLeft: 'max(0.75rem, env(safe-area-inset-left))',
            paddingRight: 'max(0.75rem, env(safe-area-inset-right))',
          }}
        >
          <div className="flex w-full min-w-0 max-w-screen-xl items-center gap-1.5 rounded-xl border border-white/30 bg-white/50 px-1.5 py-1 shadow-md backdrop-blur-xl dark:border-white/10 dark:bg-gray-900/40 max-md:gap-1.5 sm:gap-2.5 sm:rounded-2xl sm:px-2 sm:py-1.5">
            <div
              className="h-7 w-7 flex-shrink-0 overflow-hidden rounded-lg border sm:h-9 sm:w-9 sm:rounded-xl"
              style={{
                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                ...(trackCover
                  ? { backgroundImage: `url(${trackCover})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                  : { background: 'linear-gradient(135deg, var(--theme-primary-400), var(--theme-secondary))' }),
              }}
            >
              {!trackCover && <div className="flex h-full w-full items-center justify-center text-xs text-white sm:text-sm">🎵</div>}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-[10px] font-semibold leading-tight text-gray-800 dark:text-gray-100 sm:text-xs">
                {trackTitle}
              </p>
              <p className="mt-0.5 truncate text-[9px] leading-tight text-gray-500 dark:text-gray-400 sm:text-[10px]">
                {trackArtist}
              </p>
              {isUnplayable && (
                <p className="mt-0.5 truncate text-[9px] text-red-600 dark:text-red-400 sm:text-[10px]">
                  该歌曲可能为 VIP/不可播放
                </p>
              )}
              <div className="mt-0.5 max-md:mt-0 sm:mt-1">
                <input
                  type="range"
                  min={0}
                  max={totalDurationSec || 0}
                  step={0.1}
                  value={Math.min(currentTime, totalDurationSec || 0)}
                  onChange={(e) => {
                    const t = Number(e.target.value)
                    setCurrentTime(t)
                    if (audioRef.current) audioRef.current.currentTime = t
                  }}
                  className="h-0.5 w-full accent-[var(--theme-primary-500)] max-md:h-[3px]"
                  aria-label="播放进度"
                />
                <div className="mt-0.5 flex items-center justify-between text-[8px] text-gray-500 dark:text-gray-400 sm:text-[9px]">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(totalDurationSec)}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-shrink-0 items-center gap-0.5 sm:gap-1">
              <button
                onClick={() => {
                  const a = audioRef.current
                  if (!a) return
                  if (a.paused) a.play().catch(() => {})
                  else a.pause()
                }}
                className="rounded-md p-0.5 text-gray-600 transition-colors hover:bg-black/5 dark:text-gray-300 dark:hover:bg-white/10 sm:rounded-lg sm:p-1"
                aria-label={isPlaying ? '暂停' : '播放'}
                title={isPlaying ? '暂停' : '播放'}
                disabled={!audioSrc}
              >
                <Icon icon={isPlaying ? 'mdi:pause' : 'mdi:play'} className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
              <button
                onClick={() => playNext?.()}
                className="rounded-md p-0.5 text-gray-600 transition-colors hover:bg-black/5 dark:text-gray-300 dark:hover:bg-white/10 sm:rounded-lg sm:p-1"
                aria-label="下一首"
                title="下一首"
              >
                <Icon icon="mdi:skip-next" className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
              <button
                onClick={() => setMinimized(true)}
                className="rounded-md p-0.5 text-gray-600 transition-colors hover:bg-black/5 dark:text-gray-300 dark:hover:bg-white/10 sm:rounded-lg sm:p-1"
                aria-label="最小化播放器"
                title="最小化"
              >
                <Icon icon="mdi:chevron-down" className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
              <button
                onClick={() => clearNowPlaying?.()}
                className="rounded-md p-0.5 text-gray-600 transition-colors hover:bg-red-100 hover:text-red-600 dark:text-gray-300 dark:hover:bg-red-900/30 dark:hover:text-red-400 sm:rounded-lg sm:p-1"
                aria-label="关闭播放器"
                title="关闭"
              >
                <Icon icon="mdi:close" className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
            </div>
          </div>

          {/* 原生 audio：可控播放/暂停/进度 */}
          <audio
            ref={audioRef}
            src={audioSrc ?? undefined}
            autoPlay
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onLoadedMetadata={(e) => {
              // 如果 track.duration 不存在，再用音频元数据兜底
              if (trackDurationSec == null) setDuration((e.currentTarget.duration || 0))
            }}
            onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime || 0)}
            onEnded={() => playNext?.()}
            style={{ display: 'none' }}
          />
        </div>
      </div>
    </>
  )
}
