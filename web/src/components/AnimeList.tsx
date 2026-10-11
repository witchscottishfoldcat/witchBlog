'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { logger } from '@/lib/logger'
import { IMAGE } from '@/constants'
import { Chip } from '@/components/ui/Chip'


type AnimeStatus = 'all' | 'watching' | 'completed' | 'planned' | 'dropped'

export interface AnimeEntry {
  id: string
  title: string
  description: string
  cover: string
  url?: string
  status: Exclude<AnimeStatus, 'all'>
  rating: number
  watchedEpisodes: number
  totalEpisodes: number
  progress?: number
  category?: 'anime' | 'drama' | 'other'
  is_favorite?: boolean
  tags: string[]
}

interface AnimeListProps {
  anime: AnimeEntry[]
  filterLabels: Record<AnimeStatus, string>
  statusLabels: Record<Exclude<AnimeStatus, 'all'>, string>
  progressLabel: string
  categoryLabels?: Record<'anime' | 'drama' | 'other', string>
}

/**
 * 动漫封面图片组件
 * 直接使用接口返回的 cover_image_url
 */
function AnimeCoverImage({ cover, title }: { cover: string | undefined; title: string }) {
  const defaultPlaceholder = IMAGE.DEFAULT_COVER
  const trimmed = cover?.trim() ?? ''
  // 只接受：站内路径（/...）或带协议/协议相对的网络地址；其余脏数据（如测试数据 'string'）回退占位图，
  // 避免 next/image 对非法 src 抛 Failed to construct 'URL' 导致整页崩溃
  const isUsable = trimmed.startsWith('/') || /^https?:\/\//i.test(trimmed) || trimmed.startsWith('//')
  const imageSrc = isUsable ? trimmed : defaultPlaceholder

  // 调试信息
  logger.log(`[AnimeCoverImage] Rendering image for "${title}":`, {
    cover,
    imageSrc,
    hasCover: !!cover
  })

  // Next.js Image 只接受以 / 开头的站内路径；
  // 其余一律走原生 img（外部 http(s)、协议相对 //、无协议域名等），避免 new URL 抛错
  const isLocalPath = imageSrc.startsWith('/')

  // 对于外部 URL 或代理 URL，使用优化的 img 标签
  if (!isLocalPath) {
    return (
      <>
        <img
          src={imageSrc}
          alt={title}
          className="anime-card-cover absolute inset-0 h-full w-full object-cover"
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          crossOrigin="anonymous"
          onLoad={() => {
            logger.log(`[AnimeCoverImage] Image loaded successfully for "${title}":`, imageSrc)
          }}
          onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
            const target = e.target as HTMLImageElement
            logger.error(`[AnimeCoverImage] Image load error for "${title}":`, {
              attemptedUrl: target.src,
              originalCover: cover,
              imageSrc,
              error: e
            })
            
            // 如果当前不是默认占位图片，尝试加载默认占位图片
            if (target.src !== defaultPlaceholder && !target.src.includes(defaultPlaceholder) && !target.src.includes('sakura.png')) {
              logger.warn(`[AnimeCoverImage] Falling back to placeholder for "${title}"`)
              target.src = defaultPlaceholder
              target.onerror = null // 防止无限循环
              return
            }
            
            // 如果默认占位图片也加载失败，显示占位符
            logger.error(`[AnimeCoverImage] Placeholder also failed for "${title}"`)
            target.style.display = 'none'
            const placeholder = target.parentElement?.querySelector('.image-placeholder') as HTMLElement
            if (placeholder) {
              placeholder.style.display = 'flex'
            }
          }}
        />
        {/* 占位符，默认隐藏，图片加载失败时显示 */}
        <div className="image-placeholder absolute inset-0 hidden items-center justify-center text-gray-400 dark:text-gray-500">
          <div className="text-center">
            <svg
              className="mx-auto h-16 w-16"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="mt-2 text-sm">图片加载失败</p>
          </div>
        </div>
      </>
    )
  }
  
  // 对于本地路径，使用 Next.js Image 组件
  return (
    <>
      <Image
        src={imageSrc}
        alt={title}
        fill
        className="object-cover transition-transform hover:scale-105"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        loading="lazy"
        onLoad={() => {
          logger.log(`[AnimeCoverImage] Image loaded successfully for "${title}":`, imageSrc)
        }}
        onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
          const target = e.target as HTMLImageElement
          logger.error(`[AnimeCoverImage] Image load error for "${title}":`, {
            attemptedUrl: target.src,
            originalCover: cover,
            imageSrc,
            error: e
          })
          
          // 如果当前不是默认占位图片，尝试加载默认占位图片
          if (target.src !== defaultPlaceholder && !target.src.includes(defaultPlaceholder) && !target.src.includes('sakura.png')) {
            logger.warn(`[AnimeCoverImage] Falling back to placeholder for "${title}"`)
            target.src = defaultPlaceholder
            target.onerror = null // 防止无限循环
            return
          }
          
          // 如果默认占位图片也加载失败，显示占位符
          logger.error(`[AnimeCoverImage] Placeholder also failed for "${title}"`)
          target.style.display = 'none'
          const placeholder = target.parentElement?.querySelector('.image-placeholder') as HTMLElement
          if (placeholder) {
            placeholder.style.display = 'flex'
          }
        }}
      />
      {/* 占位符，默认隐藏，图片加载失败时显示 */}
      <div className="image-placeholder absolute inset-0 hidden items-center justify-center text-gray-400 dark:text-gray-500">
        <div className="text-center">
          <svg
            className="mx-auto h-16 w-16"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="mt-2 text-sm">图片加载失败</p>
        </div>
      </div>
    </>
  )
}

export default function AnimeList({
  anime,
  filterLabels,
  statusLabels,
  progressLabel,
  categoryLabels,
}: AnimeListProps) {
  const [activeFilter, setActiveFilter] = useState<AnimeStatus>('all')

  const filteredAnime = useMemo(() => {
    if (activeFilter === 'all') return anime
    return anime.filter((item) => item.status === activeFilter)
  }, [anime, activeFilter])

  const filters: AnimeStatus[] = ['all', 'watching', 'completed', 'planned', 'dropped']

  return (
    <div className="space-y-3 max-md:space-y-3 sm:space-y-6">
      <div className="chip-scroll -mx-0.5 flex gap-1 overflow-x-auto px-0.5 pb-0.5 md:hidden">
        {filters.map((filter) => (
          <Chip key={filter} active={activeFilter === filter} onClick={() => setActiveFilter(filter)}>
            {filterLabels[filter]}
          </Chip>
        ))}
      </div>

      <div className="hidden flex-wrap gap-3 md:flex">
        {filters.map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition-all backdrop-blur-md ${
              activeFilter === filter
                ? 'text-white shadow-lg'
                : 'border border-white/30 bg-white/50 text-[var(--theme-primary-600)] hover:bg-white/60 dark:bg-gray-800/50 dark:text-gray-200 dark:border-white/10 dark:hover:bg-gray-700/60'
            }`}
            style={
              activeFilter === filter
                ? {
                    background: `linear-gradient(to right, var(--theme-primary-500), var(--theme-primary-300))`,
                  }
                : undefined
            }
          >
            {filterLabels[filter]}
          </button>
        ))}
      </div>

      {/* Empty State */}
      {filteredAnime.length === 0 && (
        <div
          className="mobile-app-section max-md:mobile-page-card rounded-2xl border p-6 text-center backdrop-blur md:rounded-[32px] md:p-12"
          style={{
            backgroundColor: 'var(--theme-card-bg-90)',
            borderColor: 'var(--theme-card-border)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)'
          }}
        >
          <svg
            className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="mt-3 text-sm font-semibold text-gray-700 dark:text-gray-300 md:mt-4 md:text-lg">
            {'\u6682\u65e0\u52a8\u6f2b\u6570\u636e'}
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 md:mt-2 md:text-sm">
            {'\u8bf7\u7a0d\u540e\u518d\u8bd5\u6216\u68c0\u67e5\u540e\u7aef API'}
          </p>
        </div>
      )}

      {/* Cards */}
      {filteredAnime.length > 0 && (
        <div className="max-md:mobile-feed-panel max-md:mobile-feed-list md:grid md:grid-cols-2 md:gap-6 xl:grid-cols-3">
          {filteredAnime.map((anime, index) => {
          // stagger 动画延迟
          const staggerDelay = Math.min(index * 80, 600)
          // 使用API的progress字段，如果没有则计算
          const progress = anime.progress !== undefined 
            ? anime.progress 
            : anime.totalEpisodes > 0 
              ? Math.round((anime.watchedEpisodes / anime.totalEpisodes) * 100)
              : 0

          const statusColorMap: Record<AnimeEntry['status'], string> = {
            watching: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
            completed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
            planned: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
            dropped: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
          }

          const statusIconMap: Record<AnimeEntry['status'], string> = {
            watching: '▶',
            completed: '✔',
            planned: '♡',
            dropped: '✕',
          }

          const categoryLabelMap: Record<'anime' | 'drama' | 'other', string> = categoryLabels || {
            anime: '动画',
            drama: '剧集',
            other: '其他',
          }

          const mobileCard = (
            <div className="mobile-feed-item flex gap-2.5 p-2 md:hidden backdrop-blur-md rounded-xl border border-white/20 bg-white/40 dark:bg-gray-900/40 dark:border-white/10"
            >
              <div className="relative h-[4.5rem] w-12 shrink-0 overflow-hidden rounded-lg bg-gray-200/50 dark:bg-gray-700/50">
                <AnimeCoverImage cover={anime.cover} title={anime.title} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="line-clamp-2 text-xs font-semibold leading-snug text-gray-900 dark:text-gray-100">
                  {anime.title}
                </h3>
                <div className="chip-scroll -mx-0.5 mt-1 flex gap-1 overflow-x-auto pb-0.5">
                  <Chip>
                    {statusIconMap[anime.status]} {statusLabels[anime.status]}
                  </Chip>
                  {anime.rating > 0 && <Chip>{'\u2b50'} {anime.rating}</Chip>}
                  {anime.is_favorite && <Chip>{'\u2764\ufe0f'}</Chip>}
                  {anime.category && <Chip>{categoryLabelMap[anime.category]}</Chip>}
                </div>
                {anime.totalEpisodes > 0 && (
                  <div className="mt-1.5">
                    <div className="flex items-center justify-between text-[10px] text-gray-500 dark:text-gray-400">
                      <span>
                        {anime.watchedEpisodes}/{anime.totalEpisodes}
                      </span>
                      <span className="font-semibold tabular-nums">{progress}%</span>
                    </div>
                    <div className="mt-0.5 h-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                      <div
                        className="h-full rounded-full bg-[var(--theme-primary-500)]"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}
                {anime.tags && anime.tags.length > 0 && (
                  <div className="chip-scroll -mx-0.5 mt-1 flex gap-1 overflow-x-auto pb-0.5">
                    {anime.tags.slice(0, 4).map((tag) => (
                      <Chip key={tag}>{tag}</Chip>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )

          const desktopCard = (
            <div
              className="group relative flex h-full flex-col overflow-hidden rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl md:flex"
              style={{
                background: 'linear-gradient(145deg, color-mix(in srgb, var(--theme-primary-50) 48%, var(--theme-card-bg)), var(--theme-card-bg) 68%)',
                borderColor: 'var(--theme-primary-200)',
                animation: `anime-card-enter 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${staggerDelay}ms forwards`,
              }}
            >
              {/* 顶部彩色线条 */}
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-0.5"
                style={{ background: `linear-gradient(to right, var(--theme-primary-400), var(--theme-secondary), transparent)` }}
                aria-hidden
              />
              {/* 背景光晕 */}
              <div
                className="pointer-events-none absolute -right-14 -top-14 h-40 w-40 rounded-full opacity-[0.14] blur-3xl transition-transform duration-500 group-hover:scale-125"
                style={{ backgroundColor: 'var(--theme-primary-400)' }}
                aria-hidden
              />
              {/* 大数字水印 */}
              <span
                className="pointer-events-none absolute -bottom-7 -right-1 select-none font-black leading-none tracking-tighter opacity-[0.08] text-[8rem]"
                style={{ color: 'var(--theme-primary-500)' }}
                aria-hidden
              >
                {String(index + 1).padStart(2, '0')}
              </span>

              <div className="relative mb-4 h-64 w-full flex-shrink-0 overflow-hidden rounded-t-2xl bg-gray-200 dark:bg-gray-700">
                <AnimeCoverImage cover={anime.cover} title={anime.title} />
                <div
                  className={`image-placeholder absolute inset-0 flex items-center justify-center text-gray-400 dark:text-gray-500 ${anime.cover ? 'hidden' : ''}`}
                >
                  <div className="text-center">
                    <svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="mt-2 text-sm">暂无封面</p>
                  </div>
                </div>
                <div className="absolute left-4 top-4 flex items-center gap-2 flex-wrap">
                  <span className={`flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium ${statusColorMap[anime.status]}`}>
                    <span>{statusIconMap[anime.status]}</span>
                    <span>{statusLabels[anime.status]}</span>
                  </span>
                  {anime.rating > 0 && (
                    <span className="rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white">
                      ⭐ {anime.rating}
                    </span>
                  )}
                  {anime.is_favorite && (
                    <span className="rounded-full bg-pink-500/80 px-3 py-1 text-xs font-semibold text-white">
                      ❤️
                    </span>
                  )}
                </div>
                {anime.totalEpisodes > 0 && (
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent px-4 pb-4">
                    <div className="flex items-center justify-between text-xs text-white/90">
                      <span>{progressLabel}: {anime.watchedEpisodes}/{anime.totalEpisodes}</span>
                      <span className="font-semibold">{progress}%</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/30">
                      <div
                        className={`anime-progress-glow h-full rounded-full ${
                          anime.status === 'completed' ? 'bg-blue-300' :
                          anime.status === 'watching' ? 'bg-green-300' :
                          anime.status === 'dropped' ? 'bg-gray-400' : 'bg-amber-300'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="relative flex flex-1 flex-col space-y-3 p-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {anime.category && (
                      <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400 dark:text-gray-500">
                        {categoryLabelMap[anime.category]}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold tracking-tight text-gray-900 dark:text-gray-100 line-clamp-1">
                    {anime.title}
                  </h3>
                  {anime.description ? (
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                      {anime.description}
                    </p>
                  ) : (
                    <p className="mt-2 text-sm text-transparent line-clamp-2">占位</p>
                  )}
                </div>

                <div className="mt-auto pt-3 border-t" style={{ borderColor: 'var(--theme-card-border)' }}>
                  {anime.tags && anime.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {anime.tags.slice(0, 5).map((tag) => (
                        <Chip key={tag}>{tag}</Chip>
                      ))}
                      {anime.tags.length > 5 && <Chip>+{anime.tags.length - 5}</Chip>}
                    </div>
                  ) : (
                    <div className="h-6"></div>
                  )}
                </div>
              </div>
            </div>
          )

          const cardContent = (
            <>
              {mobileCard}
              {desktopCard}
            </>
          )

          if (anime.url) {
            return (
              <a
                key={`anime-${anime.id}-${index}`}
                href={anime.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block md:h-full"
              >
                {cardContent}
              </a>
            )
          }

          return (
            <div key={`anime-${anime.id}-${index}`} className="md:h-full">
              {cardContent}
            </div>
          )
          })}
        </div>
      )}
    </div>
  )
}


