import { Suspense } from 'react'
import Navbar from '@/components/Navbar'
import ArchiveHeroBanner from '@/components/ArchiveHeroBanner'
import PageLayout from '@/components/PageLayout'
import AppSidebarLeft from '@/components/AppSidebarLeft'
import dynamic from 'next/dynamic'
import type { DiaryEntry } from '@/components/DiaryList'
import { getTranslations } from 'next-intl/server'
import MobilePageHeader from '@/components/mobile/MobilePageHeader'
import PageIntroCard, { PageIntroBadge } from '@/components/PageIntroCard'
import { Icon } from '@iconify/react'
import { SidebarCard } from '@/components/Sidebar'
import { LeftSidebarFallback, RightSidebarFallback } from '@/components/layout/PageSidebarFallback'
import Link from 'next/link'

// 懒加载非关键客户端组件
const DiaryList = dynamic(() => import('@/components/DiaryList').then(mod => mod.default), {
  loading: () => <div className="text-center py-12"><p className="text-gray-500">加载中...</p></div>,
  ssr: true,
})
import { getDiaries, type Diary } from '@/lib/api'
import { getImageUrl } from '@/lib/image-utils'
import { logger } from '@/lib/logger'
import { isValidLocale } from '@/i18n'

/**
 * 将 API 返回的 Diary 转换为 DiaryEntry 格式
 */
function convertDiaryToEntry(diary: Diary, locale: string): DiaryEntry {
  // 提取图片 URL，优先 image_url；经 getImageUrl 统一处理代理 / 相对 OSS 路径
  const images = (diary.images || [])
    .map((img) => {
      const imageUrl = img.image_url || img.thumbnail_url
      const resolved = getImageUrl(imageUrl)
      if (!resolved) {
        logger.warn('[convertDiaryToEntry] Invalid image URL:', {
          imageUrl,
          image_url: img.image_url,
          thumbnail_url: img.thumbnail_url,
        })
        return null
      }
      return resolved
    })
    .filter((url): url is string => url !== null && url.length > 0)

  logger.log('[convertDiaryToEntry] Converted images:', {
    diaryId: diary.id,
    imageCount: images.length,
    images,
  })

  return {
    id: diary.id,
    title: diary.title || '',
    content: diary.content || '',
    images,
    date: new Date(diary.created_at || diary.updated_at),
    locale,
    weather: diary.weather || undefined,
    mood: diary.mood || undefined,
    tags: diary.tags || undefined,
  }
}

interface DiaryPageProps {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ page?: string; year?: string; tag?: string }>
}

export default async function DiaryPage({ params, searchParams }: DiaryPageProps) {
  const { locale } = await params
  const search = await searchParams
  const pageParam = search.page
  const yearParam = search.year
  const tagParam = search.tag

  const navT = await getTranslations('nav')
  const diaryT = await getTranslations('diary')

  const validLocale = isValidLocale(locale) ? locale : 'zh'

  if (process.env.NODE_ENV === 'development') {
    logger.log(`[DiaryPage] Locale: ${locale}, ValidLocale: ${validLocale}`)
    logger.log(`[DiaryPage] Title: ${diaryT('title')}`)
  }

  const currentPage = Math.max(1, parseInt(pageParam || '1', 10))
  const perPage = 4

  const yearParsed = yearParam !== undefined ? parseInt(String(yearParam), 10) : NaN
  const yearValid = !Number.isNaN(yearParsed) && yearParsed >= 1970 && yearParsed <= 2100
  const tagTrimmed = tagParam !== undefined ? String(tagParam).trim() : ''
  const useFilter = yearValid || tagTrimmed.length > 0

  // 获取所有日记用于侧边栏统计
  const allDiariesBatch = await getDiaries({ skip: 0, limit: 1000, public_only: true })
  const allDiaries = allDiariesBatch.diaries

  // 统计年份分布
  const yearCounts = new Map<number, number>()
  const tagCounts = new Map<string, number>()
  let hasWeather = 0
  let hasMood = 0
  let hasImages = 0

  allDiaries.forEach((d) => {
    const year = new Date(d.created_at).getFullYear()
    yearCounts.set(year, (yearCounts.get(year) || 0) + 1)
    if (d.weather) hasWeather++
    if (d.mood) hasMood++
    if (d.images && d.images.length > 0) hasImages++
    (d.tags || []).forEach((tag) => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
    })
  })

  const yearStats = Array.from(yearCounts.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([year, count]) => ({ year, count }))

  const tagStats = Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag, count]) => ({ tag, count }))

  let entriesWithLocale: DiaryEntry[] = []
  let totalForPagination = 0

  if (useFilter) {
    let filtered = allDiaries
    if (yearValid) {
      filtered = filtered.filter((d) => new Date(d.created_at).getFullYear() === yearParsed)
    }
    if (tagTrimmed.length > 0) {
      filtered = filtered.filter((d) => (d.tags || []).some((x) => x === tagTrimmed))
    }
    filtered.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    totalForPagination = filtered.length
    const skip = (currentPage - 1) * perPage
    entriesWithLocale = filtered
      .slice(skip, skip + perPage)
      .map((d) => convertDiaryToEntry(d, locale))
  } else {
    const diariesResponse = await getDiaries({
      skip: (currentPage - 1) * perPage,
      limit: perPage,
      public_only: true,
    })
    entriesWithLocale = diariesResponse.diaries.map((diary) =>
      convertDiaryToEntry(diary, locale)
    )
    totalForPagination = diariesResponse.total
  }

  const totalPages = Math.ceil(totalForPagination / perPage) || 1

  let filterHint: string | null = null
  if (yearValid && tagTrimmed.length > 0) {
    filterHint = diaryT('filterYearTag', { year: String(yearParsed), tag: tagTrimmed })
  } else if (yearValid) {
    filterHint = diaryT('filterYear', { year: String(yearParsed) })
  } else if (tagTrimmed.length > 0) {
    filterHint = diaryT('filterTag', { tag: tagTrimmed })
  }

  return (
    <div 
      className="min-h-screen bg-gradient-to-b max-md:bg-[var(--theme-bg-middle)]"
      style={{
        background: `linear-gradient(to bottom, var(--theme-bg-start), var(--theme-bg-middle), var(--theme-bg-end))`
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
                {/* 日记统计 - 使用 Metric 风格 */}
                <SidebarCard>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="min-w-0 rounded-xl bg-[var(--theme-primary-50)] px-2 py-3 text-center">
                      <Icon icon="mdi:book-open-outline" className="mx-auto h-4 w-4 text-[var(--theme-primary-500)]" aria-hidden />
                      <p className="mt-1 text-xl font-bold tabular-nums text-gray-800 dark:text-gray-100">{allDiaries.length}</p>
                      <p className="mt-0.5 truncate text-[9px] text-gray-500 dark:text-gray-400" title={diaryT('entriesLabel')}>{diaryT('entriesLabel')}</p>
                    </div>
                    <div className="min-w-0 rounded-xl bg-[var(--theme-primary-50)] px-2 py-3 text-center">
                      <Icon icon="mdi:image-outline" className="mx-auto h-4 w-4 text-[var(--theme-primary-500)]" aria-hidden />
                      <p className="mt-1 text-xl font-bold tabular-nums text-gray-800 dark:text-gray-100">{hasImages}</p>
                      <p className="mt-0.5 truncate text-[9px] text-gray-500 dark:text-gray-400" title={diaryT('withPhotos')}>{diaryT('withPhotos')}</p>
                    </div>
                  </div>
                </SidebarCard>
                {/* 年份筛选 */}
                {yearStats.length > 0 && (
                  <SidebarCard title={diaryT('yearFilter')}>
                    <div className="space-y-2">
                      {yearStats.map(({ year, count }) => (
                        <Link
                          key={year}
                          href={`/${locale}/my/diary?year=${year}`}
                          className={`group flex items-center justify-between rounded-xl border px-3 py-2.5 text-xs transition-all hover:shadow-sm ${yearValid && yearParsed === year ? 'border-[var(--theme-primary-400)] bg-[var(--theme-primary-50)]' : 'border-[var(--theme-card-border)] hover:bg-[var(--theme-primary-50)]'}`}
                        >
                          <span className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                            <Icon icon="mdi:calendar-blank" className="h-4 w-4 text-[var(--theme-primary-400)]" />
                            <span className="font-medium">{year}年</span>
                          </span>
                          <span className="rounded-full bg-[var(--theme-primary-100)] px-2.5 py-0.5 text-[10px] font-bold tabular-nums text-[var(--theme-primary-700)]">
                            {count}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </SidebarCard>
                )}
              </AppSidebarLeft>
            </Suspense>
          }
          rightSidebar={
            <Suspense fallback={<RightSidebarFallback />}>
              {/* 标签云 */}
              {tagStats.length > 0 && (
                <SidebarCard title={diaryT('popularTags')}>
                  <div className="flex flex-wrap gap-2">
                    {tagStats.map(({ tag, count }) => (
                      <Link
                        key={tag}
                        href={`/${locale}/my/diary?tag=${encodeURIComponent(tag)}`}
                        className={`rounded-full px-3 py-1.5 text-[11px] font-medium transition-all hover:shadow-sm ${tagTrimmed === tag ? 'bg-[var(--theme-primary-500)] text-white shadow-sm' : 'bg-[var(--theme-primary-50)] text-[var(--theme-primary-600)] hover:bg-[var(--theme-primary-100)]'}`}
                      >
                        #{tag}
                        <span className={`ml-1 tabular-nums ${tagTrimmed === tag ? 'text-white/80' : 'text-[var(--theme-primary-400)]'}`}>
                          {count}
                        </span>
                      </Link>
                    ))}
                  </div>
                </SidebarCard>
              )}
              {/* 心情/天气统计 - 使用进度条风格 */}
              <SidebarCard title={diaryT('moodStats')}>
                <div className="mb-3 flex h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                  {allDiaries.length > 0 && (
                    <>
                      <span style={{ width: `${(hasWeather / allDiaries.length) * 100}%`, backgroundColor: 'var(--theme-primary-400)' }} className="h-full" />
                      <span style={{ width: `${(hasMood / allDiaries.length) * 100}%`, backgroundColor: 'var(--theme-secondary)' }} className="h-full" />
                    </>
                  )}
                </div>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between rounded-xl border border-[var(--theme-card-border)] px-3 py-2">
                    <span className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                      <Icon icon="mdi:weather-partly-cloudy" className="h-4 w-4" style={{ color: 'var(--theme-primary-400)' }} />
                      记录天气
                    </span>
                    <span className="text-sm font-bold tabular-nums text-gray-800 dark:text-gray-100">{hasWeather}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-[var(--theme-card-border)] px-3 py-2">
                    <span className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                      <Icon icon="mdi:emoticon-happy-outline" className="h-4 w-4" style={{ color: 'var(--theme-secondary)' }} />
                      记录心情
                    </span>
                    <span className="text-sm font-bold tabular-nums text-gray-800 dark:text-gray-100">{hasMood}</span>
                  </div>
                </div>
              </SidebarCard>
            </Suspense>
          }
          content={
            <div className="space-y-3 sm:space-y-8">
            <MobilePageHeader
              title={diaryT('title')}
              subtitle={diaryT('subtitle')}
              backHref={`/${locale}`}
              backLabel={navT('diary')}
            />
            <PageIntroCard
              title={diaryT('title')}
              subtitle={diaryT('subtitle')}
              meta={<PageIntroBadge>{totalForPagination} {diaryT('entriesLabel')}</PageIntroBadge>}
            />
            <DiaryList
              entries={entriesWithLocale}
              timeAgoLabel={diaryT('timeAgoLabel')}
              currentPage={currentPage}
              totalPages={totalPages}
              basePath={`/${locale}/my/diary`}
              locale={locale}
              filterHint={filterHint}
              emptyMessage={
                useFilter && totalForPagination === 0
                  ? diaryT('noDiariesFiltered')
                  : undefined
              }
              paginationLabels={{
                previous: diaryT('pagination.previous'),
                next: diaryT('pagination.next'),
                page: diaryT('pagination.page'),
                of: diaryT('pagination.of'),
              }}
            />
            </div>
          }
        />
    </div>
  )
}
