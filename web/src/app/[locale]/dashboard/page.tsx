import { Suspense, type ReactNode } from 'react'
import { Icon } from '@iconify/react'
import { getTranslations } from 'next-intl/server'
import Navbar from '@/components/Navbar'
import ArchiveHeroBanner from '@/components/ArchiveHeroBanner'
import PageLayout from '@/components/PageLayout'
import AppSidebarLeft from '@/components/AppSidebarLeft'
import { SidebarCard } from '@/components/Sidebar'
import { LeftSidebarFallback, RightSidebarFallback } from '@/components/layout/PageSidebarFallback'
import MobilePageHeader from '@/components/mobile/MobilePageHeader'
import { getSiteStats } from '@/lib/api'
import type { SiteStats } from '@/lib/api'
import { isValidLocale } from '@/i18n'
import type { Messages } from '@/types/messages'
import { logger } from '@/lib/logger'
import PageIntroCard, { PageIntroBadge } from '@/components/PageIntroCard'

async function loadMessages(locale: string): Promise<Messages> {
  try {
    return (await import(`@/messages/${locale}.json`)).default as Messages
  } catch (error) {
    logger.error(`[DashboardPage] Failed to load messages for locale: ${locale}`, error)
    return (await import('@/messages/zh.json')).default as Messages
  }
}

export const revalidate = 60

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const validLocale = isValidLocale(locale) ? locale : 'zh'
  const navT = await getTranslations('nav')
  const [messages, stats] = await Promise.all([
    loadMessages(validLocale),
    getSiteStats(),
  ])
  const dashboardMessages = messages.dashboard

  const dashboardT = (key: string, values?: Record<string, string | number>) => {
    const keys = key.split('.')
    let value: unknown = dashboardMessages

    for (const item of keys) {
      value = (value as Record<string, unknown> | undefined)?.[item]
    }

    if (typeof value !== 'string') return key
    if (!values) return value

    return value.replace(/\{(\w+)\}/g, (match, placeholder) =>
      String(values[placeholder] ?? match)
    )
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-b max-md:bg-[var(--theme-bg-middle)]"
      style={{
        background:
          'radial-gradient(circle at 12% 12%, color-mix(in srgb, var(--theme-primary-300) 16%, transparent), transparent 32%), linear-gradient(to bottom, var(--theme-bg-start), var(--theme-bg-middle), var(--theme-bg-end))',
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
              {stats ? (
                <DashboardSystemCard
                  title={dashboardT('runtimeOverview')}
                  statusLabel={dashboardT('onlineStatus')}
                  statusValue={dashboardT('running')}
                  uptimeLabel={dashboardT('uptime')}
                  uptime={`${stats.uptime_days}d ${stats.uptime_hours}h`}
                  memoryLabel={dashboardT('memoryUsage')}
                  memory={`${stats.memory_usage_mb} MB`}
                  connectionsLabel={dashboardT('dbConnections')}
                  connections={stats.db_connections.toLocaleString()}
                />
              ) : null}
            </AppSidebarLeft>
          </Suspense>
        }
        rightSidebar={
          <Suspense fallback={<RightSidebarFallback />}>
            {stats ? (
              <>
                <DashboardContentCard
                  title={dashboardT('contentOverview')}
                  items={[
                    { icon: 'mdi:image-album', label: dashboardT('albums'), value: stats.album_count.toLocaleString() },
                    { icon: 'mdi:image-multiple-outline', label: dashboardT('photos'), value: stats.photo_count.toLocaleString() },
                    { icon: 'mdi:notebook-heart-outline', label: dashboardT('diaries'), value: stats.diary_count.toLocaleString() },
                  ]}
                />
                <DashboardTrafficCard
                  title={dashboardT('todayOverview')}
                  requestsLabel={dashboardT('todayRequestsLabel')}
                  requests={stats.today_requests.toLocaleString()}
                  visitorsLabel={dashboardT('todayVisitorsLabel')}
                  visitors={stats.today_visitors.toLocaleString()}
                />
              </>
            ) : null}
          </Suspense>
        }
        content={
          <div className="space-y-3 sm:space-y-5">
            <MobilePageHeader
              title={dashboardT('title')}
              subtitle={dashboardT('subtitle')}
              backHref={`/${locale}`}
              backLabel={navT('dashboard')}
              trailing={
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-xl border"
                  style={{
                    backgroundColor: 'var(--theme-primary-50)',
                    borderColor: 'var(--theme-primary-100)',
                    color: 'var(--theme-primary-600)',
                  }}
                  aria-hidden
                >
                  <Icon icon="mdi:view-dashboard-outline" className="h-5 w-5" />
                </span>
              }
            />

            <DashboardHeader
              title={dashboardT('title')}
              subtitle={dashboardT('subtitle')}
              uptime={stats ? `${stats.uptime_days}d ${stats.uptime_hours}h` : null}
              uptimeLabel={dashboardT('uptime')}
              statusLabel={dashboardT('onlineStatus')}
            />

            {stats ? (
              <>
                <section className="grid grid-cols-2 gap-3 sm:gap-4">
                  <MetricCard
                    icon="mdi:account-group-outline"
                    label={dashboardT('totalVisitors')}
                    value={stats.total_visitors.toLocaleString()}
                    description={dashboardT('todayVisitors', {
                      count: stats.today_visitors.toLocaleString(),
                    })}
                    tone="pink"
                  />
                  <MetricCard
                    icon="mdi:swap-horizontal"
                    label={dashboardT('totalRequests')}
                    value={stats.total_requests.toLocaleString()}
                    description={dashboardT('todayRequests', {
                      count: stats.today_requests.toLocaleString(),
                    })}
                    tone="blue"
                  />
                  <MetricCard
                    icon="mdi:clock-outline"
                    label={dashboardT('uptime')}
                    value={`${stats.uptime_days}d ${stats.uptime_hours}h`}
                    description={dashboardT('uptimeDescription')}
                    tone="purple"
                  />
                  <MetricCard
                    icon="mdi:memory"
                    label={dashboardT('memoryUsage')}
                    value={`${stats.memory_usage_mb} MB`}
                    description={dashboardT('memoryUsageDescription')}
                    tone="green"
                  />
                </section>

                <section className="grid grid-cols-1 gap-3 sm:gap-4 lg:hidden">
                  <DashboardPanel
                    icon="mdi:folder-multiple-image"
                    title={dashboardT('contentOverview')}
                  >
                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                      <CompactMetric
                        icon="mdi:image-album"
                        label={dashboardT('albums')}
                        value={stats.album_count.toLocaleString()}
                      />
                      <CompactMetric
                        icon="mdi:image-multiple-outline"
                        label={dashboardT('photos')}
                        value={stats.photo_count.toLocaleString()}
                      />
                      <CompactMetric
                        icon="mdi:notebook-heart-outline"
                        label={dashboardT('diaries')}
                        value={stats.diary_count.toLocaleString()}
                      />
                    </div>
                  </DashboardPanel>

                  <DashboardPanel
                    icon="mdi:pulse"
                    title={dashboardT('systemOverview')}
                  >
                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                      <CompactMetric
                        icon="mdi:chart-line"
                        label={dashboardT('todayRequestsLabel')}
                        value={stats.today_requests.toLocaleString()}
                      />
                      <CompactMetric
                        icon="mdi:account-clock-outline"
                        label={dashboardT('todayVisitorsLabel')}
                        value={stats.today_visitors.toLocaleString()}
                      />
                      <CompactMetric
                        icon="mdi:database-outline"
                        label={dashboardT('dbConnections')}
                        value={stats.db_connections.toLocaleString()}
                      />
                    </div>
                  </DashboardPanel>
                </section>

                <DashboardPanel icon="mdi:trending-up" title={dashboardT('topPages')}>
                  {stats.top_pages?.length ? (
                    <TopPagesList
                      pages={stats.top_pages}
                      formatVisits={(count) => dashboardT('pageVisits', {
                        count: count.toLocaleString(),
                      })}
                    />
                  ) : (
                    <EmptyState message={dashboardT('noTopPages')} />
                  )}
                </DashboardPanel>
              </>
            ) : (
              <EmptyState message={dashboardT('loadFailed')} prominent />
            )}
          </div>
        }
      />
    </div>
  )
}

function DashboardHeader({
  title,
  subtitle,
  uptime,
  uptimeLabel,
  statusLabel,
}: {
  title: string
  subtitle: string
  uptime: string | null
  uptimeLabel: string
  statusLabel: string
}) {
  return (
    <PageIntroCard
      title={title}
      subtitle={subtitle}
      meta={
        <>
          <PageIntroBadge>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
            {statusLabel}
          </PageIntroBadge>
          {uptime ? (
            <PageIntroBadge icon="mdi:clock-check-outline">{uptimeLabel} · {uptime}</PageIntroBadge>
          ) : null}
        </>
      }
    />
  )
}

type DashboardSidebarItem = {
  icon: string
  label: string
  value: string
  status?: boolean
}

function DashboardSidebarRows({ items }: { items: DashboardSidebarItem[] }) {
  return (
    <div className="space-y-2.5">
      {items.map((item) => (
        <div
          key={`${item.label}-${item.value}`}
          className="flex min-w-0 items-center gap-3 rounded-2xl px-3 py-3"
          style={{ backgroundColor: 'var(--theme-primary-50)' }}
        >
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
            style={{
              backgroundColor: 'var(--theme-primary-100)',
              color: item.status ? '#10b981' : 'var(--theme-primary-600)',
            }}
            aria-hidden
          >
            <Icon icon={item.icon} className="h-[18px] w-[18px]" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-xs text-gray-500 dark:text-gray-400">
              {item.label}
            </span>
            <span className="mt-0.5 block truncate text-sm font-semibold tabular-nums text-gray-800 dark:text-gray-100">
              {item.value}
            </span>
          </span>
        </div>
      ))}
    </div>
  )
}

function DashboardSystemCard({
  title,
  statusLabel,
  statusValue,
  uptimeLabel,
  uptime,
  memoryLabel,
  memory,
  connectionsLabel,
  connections,
}: {
  title: string
  statusLabel: string
  statusValue: string
  uptimeLabel: string
  uptime: string
  memoryLabel: string
  memory: string
  connectionsLabel: string
  connections: string
}) {
  return (
    <SidebarCard title={title}>
      <DashboardSidebarRows
        items={[
          { icon: 'mdi:check-circle-outline', label: statusLabel, value: statusValue, status: true },
          { icon: 'mdi:clock-check-outline', label: uptimeLabel, value: uptime },
          { icon: 'mdi:memory', label: memoryLabel, value: memory },
          { icon: 'mdi:database-outline', label: connectionsLabel, value: connections },
        ]}
      />
    </SidebarCard>
  )
}

function DashboardContentCard({
  title,
  items,
}: {
  title: string
  items: DashboardSidebarItem[]
}) {
  return (
    <SidebarCard title={title}>
      <DashboardSidebarRows items={items} />
    </SidebarCard>
  )
}

function DashboardTrafficCard({
  title,
  requestsLabel,
  requests,
  visitorsLabel,
  visitors,
}: {
  title: string
  requestsLabel: string
  requests: string
  visitorsLabel: string
  visitors: string
}) {
  return (
    <SidebarCard title={title}>
      <DashboardSidebarRows
        items={[
          { icon: 'mdi:swap-horizontal', label: requestsLabel, value: requests },
          { icon: 'mdi:account-clock-outline', label: visitorsLabel, value: visitors },
        ]}
      />
    </SidebarCard>
  )
}

const metricTones = {
  pink: {
    icon: 'from-pink-500 to-rose-400',
    glow: 'bg-pink-400/15',
  },
  blue: {
    icon: 'from-sky-500 to-cyan-400',
    glow: 'bg-sky-400/15',
  },
  purple: {
    icon: 'from-violet-500 to-fuchsia-400',
    glow: 'bg-violet-400/15',
  },
  green: {
    icon: 'from-emerald-500 to-teal-400',
    glow: 'bg-emerald-400/15',
  },
} as const

function MetricCard({
  icon,
  label,
  value,
  description,
  tone,
}: {
  icon: string
  label: string
  value: string
  description: string
  tone: keyof typeof metricTones
}) {
  const styles = metricTones[tone]

  return (
    <article
      className="group relative min-w-0 overflow-hidden rounded-2xl border p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg sm:rounded-3xl sm:p-5"
      style={{
        backgroundColor: 'var(--theme-card-bg-90)',
        borderColor: 'var(--theme-card-border)',
      }}
    >
      <div className={`pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full blur-2xl ${styles.glow}`} />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-gray-500 dark:text-gray-400 sm:text-sm">
            {label}
          </p>
          <p className="mt-2 truncate text-2xl font-bold tabular-nums tracking-tight text-gray-900 dark:text-gray-100 sm:text-3xl">
            {value}
          </p>
          <p className="mt-1.5 line-clamp-1 text-[10px] text-gray-400 dark:text-gray-500 sm:text-xs">
            {description}
          </p>
        </div>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-sm ${styles.icon}`} aria-hidden>
          <Icon icon={icon} className="h-5 w-5" />
        </span>
      </div>
    </article>
  )
}

function DashboardPanel({
  icon,
  title,
  className = '',
  children,
}: {
  icon: string
  title: string
  className?: string
  children: ReactNode
}) {
  return (
    <section
      className={`rounded-2xl border p-3 shadow-sm sm:rounded-3xl sm:p-5 ${className}`}
      style={{
        backgroundColor: 'var(--theme-card-bg-90)',
        borderColor: 'var(--theme-card-border)',
      }}
    >
      <div className="mb-3 flex items-center gap-2.5 sm:mb-4">
        <span
          className="flex h-8 w-8 items-center justify-center rounded-xl"
          style={{
            backgroundColor: 'var(--theme-primary-100)',
            color: 'var(--theme-primary-600)',
          }}
          aria-hidden
        >
          <Icon icon={icon} className="h-4 w-4" />
        </span>
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 sm:text-base">
          {title}
        </h2>
      </div>
      {children}
    </section>
  )
}

function CompactMetric({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div
      className="min-w-0 rounded-xl border p-2.5 sm:rounded-2xl sm:p-4"
      style={{
        backgroundColor: 'var(--theme-card-bg)',
        borderColor: 'var(--theme-card-border)',
      }}
    >
      <div className="flex items-center gap-1.5 text-[10px] text-gray-500 dark:text-gray-400 sm:text-xs">
        <Icon icon={icon} className="h-3.5 w-3.5 shrink-0 text-[var(--theme-primary-500)]" aria-hidden />
        <span className="truncate">{label}</span>
      </div>
      <p className="mt-2 truncate text-base font-bold tabular-nums text-gray-900 dark:text-gray-100 sm:text-xl">
        {value}
      </p>
    </div>
  )
}

function EmptyState({ message, prominent = false }: { message: string; prominent?: boolean }) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border text-center ${prominent ? 'min-h-52 p-8' : 'min-h-28 p-5'}`}
      style={{
        backgroundColor: 'var(--theme-card-bg-90)',
        borderColor: 'var(--theme-card-border)',
      }}
    >
      <Icon icon="mdi:chart-box-outline" className="mb-2 h-7 w-7 text-[var(--theme-primary-400)]" aria-hidden />
      <p className="text-xs text-gray-500 dark:text-gray-400 sm:text-sm">{message}</p>
    </div>
  )
}

function TopPagesList({
  pages,
  formatVisits,
}: {
  pages: SiteStats['top_pages']
  formatVisits: (count: number) => string
}) {
  const maxVisits = Math.max(1, ...pages.map(getPageVisits))

  return (
    <ol className="grid grid-cols-1 gap-2 md:grid-cols-2">
      {pages.map((page, index) => {
        const pageDisplay = getPageDisplay(page)
        const visits = getPageVisits(page)
        const progress = visits > 0 ? Math.max(8, (visits / maxVisits) * 100) : 0

        return (
          <li
            key={`${pageDisplay}-${index}`}
            className="group min-w-0 rounded-xl border px-3 py-3 transition-colors hover:border-[var(--theme-primary-300)] hover:bg-[var(--theme-primary-50)] sm:rounded-2xl sm:px-4"
            style={{ borderColor: 'var(--theme-card-border)' }}
          >
            <div className="flex min-w-0 items-center gap-3">
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold tabular-nums"
                style={{
                  backgroundColor: index < 3
                    ? 'var(--theme-primary-500)'
                    : 'var(--theme-primary-100)',
                  color: index < 3 ? 'white' : 'var(--theme-primary-700)',
                }}
              >
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="min-w-0 flex-1 truncate text-xs font-medium text-gray-700 dark:text-gray-200 sm:text-sm">
                {pageDisplay}
              </span>
              {visits > 0 && (
                <span className="shrink-0 text-[10px] tabular-nums text-gray-400 dark:text-gray-500 sm:text-xs">
                  {formatVisits(visits)}
                </span>
              )}
            </div>
            {visits > 0 && (
              <div className="ml-11 mt-2 h-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[var(--theme-primary-400)] to-[var(--theme-primary-600)]"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </li>
        )
      })}
    </ol>
  )
}

function getPageDisplay(page: SiteStats['top_pages'][number]): string {
  if (typeof page === 'string') return page
  return page.url || page.path || JSON.stringify(page)
}

function getPageVisits(page: SiteStats['top_pages'][number]): number {
  return typeof page === 'string' ? 0 : Math.max(0, page.visits || 0)
}
