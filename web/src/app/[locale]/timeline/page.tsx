import { Suspense } from 'react'
import Navbar from '@/components/Navbar'
import ArchiveHeroBanner from '@/components/ArchiveHeroBanner'
import PageLayout from '@/components/PageLayout'
import AppSidebarLeft from '@/components/AppSidebarLeft'
import TimelineTypeNav from '@/components/sidebar/TimelineTypeNav'
import AppSidebarRight from '@/components/AppSidebarRight'
import TimelineList, { TimelineEntry } from '@/components/TimelineList'
import { TimelineCurrentStatusCard, TimelineStatsCard } from '@/components/sidebar/TimelineSidebarCards'
import { getTimelines, convertApiTimelineToTimelineEntry } from '@/lib/api'
import { isValidLocale } from '@/i18n'
import { resolveNestedMessage } from '@/lib/i18n-utils'
import type { Messages } from '@/types/messages'
import { logger } from '@/lib/logger'

/**
 * 直接加载翻译文件（不依赖 getRequestConfig）
 */
async function loadMessages(locale: string): Promise<Messages> {
  try {
    const messages = (await import(`@/messages/${locale}.json`)).default;
    return messages as Messages;
  } catch (error) {
    logger.error(`[TimelinePage] Failed to load messages for locale: ${locale}`, error);
    // 如果加载失败，尝试加载默认语言
    const defaultMessages = (await import(`@/messages/zh.json`)).default;
    return defaultMessages as Messages;
  }
}

export default async function TimelinePage({ 
  params,
  searchParams,
}: { 
  params: Promise<{ locale: string }>
  searchParams: Promise<{ search?: string; tags?: string; skip?: string; limit?: string }>
}) {
  const { locale } = await params
  const searchParamsData = await searchParams
  
  // 验证 locale 并加载翻译
  const validLocale = isValidLocale(locale) ? locale : 'zh'
  const messages = await loadMessages(validLocale)
  const timelineMessages = messages.timeline
  const sidebarMessages = messages.sidebar
  
  // 创建翻译函数
  const timelineT = (key: string) => resolveNestedMessage(timelineMessages, key)
  const sidebarT = (key: string) => resolveNestedMessage(sidebarMessages, key)
  
  // 开发环境下记录翻译值
  if (process.env.NODE_ENV === 'development') {
    logger.log(`[TimelinePage] Locale: ${locale}, ValidLocale: ${validLocale}`)
    logger.log(`[TimelinePage] Title: ${timelineT('title')}`)
    logger.log(`[TimelinePage] Subtitle: ${timelineT('subtitle')}`)
  }

  // 从 API 获取时间线数据
  const timelinesResponse = await getTimelines({
    skip: searchParamsData.skip ? parseInt(searchParamsData.skip, 10) : 0,
    limit: searchParamsData.limit ? parseInt(searchParamsData.limit, 10) : 100,
    public_only: true,
    search: searchParamsData.search || null,
    tags: searchParamsData.tags || null,
  })

  // 转换为 TimelineEntry 格式
  const timelineEntries: TimelineEntry[] = timelinesResponse.timelines.map((apiTimeline) =>
    convertApiTimelineToTimelineEntry(apiTimeline, locale)
  )

  // Calculate statistics
  const stats = {
    total: timelinesResponse.total,
    workExperience: timelineEntries.filter((e) => e.type === 'work').length,
    projects: timelineEntries.filter((e) => e.type === 'project').length,
    achievements: timelineEntries.filter((e) => e.type === 'achievement').length,
  }
  const currentEntries = timelineEntries.filter((entry) => entry.isCurrent)
  const typeLabels = {
    work: timelineT('types.work'),
    project: timelineT('types.project'),
    education: timelineT('types.education'),
    achievement: timelineT('types.achievement'),
  }

  return (
    <div 
      className="min-h-screen bg-gradient-to-b"
      style={{
        background: `linear-gradient(to bottom, var(--theme-bg-start), var(--theme-bg-middle), var(--theme-bg-end))`
      }}
    >
      <Navbar />
      <ArchiveHeroBanner />

        <PageLayout
          forceThreeColumn
          leftSidebar={
            <Suspense
              fallback={
                <div className="space-y-6">
                  <div className="h-32 rounded-2xl bg-white/70 dark:bg-gray-900/60 shadow-md animate-pulse" />
                  <div className="space-y-3">
                    <div className="h-4 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
                    <div className="h-4 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
                    <div className="h-4 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
                  </div>
                </div>
              }
            >
<AppSidebarLeft locale={locale}>
                <Suspense fallback={null}>
                  <TimelineTypeNav locale={locale} />
                </Suspense>
              </AppSidebarLeft>
            </Suspense>
          }
          rightSidebar={
            <Suspense
              fallback={
                <div className="space-y-6">
                  <div className="h-24 rounded-2xl bg-white/70 dark:bg-gray-900/60 shadow-md animate-pulse" />
                  <div className="h-32 rounded-2xl bg-white/70 dark:bg-gray-900/60 shadow-md animate-pulse" />
                  <div className="h-24 rounded-2xl bg-white/70 dark:bg-gray-900/60 shadow-md animate-pulse" />
                </div>
              }
            >
              <AppSidebarRight
                locale={locale}
                latestUpdatesReplacement={
                  <>
                    <TimelineStatsCard
                      title={sidebarT('timelineOverview')}
                      stats={stats}
                      labels={{
                        total: timelineT('stats.total'),
                        workExperience: timelineT('stats.workExperience'),
                        projects: timelineT('stats.projects'),
                        achievements: timelineT('stats.achievements'),
                      }}
                    />
                    <TimelineCurrentStatusCard
                      title={timelineT('currentStatus')}
                      entries={currentEntries}
                      typeLabels={typeLabels}
                      durationLabel={timelineT('duration')}
                      locationLabel={timelineT('location')}
                    />
                  </>
                }
              />
            </Suspense>
          }
          content={
            <div>
              <TimelineList
                entries={timelineEntries}
                labels={{
                  title: timelineT('title'),
                  subtitle: timelineT('subtitle'),
                  history: timelineT('history'),
                  currentStatus: timelineT('currentStatus'),
                  currentStatusCount: timelineT('currentStatusCount'),
                  scrollToHistory: timelineT('scrollToHistory'),
                  types: typeLabels,
                  duration: timelineT('duration'),
                  location: timelineT('location'),
                }}
              />
            </div>
          }
        />
    </div>
  )
}

