import { getTranslations } from 'next-intl/server'
import { getSiteStats } from '@/lib/api'
import { SidebarCard } from '@/components/Sidebar'
import { sidebarLinkClass } from './styles'

export default async function DashboardQuickStats() {
  const [t, dashboardT] = await Promise.all([
    getTranslations('sidebar'),
    getTranslations('dashboard'),
  ])
  const stats = await getSiteStats()
  if (!stats) return null

  const items = [
    { label: dashboardT('uptime'), value: `${stats.uptime_days}d ${stats.uptime_hours}h` },
    { label: dashboardT('totalVisitors'), value: stats.total_visitors.toLocaleString() },
    { label: dashboardT('diaries'), value: stats.diary_count.toLocaleString() },
    { label: dashboardT('photos'), value: stats.photo_count.toLocaleString() },
  ]

  return (
    <SidebarCard title={t('siteOverview')}>
      <div className="space-y-1">
        {items.map((item) => (
          <div key={item.label} className={sidebarLinkClass}>
            <span className="text-xs sm:text-sm">{item.label}</span>
            <span className="text-xs font-medium tabular-nums text-gray-800 dark:text-gray-200">{item.value}</span>
          </div>
        ))}
      </div>
    </SidebarCard>
  )
}
