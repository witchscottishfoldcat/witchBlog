'use client'

import { useEffect, useMemo, useState } from 'react'
import { Icon } from '@iconify/react'
import {
  type GameShowcase,
  type GamesOverviewResponse,
  type GamesListResponse,
  getGamesOverview,
  getGamesList,
  formatPlayTime,
  GAME_STATUS_LABEL,
  GAME_PLATFORM_LABEL,
  GAME_CATEGORY_LABEL,
} from '@/lib/api'
import PageIntroCard, { PageIntroBadge } from '@/components/PageIntroCard'

type GameShowcaseProps = {
  locale: string
  compactLayout?: boolean
  /** 服务端渲染时预取的游戏概览数据，用于跳过客户端首次挂载的重复请求 */
  initialOverview?: GamesOverviewResponse | null
}

function GameCard({
  game,
}: {
  game: GameShowcase
}) {
  const statusLabel = GAME_STATUS_LABEL[game.status] || game.status
  const platformLabel = GAME_PLATFORM_LABEL[game.platform] || game.platform
  const categoryLabel = GAME_CATEGORY_LABEL[game.category] || game.category
  const tags = useMemo(
    () => (game.tags ? game.tags.split(',').map((t) => t.trim()).filter(Boolean) : []),
    [game.tags]
  )

  return (
    <a
      href={game.steam_url || '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="group rounded-2xl overflow-hidden border border-black/5 dark:border-white/10 bg-white/70 dark:bg-gray-900/60 hover:shadow-lg transition-all duration-200 block"
    >
      <div
        className="aspect-video bg-gray-200/50 dark:bg-gray-800/50"
        style={
          game.cover_image_url
            ? {
                backgroundImage: `url(${game.cover_image_url})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }
            : undefined
        }
      />
      <div className="p-3">
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate group-hover:text-[var(--theme-primary-600)] dark:group-hover:text-[var(--theme-primary-400)]">
          {game.title}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-gray-600 dark:text-gray-400">
          <span>{platformLabel}</span>
          <span aria-hidden>·</span>
          <span>{categoryLabel}</span>
          <span aria-hidden>·</span>
          <span>{statusLabel}</span>
          {game.play_time > 0 && (
            <>
              <span aria-hidden>·</span>
              <span>{formatPlayTime(game.play_time)}</span>
            </>
          )}
        </div>
        {tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-gray-600 dark:text-gray-400"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </a>
  )
}

function SectionTitle({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon icon={icon} className="w-5 h-5" style={{ color: 'var(--theme-primary-500)' }} />
      <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-gray-100">{title}</h2>
    </div>
  )
}

export default function GameShowcase({ locale, compactLayout = false, initialOverview = null }: GameShowcaseProps) {
  // 服务端注入的初始数据直接作为初值，首次挂载不再重复请求
  const [overview, setOverview] = useState<GamesOverviewResponse | null>(initialOverview)
  const [listData, setListData] = useState<GamesListResponse | null>(null)
  const [loading, setLoading] = useState(!initialOverview)
  const [loadFailed, setLoadFailed] = useState(false)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>('')

  const titleText =
    locale === 'zh' ? '游戏' : locale === 'ja' ? 'ゲーム' : locale === 'ko' ? '게임' : 'Games'
  const subTitleText =
    locale === 'zh'
      ? 'Steam 游戏库与游玩记录'
      : locale === 'ja'
        ? 'Steam ライブラリとプレイ記録'
        : locale === 'ko'
          ? 'Steam 라이브러리 및 플레이 기록'
          : 'Steam library & play records'

  useEffect(() => {
    // 服务端已注入概览数据时，首次挂载不再重复请求 getGamesOverview
    if (initialOverview) return
    let cancelled = false
    setLoading(true)
    setLoadFailed(false)
    getGamesOverview()
      .then((ov) => {
        if (!cancelled) {
          setOverview(ov ?? null)
          if (!ov) setLoadFailed(true)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [initialOverview])

  useEffect(() => {
    getGamesList({
      page,
      size: 20,
      ...(statusFilter ? { status: statusFilter } : {}),
      sort_by: 'sort_order',
    }).then(setListData)
  }, [page, statusFilter])

  const stats = overview?.stats
  const recentGames = overview?.recent_games ?? []
  const playingGames = overview?.playing_games ?? []
  const favoriteGames = overview?.favorite_games ?? []
  const items = listData?.items ?? []
  const totalPages = listData?.pages ?? 0
  const gameGridClass = compactLayout
    ? 'grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-2 2xl:grid-cols-3'
    : 'grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'

  if (loading && !overview) {
    return (
      <div className="space-y-4 sm:space-y-8">
        <div className="h-40 rounded-3xl bg-white/60 dark:bg-gray-900/50 animate-pulse" />
        <div className={gameGridClass}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-48 rounded-2xl bg-white/60 dark:bg-gray-900/50 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (loadFailed) {
    return (
      <div className="rounded-2xl p-6 bg-white/60 dark:bg-gray-900/50 text-center text-gray-600 dark:text-gray-400">
        <Icon icon="mdi:alert-circle" className="w-12 h-12 mx-auto mb-3 opacity-60" />
        <p>
          {locale === 'zh'
            ? '加载失败，请检查后端 /api/v1/games 是否可用'
            : 'Load failed. Check /api/v1/games availability.'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-8">
      <div className="mobile-page-card rounded-2xl border p-4 md:hidden" style={{ backgroundColor: 'var(--theme-card-bg-90)', borderColor: 'var(--theme-card-border)' }}>
        <h1 className="mobile-app-title text-base font-bold text-gray-900 dark:text-gray-100">{titleText}</h1>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{subTitleText}</p>
      </div>

      <PageIntroCard
        title={titleText}
        subtitle={subTitleText}
        meta={stats ? (
          <>
            <PageIntroBadge icon="mdi:gamepad-variant-outline">
              {stats.total_games} {locale === 'zh' ? '款游戏' : 'games'}
            </PageIntroBadge>
            <PageIntroBadge icon="mdi:clock-outline">
              {locale === 'zh' ? '总时长 ' : ''}{formatPlayTime(stats.total_play_time)}{locale === 'zh' ? '' : ' total'}
            </PageIntroBadge>
            {stats.favorite_count > 0 ? (
              <PageIntroBadge icon="mdi:heart">{stats.favorite_count}</PageIntroBadge>
            ) : null}
          </>
        ) : undefined}
      />

      {/* 正在玩 / 最近添加 / 收藏 */}
      {(playingGames.length > 0 || recentGames.length > 0 || favoriteGames.length > 0) && (
        <div className="space-y-6">
          {playingGames.length > 0 && (
            <section className="space-y-4">
              <SectionTitle
                icon="mdi:play-circle"
                title={locale === 'zh' ? '正在玩' : locale === 'ja' ? 'プレイ中' : locale === 'ko' ? '플레이 중' : 'Playing'}
              />
              <div className={gameGridClass}>
                {playingGames.slice(0, 10).map((g) => (
                  <GameCard key={g.id} game={g} />
                ))}
              </div>
            </section>
          )}
          {favoriteGames.length > 0 && (
            <section className="space-y-4">
              <SectionTitle
                icon="mdi:heart"
                title={locale === 'zh' ? '收藏' : locale === 'ja' ? 'お気に入り' : locale === 'ko' ? '즐겨찾기' : 'Favorites'}
              />
              <div className={gameGridClass}>
                {favoriteGames.slice(0, 10).map((g) => (
                  <GameCard key={g.id} game={g} />
                ))}
              </div>
            </section>
          )}
          {recentGames.length > 0 && (
            <section className="space-y-4">
              <SectionTitle
                icon="mdi:clock-outline"
                title={locale === 'zh' ? '最近添加' : locale === 'ja' ? '最近追加' : locale === 'ko' ? '최근 추가' : 'Recent'}
              />
              <div className={gameGridClass}>
                {recentGames.slice(0, 10).map((g) => (
                  <GameCard key={g.id} game={g} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* 全部游戏列表 */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionTitle
            icon="mdi:format-list-bulleted"
            title={locale === 'zh' ? '全部游戏' : locale === 'ja' ? '全ゲーム' : locale === 'ko' ? '전체 게임' : 'All games'}
          />
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(1)
              }}
              className="text-sm rounded-xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-gray-900/60 px-3 py-2 text-gray-700 dark:text-gray-300"
            >
              <option value="">{locale === 'zh' ? '全部状态' : 'All status'}</option>
              {Object.entries(GAME_STATUS_LABEL).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>
        {items.length ? (
          <>
            <div className={gameGridClass}>
              {items.map((g) => (
                <GameCard key={g.id} game={g} />
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-4 py-2 rounded-xl bg-white/80 dark:bg-gray-800/80 border border-black/10 dark:border-white/10 disabled:opacity-50"
                >
                  {locale === 'zh' ? '上一页' : 'Prev'}
                </button>
                <span className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                  {page} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-4 py-2 rounded-xl bg-white/80 dark:bg-gray-800/80 border border-black/10 dark:border-white/10 disabled:opacity-50"
                >
                  {locale === 'zh' ? '下一页' : 'Next'}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-2xl p-6 bg-white/60 dark:bg-gray-900/50 text-center text-gray-500 dark:text-gray-400 text-sm">
            {locale === 'zh' ? '暂无游戏' : 'No games'}
          </div>
        )}
      </section>
    </div>
  )
}
