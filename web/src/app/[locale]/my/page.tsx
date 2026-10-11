import { Suspense } from 'react'
import Navbar from '@/components/Navbar'
import ArchiveHeroBanner from '@/components/ArchiveHeroBanner'
import PageLayout from '@/components/PageLayout'
import AppSidebarLeft from '@/components/AppSidebarLeft'
import { getAnimeWatchlist, convertAnimeWatchlistToAnimeEntry } from '@/lib/api'
import type { AnimeEntry } from '@/components/AnimeList'
import { logger } from '@/lib/logger'
import { isValidLocale } from '@/i18n'
import { resolveNestedMessage } from '@/lib/i18n-utils'
import type { Messages } from '@/types/messages'
import AnimeList from '@/components/AnimeList'
import MobilePageHeader from '@/components/mobile/MobilePageHeader'
import { getTranslations } from 'next-intl/server'
import { Icon } from '@iconify/react'
import { SidebarCard } from '@/components/Sidebar'
import { LeftSidebarFallback, RightSidebarFallback } from '@/components/layout/PageSidebarFallback'
import PageIntroCard from '@/components/PageIntroCard'

async function loadMessages(locale: string): Promise<Messages> {
  try {
    const messages = (await import(`@/messages/${locale}.json`)).default
    return messages as Messages
  } catch (error) {
    logger.error(`[MyPage] Failed to load messages for locale: ${locale}`, error)
    const defaultMessages = (await import(`@/messages/zh.json`)).default
    return defaultMessages as Messages
  }
}

export default async function MyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const validLocale = isValidLocale(locale) ? locale : 'zh'
  const navT = await getTranslations('nav')
  const messages = await loadMessages(validLocale)
  const myPageMessages = messages.myPage

  const myPageT = (key: string) => resolveNestedMessage(myPageMessages, key)

  // 获取所有追番数据用于侧边栏统计
  const allAnimeWatchlist = await getAnimeWatchlist({
    is_active: true,
    limit: 1000,
    sort_by: 'sort_order',
  })

  const animeEntries: AnimeEntry[] = await Promise.all(
    allAnimeWatchlist.map(convertAnimeWatchlistToAnimeEntry)
  )

  // 统计
  const totalCount = animeEntries.length
  const watchingCount = animeEntries.filter((a) => a.status === 'watching').length
  const completedCount = animeEntries.filter((a) => a.status === 'completed').length
  const plannedCount = animeEntries.filter((a) => a.status === 'planned').length
  const droppedCount = animeEntries.filter((a) => a.status === 'dropped').length
  const favoriteCount = animeEntries.filter((a) => a.is_favorite).length

  // 标签统计
  const tagCounts = new Map<string, number>()
  animeEntries.forEach((a) => {
    a.tags.forEach((tag) => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
    })
  })
  const tagStats = Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag, count]) => ({ tag, count }))

  return (
    <div
      className="min-h-screen bg-gradient-to-b max-md:bg-[var(--theme-bg-middle)]"
      style={{
        background: `linear-gradient(to bottom, var(--theme-bg-start), var(--theme-bg-middle), var(--theme-bg-end))`,
      }}
    >
      <Navbar />
      <div className="max-md:hidden">
        <ArchiveHeroBanner />
      </div>

      <PageLayout
        forceThreeColumn
        leftSidebar={
          <Suspense fallback={<LeftSidebarFallback />}>
            <AppSidebarLeft locale={locale} showAnnouncement={false}>
              {/* 追番统计 */}
              <SidebarCard>
                <div className="grid grid-cols-2 gap-2">
                  <div className="min-w-0 rounded-xl bg-[var(--theme-primary-50)] px-2 py-3 text-center">
                    <Icon icon="mdi:television-classic" className="mx-auto h-4 w-4 text-[var(--theme-primary-500)]" aria-hidden />
                    <p className="mt-1 text-xl font-bold tabular-nums text-gray-800 dark:text-gray-100">{totalCount}</p>
                    <p className="mt-0.5 truncate text-[9px] text-gray-500 dark:text-gray-400">{myPageT('stats.total') || '总计'}</p>
                  </div>
                  <div className="min-w-0 rounded-xl bg-[var(--theme-primary-50)] px-2 py-3 text-center">
                    <Icon icon="mdi:heart-outline" className="mx-auto h-4 w-4 text-[var(--theme-primary-500)]" aria-hidden />
                    <p className="mt-1 text-xl font-bold tabular-nums text-gray-800 dark:text-gray-100">{favoriteCount}</p>
                    <p className="mt-0.5 truncate text-[9px] text-gray-500 dark:text-gray-400">{myPageT('stats.favorite') || '收藏'}</p>
                  </div>
                </div>
              </SidebarCard>
              {/* 状态分布 */}
              <SidebarCard title={myPageT('statusOverview') || '状态分布'}>
                <div className="mb-3 flex h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                  {totalCount > 0 && (
                    <>
                      <span style={{ width: `${(watchingCount / totalCount) * 100}%`, backgroundColor: 'var(--theme-primary-400)' }} className="h-full" />
                      <span style={{ width: `${(completedCount / totalCount) * 100}%`, backgroundColor: 'var(--theme-secondary)' }} className="h-full" />
                      <span style={{ width: `${(plannedCount / totalCount) * 100}%`, backgroundColor: 'var(--theme-primary-200)' }} className="h-full" />
                      <span style={{ width: `${(droppedCount / totalCount) * 100}%`, backgroundColor: 'var(--theme-primary-100)' }} className="h-full" />
                    </>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between rounded-xl border border-[var(--theme-card-border)] px-3 py-2">
                    <span className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                      <span className="h-2 w-2 rounded-full bg-green-400" />
                      {myPageT('statusBadges.watching')}
                    </span>
                    <span className="text-sm font-bold text-gray-800 dark:text-gray-100">{watchingCount}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-[var(--theme-card-border)] px-3 py-2">
                    <span className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                      <span className="h-2 w-2 rounded-full bg-blue-400" />
                      {myPageT('statusBadges.completed')}
                    </span>
                    <span className="text-sm font-bold text-gray-800 dark:text-gray-100">{completedCount}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-[var(--theme-card-border)] px-3 py-2">
                    <span className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                      <span className="h-2 w-2 rounded-full bg-amber-400" />
                      {myPageT('statusBadges.planned')}
                    </span>
                    <span className="text-sm font-bold text-gray-800 dark:text-gray-100">{plannedCount}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-[var(--theme-card-border)] px-3 py-2">
                    <span className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                      <span className="h-2 w-2 rounded-full bg-gray-400" />
                      {myPageT('statusBadges.dropped')}
                    </span>
                    <span className="text-sm font-bold text-gray-800 dark:text-gray-100">{droppedCount}</span>
                  </div>
                </div>
              </SidebarCard>
            </AppSidebarLeft>
          </Suspense>
        }
        rightSidebar={
          <Suspense fallback={<RightSidebarFallback />}>
            {/* 热门标签 */}
            {tagStats.length > 0 && (
              <SidebarCard title={myPageT('popularTags') || '热门标签'}>
                <div className="flex flex-wrap gap-2">
                  {tagStats.map(({ tag, count }) => (
                    <span
                      key={tag}
                      className="rounded-full bg-[var(--theme-primary-50)] px-3 py-1.5 text-[11px] font-medium text-[var(--theme-primary-600)]"
                    >
                      {tag}
                      <span className="ml-1 text-[var(--theme-primary-400)]">{count}</span>
                    </span>
                  ))}
                </div>
              </SidebarCard>
            )}
          </Suspense>
        }
        content={
          <div className="space-y-3 sm:space-y-8">
            <MobilePageHeader
              title={myPageT('title')}
              subtitle={myPageT('subtitle')}
              backHref={`/${locale}`}
              backLabel={navT('anime')}
            />
            <PageIntroCard
              title={myPageT('title')}
              subtitle={myPageT('description')}
            />
            <AnimeList
              anime={animeEntries}
              filterLabels={{
                all: myPageT('filters.all'),
                watching: myPageT('filters.watching'),
                completed: myPageT('filters.completed'),
                planned: myPageT('filters.planned'),
                dropped: myPageT('filters.dropped'),
              }}
              statusLabels={{
                watching: myPageT('statusBadges.watching'),
                completed: myPageT('statusBadges.completed'),
                planned: myPageT('statusBadges.planned'),
                dropped: myPageT('statusBadges.dropped'),
              }}
              progressLabel={myPageT('progressLabel')}
              categoryLabels={{
                anime: myPageT('categoryLabels.anime'),
                drama: myPageT('categoryLabels.drama'),
                other: myPageT('categoryLabels.other'),
              }}
            />
          </div>
        }
      />
    </div>
  )
}
