import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { getTimelines, convertApiTimelineToTimelineEntry } from '@/lib/api'
import { SidebarCard } from '@/components/Sidebar'
import { NAV_ROUTES } from '@/constants'
import { sidebarLinkClass, sidebarChipLinkClass } from './styles'

interface TimelineTypeNavProps {
  locale: string
}

export default async function TimelineTypeNav({ locale }: TimelineTypeNavProps) {
  const [t, timelineT] = await Promise.all([
    getTranslations('sidebar'),
    getTranslations('timeline'),
  ])
  const response = await getTimelines({ skip: 0, limit: 100, public_only: true })
  const entries = response.timelines.map((item) => convertApiTimelineToTimelineEntry(item, locale))

  const typeCounts = {
    work: entries.filter((e) => e.type === 'work').length,
    project: entries.filter((e) => e.type === 'project').length,
    education: entries.filter((e) => e.type === 'education').length,
    achievement: entries.filter((e) => e.type === 'achievement').length,
  }

  const types = (['work', 'project', 'education', 'achievement'] as const).filter(
    (type) => typeCounts[type] > 0
  )

  const tagCounts = new Map<string, number>()
  for (const entry of entries) {
    for (const tag of entry.tags) {
      const trimmed = tag.trim()
      if (trimmed) tagCounts.set(trimmed, (tagCounts.get(trimmed) || 0) + 1)
    }
  }
  const tags = [...tagCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)

  if (types.length === 0 && tags.length === 0) return null

  return (
    <SidebarCard title={t('timelineOverview')}>
      <div className="space-y-4">
        {types.length > 0 && (
          <div className="space-y-1">
            {types.map((type) => (
              <Link
                key={type}
                href={`${NAV_ROUTES.timeline(locale)}?type=${type}`}
                className={sidebarLinkClass}
              >
                <span>{timelineT(`types.${type}`)}</span>
                <span
                  className="rounded-full px-2 py-0.5 text-xs"
                  style={{ backgroundColor: 'var(--theme-card-bg-80)', color: 'var(--theme-primary-500)' }}
                >
                  {typeCounts[type]}
                </span>
              </Link>
            ))}
          </div>
        )}
        {tags.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">{timelineT('tags')}</p>
            <div className="flex flex-wrap gap-2">
              {tags.map(([tag, count]) => (
                <Link
                  key={tag}
                  href={`${NAV_ROUTES.timeline(locale)}?tags=${encodeURIComponent(tag)}`}
                  className={sidebarChipLinkClass}
                >
                  #{tag}
                  <span className="ml-1 text-xs text-gray-400">({count})</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </SidebarCard>
  )
}
