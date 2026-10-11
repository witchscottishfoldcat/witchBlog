import { Icon } from '@iconify/react'
import { SidebarCard } from '@/components/Sidebar'
import type { Skill } from '@/components/SkillList'

const levelStyles = {
  expert: { color: 'var(--theme-primary-700)', soft: 'var(--theme-primary-100)', score: 100 },
  advanced: { color: 'var(--theme-primary-500)', soft: 'var(--theme-primary-100)', score: 82 },
  intermediate: { color: 'var(--theme-primary-400)', soft: 'var(--theme-primary-50)', score: 62 },
  beginner: { color: 'var(--theme-primary-300)', soft: 'var(--theme-primary-50)', score: 38 },
} as const

const categoryStyles = {
  backend: { icon: 'mdi:server-outline', color: 'hsl(var(--theme-hue) 70% 56%)' },
  frontend: { icon: 'mdi:monitor-dashboard', color: 'hsl(calc(var(--theme-hue) + 65) 68% 56%)' },
  database: { icon: 'mdi:database-outline', color: 'hsl(calc(var(--theme-hue) + 130) 62% 47%)' },
  tools: { icon: 'mdi:tools', color: 'hsl(calc(var(--theme-hue) + 205) 68% 57%)' },
  other: { icon: 'mdi:shape-outline', color: 'hsl(calc(var(--theme-hue) + 275) 64% 58%)' },
} as const

export function SkillsSummaryCard({
  total,
  average,
  totalLabel,
  averageLabel,
}: {
  total: number
  average: number
  totalLabel: string
  averageLabel: string
}) {
  return (
    <SidebarCard>
      <div className="grid grid-cols-2 gap-2">
        <Metric icon="mdi:brain" value={total} label={totalLabel} />
        <Metric icon="mdi:chart-timeline-variant" value={average.toFixed(1)} label={averageLabel} />
      </div>
    </SidebarCard>
  )
}

export function SkillsLevelCard({
  title,
  total,
  stats,
  labels,
}: {
  title: string
  total: number
  stats: Record<Skill['level'], number>
  labels: Record<Skill['level'], string>
}) {
  const levels: Skill['level'][] = ['expert', 'advanced', 'intermediate', 'beginner']
  return (
    <SidebarCard title={title}>
      <div className="space-y-3.5">
        {levels.map((level) => {
          const style = levelStyles[level]
          const percentage = total ? stats[level] / total * 100 : 0
          return (
            <div key={level}>
              <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
                <span className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: style.color }} />
                  {labels[level]}
                </span>
                <span className="font-semibold tabular-nums text-gray-800 dark:text-gray-100">{stats[level]}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full" style={{ backgroundColor: style.soft }}>
                <div className="h-full rounded-full" style={{ width: `${percentage}%`, backgroundColor: style.color }} />
              </div>
            </div>
          )
        })}
      </div>
    </SidebarCard>
  )
}

export function SkillsLearningCard({
  title,
  totalDays,
  totalDaysLabel,
  longestSkill,
  longestExperience,
  longestLabel,
}: {
  title: string
  totalDays: number
  totalDaysLabel: string
  longestSkill: string
  longestExperience: string
  longestLabel: string
}) {
  return (
    <SidebarCard title={title}>
      <div className="space-y-2">
        <DataRow icon="mdi:calendar-check-outline" label={totalDaysLabel} value={totalDays.toLocaleString()} />
        <DataRow icon="mdi:medal-outline" label={longestLabel} value={longestSkill} detail={longestExperience} />
      </div>
    </SidebarCard>
  )
}

export function SkillsCategoryCard({
  title,
  stats,
  labels,
}: {
  title: string
  stats: Record<Skill['category'], number>
  labels: Record<Skill['category'], string>
}) {
  const categories: Skill['category'][] = ['backend', 'frontend', 'database', 'tools', 'other']
  return (
    <SidebarCard title={title}>
      <div className="space-y-2">
        {categories.filter((category) => stats[category] > 0).map((category) => {
          const style = categoryStyles[category]
          return (
            <div
              key={category}
              className="flex items-center justify-between rounded-xl border px-3 py-2.5"
              style={{
                backgroundColor: `color-mix(in srgb, ${style.color} 8%, var(--theme-card-bg))`,
                borderColor: `color-mix(in srgb, ${style.color} 25%, var(--theme-card-border))`,
              }}
            >
              <span className="flex min-w-0 items-center gap-2.5 text-gray-700 dark:text-gray-200">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `color-mix(in srgb, ${style.color} 15%, transparent)`, color: style.color }}>
                  <Icon icon={style.icon} className="h-4 w-4" aria-hidden />
                </span>
                <span className="truncate text-xs font-medium">{labels[category]}</span>
              </span>
              <span className="text-sm font-bold tabular-nums" style={{ color: style.color }}>{stats[category]}</span>
            </div>
          )
        })}
      </div>
    </SidebarCard>
  )
}

export function SkillsProjectCard({
  title,
  projectLinks,
  projectLinksLabel,
  coveredSkills,
  totalSkills,
  coveredSkillsLabel,
}: {
  title: string
  projectLinks: number
  projectLinksLabel: string
  coveredSkills: number
  totalSkills: number
  coveredSkillsLabel: string
}) {
  const percentage = totalSkills ? Math.round(coveredSkills / totalSkills * 100) : 0
  return (
    <SidebarCard title={title}>
      <div className="flex items-center gap-4">
        <div
          className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full"
          style={{ background: `conic-gradient(var(--theme-primary-500) ${percentage}%, var(--theme-primary-50) 0)` }}
        >
          <div className="flex h-14 w-14 flex-col items-center justify-center rounded-full bg-[var(--theme-card-bg)]">
            <span className="text-base font-bold tabular-nums text-gray-800 dark:text-gray-100">{percentage}%</span>
            <span className="text-[8px] text-gray-400">{coveredSkills}/{totalSkills}</span>
          </div>
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <DataRow icon="mdi:source-repository-multiple" label={projectLinksLabel} value={projectLinks} compact />
          <p className="truncate text-[10px] text-gray-500 dark:text-gray-400">{coveredSkillsLabel}</p>
        </div>
      </div>
    </SidebarCard>
  )
}

function Metric({ icon, value, label }: { icon: string; value: string | number; label: string }) {
  return (
    <div className="min-w-0 rounded-xl bg-[var(--theme-primary-50)] px-2 py-3 text-center">
      <Icon icon={icon} className="mx-auto h-4 w-4 text-[var(--theme-primary-500)]" aria-hidden />
      <p className="mt-1 text-xl font-bold tabular-nums text-gray-800 dark:text-gray-100">{value}</p>
      <p className="mt-0.5 truncate text-[9px] text-gray-500 dark:text-gray-400" title={label}>{label}</p>
    </div>
  )
}

function DataRow({ icon, label, value, detail, compact = false }: { icon: string; label: string; value: string | number; detail?: string; compact?: boolean }) {
  return (
    <div className={`flex min-w-0 items-center gap-2.5 rounded-xl border border-[var(--theme-primary-100)] bg-[var(--theme-primary-50)] ${compact ? 'px-2 py-2' : 'px-3 py-2.5'}`}>
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--theme-primary-100)] text-[var(--theme-primary-600)]">
        <Icon icon={icon} className="h-3.5 w-3.5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[9px] text-gray-500 dark:text-gray-400">{label}</span>
        <span className="mt-0.5 flex items-baseline justify-between gap-2">
          <span className="truncate text-xs font-semibold text-gray-800 dark:text-gray-100">{value}</span>
          {detail && <span className="shrink-0 text-[9px] text-[var(--theme-primary-600)]">{detail}</span>}
        </span>
      </span>
    </div>
  )
}
