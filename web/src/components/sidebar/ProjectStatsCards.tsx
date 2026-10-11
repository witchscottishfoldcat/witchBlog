import { Icon } from '@iconify/react'
import { SidebarCard } from '@/components/Sidebar'
import type { Project } from '@/components/ProjectList'

type CountItem = { label: string; count: number }
type LanguageCoverageItem = CountItem & { percentage?: number }

export function ProjectSummaryCard({
  total,
  languageCount,
  totalLabel,
  languageLabel,
}: {
  total: number
  languageCount: number
  totalLabel: string
  languageLabel: string
}) {
  return (
    <SidebarCard>
      <div className="grid grid-cols-2 gap-2">
        <Metric icon="mdi:folder-multiple-outline" value={total} label={totalLabel} />
        <Metric icon="mdi:code-braces" value={languageCount} label={languageLabel} />
      </div>
    </SidebarCard>
  )
}

export function ProjectStatusCard({
  title,
  total,
  completed,
  inProgress,
  planned,
  labels,
}: {
  title: string
  total: number
  completed: number
  inProgress: number
  planned: number
  labels: { completed: string; inProgress: string; planned: string }
}) {
  const items = [
    { label: labels.completed, value: completed, icon: 'mdi:check-circle-outline', color: 'var(--theme-primary-600)' },
    { label: labels.inProgress, value: inProgress, icon: 'mdi:progress-wrench', color: 'var(--theme-primary-300)' },
    { label: labels.planned, value: planned, icon: 'mdi:calendar-clock-outline', color: 'var(--theme-secondary)' },
  ]
  return (
    <SidebarCard title={title}>
      <div className="mb-4 flex h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
        {items.filter((item) => item.value > 0).map((item) => (
          <span key={item.label} style={{ width: `${total ? item.value / total * 100 : 0}%`, backgroundColor: item.color }} />
        ))}
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between rounded-xl border border-[var(--theme-card-border)] px-3 py-2.5">
            <span className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
              <Icon icon={item.icon} className="h-4 w-4" style={{ color: item.color }} aria-hidden />
              {item.label}
            </span>
            <span className="text-sm font-bold tabular-nums text-gray-800 dark:text-gray-100">{item.value}</span>
          </div>
        ))}
      </div>
    </SidebarCard>
  )
}

export function ProjectLanguageCard({ title, items }: { title: string; items: CountItem[] }) {
  return <DistributionCard title={title} items={items} limit={8} />
}

export function ProjectLanguageCoverageCard({
  title,
  countLabel,
  items,
}: {
  title: string
  countLabel: string
  items: LanguageCoverageItem[]
}) {
  const displayed = items.slice(0, 10)
  const totalProjects = displayed.reduce((sum, item) => sum + item.count, 0)

  if (displayed.length === 0) return null

  return (
    <SidebarCard title={title}>
      <div
        className="mb-4 flex h-2.5 w-full overflow-hidden rounded-full bg-[var(--theme-primary-50)] ring-1 ring-[var(--theme-primary-100)]"
        role="img"
        aria-label={displayed.map((item) => `${item.label} ${countLabel} ${item.count}`).join(', ')}
      >
        {displayed.map((item, index) => (
          <span
            key={item.label}
            className="h-full first:rounded-l-full last:rounded-r-full"
            style={{
              width: `${percentageOf(item.count, totalProjects)}%`,
              backgroundColor: distributionColors[index % distributionColors.length],
            }}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
        {displayed.map((item, index) => (
          <div key={item.label} className="min-w-0 text-[10px] leading-4">
            <div className="flex min-w-0 items-center gap-1.5">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: distributionColors[index % distributionColors.length] }}
                aria-hidden
              />
              <span className="truncate font-medium text-gray-700 dark:text-gray-200" title={item.label}>
                {item.label}
              </span>
              {item.percentage !== undefined && (
                <strong className="ml-auto shrink-0 font-normal tabular-nums text-gray-500 dark:text-gray-400">
                  {item.percentage.toFixed(1)}%
                </strong>
              )}
            </div>
            <p className="pl-3.5 text-[8px] text-gray-400">
              {countLabel} {item.count}
            </p>
          </div>
        ))}
      </div>
    </SidebarCard>
  )
}

export function ProjectSourceCard({ title, platforms, tags }: { title: string; platforms: CountItem[]; tags: CountItem[] }) {
  return (
    <SidebarCard title={title}>
      {platforms.length > 0 && (
        <div className="mb-3 grid grid-cols-2 gap-2">
          {platforms.map((item) => (
            <div key={item.label} className="flex items-center justify-between rounded-xl bg-[var(--theme-primary-50)] px-3 py-2.5">
              <span className="flex min-w-0 items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
                <Icon icon={platformIcon(item.label)} className="h-4 w-4 shrink-0 text-[var(--theme-primary-500)]" aria-hidden />
                <span className="truncate">{item.label}</span>
              </span>
              <span className="font-bold tabular-nums text-gray-800 dark:text-gray-100">{item.count}</span>
            </div>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-1.5">
        {tags.slice(0, 16).map((item) => (
          <span key={item.label} className="inline-flex items-center gap-1 rounded-full border border-[var(--theme-primary-100)] bg-[var(--theme-primary-50)] px-2.5 py-1 text-[10px] text-[var(--theme-primary-700)]">
            #{item.label}
            <span className="opacity-60">{item.count}</span>
          </span>
        ))}
      </div>
    </SidebarCard>
  )
}

export function buildProjectSidebarStats(projects: Project[]) {
  const platforms = countValues(projects.map((project) => project.platform || project.category).filter(Boolean))
  const tags = countValues(projects.flatMap(buildRelatedTags))
  const languages = sumLanguageBytes(projects)
  const languageProjects = countLanguageProjects(projects)
  return { platforms, tags, languages, languageProjects }
}

const distributionColors = [
  'var(--theme-primary-600)',
  'var(--theme-secondary)',
  'var(--theme-primary-400)',
  'color-mix(in srgb, var(--theme-secondary) 65%, white)',
  'var(--theme-primary-700)',
  'color-mix(in srgb, var(--theme-primary-300) 70%, var(--theme-secondary))',
  'var(--theme-primary-300)',
  'color-mix(in srgb, var(--theme-secondary) 40%, var(--theme-primary-500))',
]

function DistributionCard({ title, items, limit }: { title: string; items: CountItem[]; limit: number }) {
  const displayed = items.slice(0, limit)
  const total = items.reduce((sum, item) => sum + item.count, 0)
  const displayedTotal = displayed.reduce((sum, item) => sum + item.count, 0)
  const remaining = Math.max(total - displayedTotal, 0)

  if (displayed.length === 0) return null

  return (
    <SidebarCard title={title}>
      <div
        className="mb-4 flex h-2.5 w-full overflow-hidden rounded-full bg-gray-100 ring-1 ring-black/5 dark:bg-gray-800 dark:ring-white/10"
        role="img"
        aria-label={displayed.map((item) => `${item.label} ${formatPercentage(item.count, total)}`).join(', ')}
      >
        {displayed.map((item, index) => (
          <span
            key={item.label}
            className="h-full first:rounded-l-full last:rounded-r-full"
            style={{
              width: `${percentageOf(item.count, total)}%`,
              backgroundColor: distributionColors[index % distributionColors.length],
            }}
          />
        ))}
        {remaining > 0 && (
          <span
            className="h-full rounded-r-full bg-[var(--theme-primary-100)]"
            style={{ width: `${percentageOf(remaining, total)}%` }}
          />
        )}
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-2">
        {displayed.map((item, index) => (
          <div key={item.label} className="flex min-w-0 items-center gap-1.5 text-[10px] leading-4">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: distributionColors[index % distributionColors.length] }}
              aria-hidden
            />
            <span className="truncate font-medium text-gray-700 dark:text-gray-200" title={item.label}>
              {item.label}
            </span>
            <span className="ml-auto shrink-0 tabular-nums text-gray-500 dark:text-gray-400">
              {formatPercentage(item.count, total)}
            </span>
          </div>
        ))}
      </div>
    </SidebarCard>
  )
}

function Metric({ icon, value, label }: { icon: string; value: number; label: string }) {
  return (
    <div className="min-w-0 rounded-xl bg-[var(--theme-primary-50)] px-2 py-3 text-center">
      <Icon icon={icon} className="mx-auto h-4 w-4 text-[var(--theme-primary-500)]" aria-hidden />
      <p className="mt-1 text-xl font-bold tabular-nums text-gray-800 dark:text-gray-100">{value}</p>
      <p className="mt-0.5 truncate text-[9px] text-gray-500 dark:text-gray-400" title={label}>{label}</p>
    </div>
  )
}

function countValues(values: string[]): CountItem[] {
  const counts = new Map<string, number>()
  values.forEach((value) => counts.set(value, (counts.get(value) || 0) + 1))
  return Array.from(counts, ([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
}

function buildRelatedTags(project: Project): string[] {
  const tags = project.tag ? [project.tag] : []
  const searchableText = [project.title, project.repositoryName, project.description]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  const keywordTags: Array<{ pattern: RegExp; label: string }> = [
    { pattern: /spring[\s-]?boot|sringboot/, label: 'Spring Boot' },
    { pattern: /framework|framrwork|foundation/, label: 'Framework' },
    { pattern: /rbac/, label: 'RBAC' },
    { pattern: /(?:^|[^a-z])bot(?:[^a-z]|$)|robot|机器人/, label: 'Bot' },
    { pattern: /terminal|终端/, label: 'Terminal' },
    { pattern: /pixel|像素/, label: 'Pixel Art' },
  ]

  keywordTags.forEach(({ pattern, label }) => {
    if (pattern.test(searchableText)) tags.push(label)
  })

  return Array.from(new Set(tags))
}

function sumLanguageBytes(projects: Project[]): CountItem[] {
  const totals = new Map<string, number>()
  projects.forEach((project) => {
    project.languageStats?.languages.forEach((language) => {
      const value = Number.isFinite(language.bytes_count) && language.bytes_count > 0 ? language.bytes_count : 0
      totals.set(language.language, (totals.get(language.language) || 0) + value)
    })
  })

  if (Array.from(totals.values()).some((value) => value > 0)) {
    return Array.from(totals, ([label, count]) => ({ label, count }))
      .filter((item) => item.count > 0)
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
  }

  return countValues(projects.flatMap((project) => project.languageStats?.languages.map((language) => language.language) || []))
}

function countLanguageProjects(projects: Project[]): CountItem[] {
  const languagesByProject = projects.flatMap((project) => {
    const languages = project.languageStats?.languages.map((language) => language.language) || project.techStack
    return Array.from(new Set(languages.filter(Boolean)))
  })
  return countValues(languagesByProject)
}

function percentageOf(value: number, total: number) {
  return total > 0 ? value / total * 100 : 0
}

function formatPercentage(value: number, total: number) {
  const percentage = percentageOf(value, total)
  if (percentage > 0 && percentage < 0.1) return '<0.1%'
  return `${percentage.toFixed(1)}%`
}

function platformIcon(platform: string) {
  const normalized = platform.toLowerCase()
  if (normalized === 'github') return 'mdi:github'
  if (normalized === 'gitee') return 'simple-icons:gitee'
  return 'mdi:source-repository'
}
