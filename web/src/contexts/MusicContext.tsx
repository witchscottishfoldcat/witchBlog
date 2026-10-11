'use client'

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import type { MusicTrack } from '@/lib/api'
import { getRandomTracks } from '@/lib/api'

const RECENT_STORAGE_KEY = 'musicHall:recentPlayed'
const MAX_RECENT = 5

export interface NowPlaying {
  track: MusicTrack
  list: MusicTrack[]
  index: number
}

interface MusicContextType {
  nowPlaying: NowPlaying | null
  /** 全局播放器是否可见 */
  isGlobalPlayerVisible: boolean
  /** 最近播放的歌曲（最多 5 首） */
  recentTracks: MusicTrack[]
  setNowPlaying: (track: MusicTrack, list: MusicTrack[], index: number) => void
  clearNowPlaying: () => void
  /** 播放列表中的下一首（到末尾时自动获取新随机列表） */
  playNext: () => void
}

const MusicContext = createContext<MusicContextType | undefined>(undefined)

/** 从 localStorage 读取最近播放 */
function loadRecentTracks(): MusicTrack[] {
  try {
    const raw = localStorage.getItem(RECENT_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENT) : []
  } catch {
    return []
  }
}

/** 保存最近播放到 localStorage */
function saveRecentTracks(tracks: MusicTrack[]) {
  try {
    localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(tracks.slice(0, MAX_RECENT)))
  } catch {
    // ignore
  }
}

/** 将一首歌添加到最近播放列表头部，去重，最多保留 MAX_RECENT 首 */
function addToRecent(track: MusicTrack, prev: MusicTrack[]): MusicTrack[] {
  const filtered = prev.filter(t => t.id !== track.id)
  return [track, ...filtered].slice(0, MAX_RECENT)
}

export function MusicProvider({ children }: { children: ReactNode }) {
  const [nowPlaying, setNowPlayingState] = useState<NowPlaying | null>(null)
  const [recentTracks, setRecentTracks] = useState<MusicTrack[]>([])

  // 初始化时从 localStorage 恢复最近播放
  useEffect(() => {
    setRecentTracks(loadRecentTracks())
  }, [])

  const setNowPlaying = useCallback((track: MusicTrack, list: MusicTrack[], index: number) => {
    setNowPlayingState({ track, list, index })
    setRecentTracks(prev => {
      const updated = addToRecent(track, prev)
      saveRecentTracks(updated)
      return updated
    })
  }, [])

  const clearNowPlaying = useCallback(() => {
    setNowPlayingState(null)
  }, [])

  const playNext = useCallback(() => {
    setNowPlayingState((prev) => {
      if (!prev) return null
      const { list, index } = prev
      const nextIndex = index + 1
      if (nextIndex < list.length) {
        const nextTrack = list[nextIndex]
        // 记录到最近播放
        setRecentTracks(rt => {
          const updated = addToRecent(nextTrack, rt)
          saveRecentTracks(updated)
          return updated
        })
        return { track: nextTrack, list, index: nextIndex }
      }
      // 到末尾了，异步获取新的随机列表
      getRandomTracks(10).then((tracks) => {
        if (tracks.length > 0) {
          setRecentTracks(rt => {
            const updated = addToRecent(tracks[0], rt)
            saveRecentTracks(updated)
            return updated
          })
          setNowPlayingState({ track: tracks[0], list: tracks, index: 0 })
        }
      }).catch(() => {/* 静默忽略 */ })
      return prev // 暂时保持当前，等新列表到来后更新
    })
  }, [])

  const isGlobalPlayerVisible = nowPlaying !== null

  const value: MusicContextType = {
    nowPlaying,
    isGlobalPlayerVisible,
    recentTracks,
    setNowPlaying,
    clearNowPlaying,
    playNext,
  }

  return (
    <MusicContext.Provider value={value}>
      {children}
    </MusicContext.Provider>
  )
}

export function useMusicContext() {
  const ctx = useContext(MusicContext)
  return ctx
}
