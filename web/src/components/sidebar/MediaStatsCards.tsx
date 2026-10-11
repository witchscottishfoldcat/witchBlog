import { Icon } from '@iconify/react'
import { SidebarCard } from '@/components/Sidebar'
import {
  formatPlayTime,
  GAME_CATEGORY_LABEL,
  GAME_PLATFORM_LABEL,
  GAME_STATUS_LABEL,
  MUSIC_CATEGORY_LABEL,
  type GamesOverviewResponse,
  type MusicHomeResponse,
} from '@/lib/api'

type LocaleLabels = {
  musicOverview: string
  playlists: string
  tracks: string
  plays: string
  favorites: string
  categories: string
  featuredPlaylists: string
  recentTracks: string
  gameOverview: string
  games: string
  playTime: string
  rating: string
  statuses: string
  platforms: string
  gameCategories: string
  highlights: string
  noData: string
}

const labels: Record<string, LocaleLabels> = {
  zh: {
    musicOverview: '音乐概览', playlists: '歌单', tracks: '歌曲', plays: '播放', favorites: '收藏', categories: '音乐分类',
    featuredPlaylists: '歌单速览', recentTracks: '最近歌曲', gameOverview: '游戏概览', games: '游戏', playTime: '游玩时长',
    rating: '平均评分', statuses: '游戏状态', platforms: '游戏平台', gameCategories: '游戏分类', highlights: '正在玩与收藏', noData: '暂无数据',
  },
  en: {
    musicOverview: 'Music overview', playlists: 'Playlists', tracks: 'Tracks', plays: 'Plays', favorites: 'Favorites', categories: 'Categories',
    featuredPlaylists: 'Playlist picks', recentTracks: 'Recent tracks', gameOverview: 'Games overview', games: 'Games', playTime: 'Play time',
    rating: 'Avg. rating', statuses: 'Game status', platforms: 'Platforms', gameCategories: 'Categories', highlights: 'Playing & favorites', noData: 'No data yet',
  },
  ja: {
    musicOverview: '音楽概要', playlists: 'プレイリスト', tracks: '曲', plays: '再生', favorites: 'お気に入り', categories: '音楽カテゴリ',
    featuredPlaylists: 'プレイリスト', recentTracks: '最近の曲', gameOverview: 'ゲーム概要', games: 'ゲーム', playTime: 'プレイ時間',
    rating: '平均評価', statuses: 'ゲーム状態', platforms: 'プラットフォーム', gameCategories: 'カテゴリ', highlights: 'プレイ中・お気に入り', noData: 'データがありません',
  },
  ko: {
    musicOverview: '음악 개요', playlists: '플레이리스트', tracks: '곡', plays: '재생', favorites: '즐겨찾기', categories: '음악 분류',
    featuredPlaylists: '플레이리스트', recentTracks: '최근 곡', gameOverview: '게임 개요', games: '게임', playTime: '플레이 시간',
    rating: '평균 평점', statuses: '게임 상태', platforms: '플랫폼', gameCategories: '카테고리', highlights: '플레이 중 · 즐겨찾기', noData: '데이터가 없습니다',
  },
}

function getLabels(locale: string) {
  return labels[locale] ?? labels.en
}

function Metric({ icon, value, label }: { icon: string; value: string | number; label: string }) {
  return (
    <div className="flex min-h-[104px] min-w-0 flex-col items-center justify-center rounded-xl bg-[var(--theme-primary-50)] px-2 py-3 text-center">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/60 text-[var(--theme-primary-600)] dark:bg-white/5">
        <Icon icon={icon} className="h-[18px] w-[18px]" aria-hidden />
      </span>
      <p className="mt-1.5 truncate text-lg font-bold leading-none tabular-nums text-gray-800 dark:text-gray-100" title={String(value)}>{value}</p>
      <p className="mt-1.5 truncate text-[10px] leading-none text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  )
}

function Empty({ label }: { label: string }) {
  return <p className="py-2 text-xs text-gray-500 dark:text-gray-400">{label}</p>
}

function DistributionList({ items }: { items: Array<{ label: string; count: number }> }) {
  const maximum = Math.max(...items.map((item) => item.count), 1)
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label}>
          <div className="mb-1 flex items-center justify-between gap-2 text-xs">
            <span className="truncate text-gray-600 dark:text-gray-300">{item.label}</span>
            <span className="font-semibold tabular-nums text-gray-800 dark:text-gray-100">{item.count}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[var(--theme-primary-50)]">
            <div className="h-full rounded-full bg-[var(--theme-primary-500)]" style={{ width: `${Math.max(6, item.count / maximum * 100)}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

export function MusicSummaryCard({ home, locale }: { home: MusicHomeResponse | null; locale: string }) {
  const t = getLabels(locale)
  const stats = home?.stats
  return (
    <SidebarCard title={t.musicOverview}>
      <div className="grid grid-cols-2 gap-2">
        <Metric icon="mdi:playlist-music-outline" value={stats?.total_playlists ?? 0} label={t.playlists} />
        <Metric icon="mdi:music-note" value={stats?.total_tracks ?? 0} label={t.tracks} />
        <Metric icon="mdi:play-circle-outline" value={stats?.total_play_count ?? 0} label={t.plays} />
        <Metric icon="mdi:star-outline" value={stats?.favorite_count ?? 0} label={t.favorites} />
      </div>
    </SidebarCard>
  )
}

export function MusicCategoryCard({ home, locale }: { home: MusicHomeResponse | null; locale: string }) {
  const t = getLabels(locale)
  const items = (home?.stats.category_stats ?? []).slice(0, 6).map((item) => ({
    label: MUSIC_CATEGORY_LABEL[item.category] || item.category,
    count: item.count,
  }))
  return <SidebarCard title={t.categories}>{items.length ? <DistributionList items={items} /> : <Empty label={t.noData} />}</SidebarCard>
}

export function MusicPlaylistCard({ home, locale }: { home: MusicHomeResponse | null; locale: string }) {
  const t = getLabels(locale)
  const playlists = (home?.playlists ?? []).slice(0, 4)
  return (
    <SidebarCard title={t.featuredPlaylists}>
      {playlists.length ? (
        <div className="space-y-2">
          {playlists.map((playlist) => (
            <div key={playlist.id} className="flex items-center gap-3 rounded-xl border p-2.5" style={{ borderColor: 'var(--theme-card-border)' }}>
              <span
                className="h-9 w-9 shrink-0 rounded-lg bg-[var(--theme-primary-100)] bg-cover bg-center"
                style={playlist.cover_image_url ? { backgroundImage: `url(${playlist.cover_image_url})` } : undefined}
                aria-hidden
              />
              <span className="min-w-0 flex-1">
                <strong className="block truncate text-xs text-gray-800 dark:text-gray-200">{playlist.title}</strong>
                <span className="mt-0.5 block text-[10px] text-gray-500 dark:text-gray-400">{playlist.track_count} {t.tracks}</span>
              </span>
            </div>
          ))}
        </div>
      ) : <Empty label={t.noData} />}
    </SidebarCard>
  )
}

export function MusicRecentCard({ home, locale }: { home: MusicHomeResponse | null; locale: string }) {
  const t = getLabels(locale)
  const tracks = (home?.recent_tracks ?? []).slice(0, 5)
  return (
    <SidebarCard title={t.recentTracks}>
      {tracks.length ? (
        <ol className="space-y-3">
          {tracks.map((track, index) => (
            <li key={track.id} className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--theme-primary-50)] text-[10px] font-bold tabular-nums text-[var(--theme-primary-600)]">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="min-w-0">
                <strong className="block truncate text-xs text-gray-800 dark:text-gray-200">{track.title}</strong>
                <span className="mt-0.5 block truncate text-[10px] text-gray-500 dark:text-gray-400">{track.artist}</span>
              </span>
            </li>
          ))}
        </ol>
      ) : <Empty label={t.noData} />}
    </SidebarCard>
  )
}

export function GamesSummaryCard({ overview, locale }: { overview: GamesOverviewResponse | null; locale: string }) {
  const t = getLabels(locale)
  const stats = overview?.stats
  const rating = stats?.average_rating == null ? '—' : stats.average_rating.toFixed(1)
  return (
    <SidebarCard title={t.gameOverview}>
      <div className="grid grid-cols-2 gap-2">
        <Metric icon="mdi:gamepad-variant-outline" value={stats?.total_games ?? 0} label={t.games} />
        <Metric icon="mdi:clock-outline" value={formatPlayTime(stats?.total_play_time ?? 0)} label={t.playTime} />
        <Metric icon="mdi:heart-outline" value={stats?.favorite_count ?? 0} label={t.favorites} />
        <Metric icon="mdi:star-outline" value={rating} label={t.rating} />
      </div>
    </SidebarCard>
  )
}

export function GamesStatusCard({ overview, locale }: { overview: GamesOverviewResponse | null; locale: string }) {
  const t = getLabels(locale)
  const items = (overview?.stats.status_stats ?? []).slice(0, 6).map((item) => ({ label: GAME_STATUS_LABEL[item.status] || item.status, count: item.count }))
  return <SidebarCard title={t.statuses}>{items.length ? <DistributionList items={items} /> : <Empty label={t.noData} />}</SidebarCard>
}

export function GamesCategoryCard({ overview, locale }: { overview: GamesOverviewResponse | null; locale: string }) {
  const t = getLabels(locale)
  const items = (overview?.stats.category_stats ?? []).slice(0, 6).map((item) => ({ label: GAME_CATEGORY_LABEL[item.category] || item.category, count: item.count }))
  return <SidebarCard title={t.gameCategories}>{items.length ? <DistributionList items={items} /> : <Empty label={t.noData} />}</SidebarCard>
}

export function GamesPlatformCard({ overview, locale }: { overview: GamesOverviewResponse | null; locale: string }) {
  const t = getLabels(locale)
  const items = (overview?.stats.platform_stats ?? []).slice(0, 6).map((item) => ({ label: GAME_PLATFORM_LABEL[item.platform] || item.platform, count: item.count }))
  return <SidebarCard title={t.platforms}>{items.length ? <DistributionList items={items} /> : <Empty label={t.noData} />}</SidebarCard>
}

export function GamesHighlightsCard({ overview, locale }: { overview: GamesOverviewResponse | null; locale: string }) {
  const t = getLabels(locale)
  const games = [...(overview?.playing_games ?? []), ...(overview?.favorite_games ?? [])]
    .filter((game, index, all) => all.findIndex((item) => item.id === game.id) === index)
    .slice(0, 4)
  return (
    <SidebarCard title={t.highlights}>
      {games.length ? (
        <div className="space-y-2">
          {games.map((game) => (
            <div key={game.id} className="flex items-center gap-3 rounded-xl border p-2.5" style={{ borderColor: 'var(--theme-card-border)' }}>
              <span
                className="h-9 w-12 shrink-0 rounded-lg bg-[var(--theme-primary-100)] bg-cover bg-center"
                style={game.cover_image_url ? { backgroundImage: `url(${game.cover_image_url})` } : undefined}
                aria-hidden
              />
              <span className="min-w-0 flex-1">
                <strong className="block truncate text-xs text-gray-800 dark:text-gray-200">{game.title}</strong>
                <span className="mt-0.5 block truncate text-[10px] text-gray-500 dark:text-gray-400">{GAME_STATUS_LABEL[game.status] || game.status}</span>
              </span>
            </div>
          ))}
        </div>
      ) : <Empty label={t.noData} />}
    </SidebarCard>
  )
}
