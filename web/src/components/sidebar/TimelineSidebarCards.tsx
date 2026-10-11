import { Icon } from '@iconify/react'
import { SidebarCard } from '@/components/Sidebar'
import type { TimelineEntry } from '@/components/TimelineList'

interface TimelineStats {
  total: number
  workExperience: number
  projects: number
  achievements: number
}

interface TimelineStatLabels {
  total: string
  workExperience: string
  projects: string
  achievements: string
}

const statStyles = {
  total: { icon: 'mdi:timeline-outline', color: '#2563eb', background: 'rgba(37, 99, 235, 0.08)' },
  workExperience: { icon: 'mdi:briefcase-outline', color: '#16a34a', background: 'rgba(22, 163, 74, 0.08)' },
  projects: { icon: 'mdi:file-document-outline', color: '#9333ea', background: 'rgba(147, 51, 234, 0.08)' },
  achievements: { icon: 'mdi:trophy-outline', color: '#ea580c', background: 'rgba(234, 88, 12, 0.08)' },
} as const

export function TimelineStatsCard({
  title,
  stats,
  labels,
}: {
  title: string
  stats: TimelineStats
  labels: TimelineStatLabels
}) {
  const items = (Object.keys(statStyles) as Array<keyof TimelineStats>).map((key) => ({
    key,
    value: stats[key],
    label: labels[key],
    ...statStyles[key],
  }))

  return (
    <SidebarCard title={title}>
      <div className="grid grid-cols-2 gap-2">
        {items.map((item) => (
          <div
            key={item.key}
            className="rounded-xl border px-2 py-3 text-center"
            style={{ backgroundColor: item.background, borderColor: `${item.color}33` }}
          >
            <Icon icon={item.icon} className="mx-auto h-4 w-4" style={{ color: item.color }} aria-hidden />
            <p className="mt-1 text-xl font-bold tabular-nums text-gray-800 dark:text-gray-100">{item.value}</p>
            <p className="mt-0.5 truncate text-[9px]" style={{ color: item.color }} title={item.label}>
              {item.label}
            </p>
          </div>
        ))}
      </div>
    </SidebarCard>
  )
}

const typeStyles = {
  work: { icon: 'mdi:briefcase-outline', color: '#16a34a' },
  project: { icon: 'mdi:file-document-outline', color: '#9333ea' },
  education: { icon: 'mdi:school-outline', color: '#2563eb' },
  achievement: { icon: 'mdi:trophy-outline', color: '#ea580c' },
} as const

export function TimelineCurrentStatusCard({
  title,
  entries,
  typeLabels,
  durationLabel,
  locationLabel,
}: {
  title: string
  entries: TimelineEntry[]
  typeLabels: Record<TimelineEntry['type'], string>
  durationLabel: string
  locationLabel: string
}) {
  if (entries.length === 0) return null

  return (
    <SidebarCard title={title}>
      <div className="space-y-2.5">
        {entries.map((entry) => {
          const style = typeStyles[entry.type]
          return (
            <article key={entry.id} className="rounded-xl border border-[var(--theme-card-border)] p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="inline-flex min-w-0 items-center gap-1.5 text-[10px] font-medium" style={{ color: style.color }}>
                  <Icon icon={style.icon} className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  <span className="truncate">{typeLabels[entry.type]}</span>
                </span>
                <time className="shrink-0 text-[9px] tabular-nums text-gray-400">{entry.date}</time>
              </div>
              <h4 className="line-clamp-2 text-sm font-semibold text-gray-800 dark:text-gray-100">{entry.title}</h4>
              {entry.subtitle && (
                <p className="mt-1 text-[10px] text-gray-500 dark:text-gray-400">{entry.subtitle}</p>
              )}
              <p className="mt-2 text-[10px] leading-4 text-gray-600 dark:text-gray-300">{entry.description}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--theme-primary-50)] px-2 py-1 text-[9px] text-gray-600 dark:text-gray-300">
                  <Icon icon="mdi:clock-outline" className="h-3 w-3 shrink-0 text-[var(--theme-primary-500)]" aria-hidden />
                  {durationLabel}: {entry.duration}
                </span>
                {entry.location && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[var(--theme-primary-50)] px-2 py-1 text-[9px] text-gray-600 dark:text-gray-300">
                    <Icon icon="mdi:map-marker-outline" className="h-3 w-3 shrink-0 text-[var(--theme-primary-500)]" aria-hidden />
                    <span className="sr-only">{locationLabel}: </span>
                    {entry.location}
                  </span>
                )}
              </div>
              {entry.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {entry.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-[var(--theme-primary-50)] px-2 py-0.5 text-[9px] text-[var(--theme-primary-600)]"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </article>
          )
        })}
      </div>
    </SidebarCard>
  )
}
