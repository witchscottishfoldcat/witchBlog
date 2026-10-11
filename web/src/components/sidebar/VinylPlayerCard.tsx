'use client'

import { Icon } from '@iconify/react'
import { SidebarCard } from '@/components/Sidebar'
import { useMusicContext } from '@/contexts/MusicContext'

const copy: Record<string, { title: string; waiting: string; artist: string; previous: string; next: string; playing: string }> = {
  zh: { title: '黑胶唱片机', waiting: '等待唱片入场', artist: '从音乐馆选择一首歌', previous: '上一首', next: '下一首', playing: '正在播放' },
  en: { title: 'Vinyl player', waiting: 'Waiting for a record', artist: 'Choose a track from the music hall', previous: 'Previous', next: 'Next', playing: 'Now playing' },
  ja: { title: 'レコードプレーヤー', waiting: 'レコードを待っています', artist: '音楽館から曲を選んでください', previous: '前の曲', next: '次の曲', playing: '再生中' },
  ko: { title: '레코드 플레이어', waiting: '레코드를 기다리는 중', artist: '음악관에서 곡을 선택하세요', previous: '이전 곡', next: '다음 곡', playing: '재생 중' },
}

export default function VinylPlayerCard({ locale }: { locale: string }) {
  const t = copy[locale] ?? copy.en
  const music = useMusicContext()
  const nowPlaying = music?.nowPlaying
  const track = nowPlaying?.track

  const playPrevious = () => {
    if (!nowPlaying || !music?.setNowPlaying || nowPlaying.list.length === 0) return
    const previousIndex = (nowPlaying.index - 1 + nowPlaying.list.length) % nowPlaying.list.length
    music.setNowPlaying(nowPlaying.list[previousIndex], nowPlaying.list, previousIndex)
  }

  return (
    <SidebarCard title={t.title}>
      <div
        className="relative mx-auto aspect-square w-full max-w-[220px] overflow-hidden rounded-[24px] border p-4 shadow-inner"
        style={{
          background: 'linear-gradient(145deg, color-mix(in srgb, var(--theme-primary-100) 32%, var(--theme-card-bg)), color-mix(in srgb, var(--theme-secondary) 8%, var(--theme-card-bg)))',
          borderColor: 'var(--theme-card-border)',
        }}
      >
        <div className="absolute left-4 top-5 h-[72%] w-[72%] rounded-full bg-black/15 blur-xl dark:bg-black/40" aria-hidden />
        <div
          className={`relative flex h-[78%] w-[78%] items-center justify-center rounded-full shadow-[0_14px_28px_rgba(0,0,0,0.35)] ring-1 ring-white/10 motion-reduce:animate-none ${track ? 'animate-[spin_7s_linear_infinite]' : ''}`}
          style={{
            background: 'repeating-radial-gradient(circle at center, #111827 0 5px, #202735 6px 7px, #0b0f17 8px 11px)',
          }}
          aria-label={track ? `${t.playing}: ${track.title}` : t.waiting}
        >
          <div className="absolute inset-[15%] rounded-full border border-white/10" aria-hidden />
          <div className="absolute inset-[28%] rounded-full border border-white/10" aria-hidden />
          <div
            className="relative h-[38%] w-[38%] rounded-full border-2 border-white/70 bg-[var(--theme-primary-400)] bg-cover bg-center shadow-md"
            style={track?.cover_image_url ? { backgroundImage: `url(${track.cover_image_url})` } : undefined}
          >
            {!track && <Icon icon="mdi:music-note" className="absolute inset-0 m-auto h-5 w-5 text-white" aria-hidden />}
            <span className="absolute inset-[42%] rounded-full bg-gray-900 ring-1 ring-white/40" aria-hidden />
          </div>
        </div>

        <div className="absolute right-5 top-4 h-[68%] w-8" aria-hidden>
          <span className="absolute right-0 top-0 h-6 w-6 rounded-full border-4 border-gray-300 bg-gray-700 shadow-md dark:border-gray-500" />
          <span className="absolute right-2 top-4 h-[74%] w-1.5 origin-top rotate-[18deg] rounded-full bg-gradient-to-b from-gray-200 via-gray-400 to-gray-700 shadow-sm" />
          <span className="absolute bottom-3 left-0 h-5 w-3 rotate-[18deg] rounded-sm bg-gray-800 shadow-md dark:bg-gray-300" />
        </div>

        <span className="absolute bottom-4 right-4 h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.75)]" aria-hidden />
      </div>

      <div className="mt-4 text-center">
        <p className="truncate text-sm font-bold text-gray-900 dark:text-gray-100">{track?.title ?? t.waiting}</p>
        <p className="mt-1 truncate text-[10px] text-gray-500 dark:text-gray-400">{track?.artist ?? t.artist}</p>
      </div>

      <div className="mt-3 flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={playPrevious}
          disabled={!nowPlaying}
          className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--theme-primary-50)] text-[var(--theme-primary-600)] transition hover:bg-[var(--theme-primary-100)] disabled:cursor-not-allowed disabled:opacity-40"
          aria-label={t.previous}
          title={t.previous}
        >
          <Icon icon="mdi:skip-previous" className="h-4 w-4" aria-hidden />
        </button>
        <span className="flex h-9 w-9 items-center justify-center gap-[2px] rounded-full bg-[var(--theme-primary-500)] text-white shadow-sm" aria-label={t.playing}>
          {[0, 1, 2].map((index) => (
            <span
              key={index}
              className={`w-[2px] rounded-full bg-white ${track ? 'animate-[music-eq-bounce_0.9s_ease-in-out_infinite]' : ''}`}
              style={{ height: `${8 + index * 3}px`, animationDelay: `${index * 0.16}s` }}
              aria-hidden
            />
          ))}
        </span>
        <button
          type="button"
          onClick={() => music?.playNext()}
          disabled={!nowPlaying}
          className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--theme-primary-50)] text-[var(--theme-primary-600)] transition hover:bg-[var(--theme-primary-100)] disabled:cursor-not-allowed disabled:opacity-40"
          aria-label={t.next}
          title={t.next}
        >
          <Icon icon="mdi:skip-next" className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </SidebarCard>
  )
}
