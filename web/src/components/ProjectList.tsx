import Link from 'next/link'
import { Icon } from '@iconify/react'
import { Chip } from '@/components/ui/Chip'
import Image from 'next/image'
import { getImageUrl, shouldUseNativeImg } from '@/lib/image-utils'

export interface LanguageStat {
  language: string
  percentage: number
  bytes_count: number
}

export interface Project {
  id: string
  title: string
  description: string
  status: 'completed' | 'in-progress' | 'planned'
  techStack: string[]
  projectUrl?: string
  githubUrl?: string
  category: 'web' | 'mobile' | 'other'
  locale: string
  platform?: string
  starsCount?: number
  forksCount?: number
  owner?: string
  repositoryName?: string
  avatarUrl?: string
  imageUrl?: string
  tag?: string
  createdAt?: string
  updatedAt?: string | null
  languageStats?: {
    languages: LanguageStat[]
    total_languages: number
    dominant_language: string | null
  }
}

interface ProjectListProps {
  projects: Project[]
  compact?: boolean
  stats: {
    total: number
    completed: number
    inProgress: number
    techStackCount: number
  }
  statsLabels: {
    total: string
    completed: string
    inProgress: string
    techStack: string
  }
  statusLabels: {
    completed: string
    inProgress: string
    planned: string
  }
  buttonLabels: {
    visitProject: string
  }
  sectionLabels: {
    featured: string
    allProjects: string
    techStack: string
  }
  cardLabels: {
    created: string
    updated: string
    dominantLanguage: string
  }
}

const statusPriority: Record<Project['status'], number> = {
  completed: 0,
  'in-progress': 1,
  planned: 2,
}

const projectTones = [
  { glow: 'var(--theme-primary-400)', icon: 'var(--theme-primary-600)', number: 'var(--theme-primary-500)' },
  { glow: 'var(--theme-secondary)', icon: 'var(--theme-secondary)', number: 'var(--theme-secondary)' },
  { glow: 'var(--theme-primary-300)', icon: 'var(--theme-primary-500)', number: 'var(--theme-primary-400)' },
  {
    glow: 'color-mix(in srgb, var(--theme-primary-400) 55%, var(--theme-secondary))',
    icon: 'color-mix(in srgb, var(--theme-primary-600) 65%, var(--theme-secondary))',
    number: 'color-mix(in srgb, var(--theme-primary-500) 55%, var(--theme-secondary))',
  },
] as const

export default function ProjectList({
  projects,
  compact = false,
  stats,
  statsLabels,
  statusLabels,
  buttonLabels,
  sectionLabels,
  cardLabels,
}: ProjectListProps) {
  const sortedProjects = [...projects].sort((a, b) => {
    const statusDifference = statusPriority[a.status] - statusPriority[b.status]
    if (statusDifference !== 0) return statusDifference

    const aTime = Date.parse(a.updatedAt || a.createdAt || '') || 0
    const bTime = Date.parse(b.updatedAt || b.createdAt || '') || 0
    return bTime - aTime
  })

  const featuredIds = new Set(
    sortedProjects
      .filter((project) => project.status === 'completed')
      .slice(0, 2)
      .map((project) => project.id)
  )

  const technologyUsage = Array.from(
    projects.reduce((usage, project) => {
      new Set(project.techStack.filter(Boolean)).forEach((technology) => {
        usage.set(technology, (usage.get(technology) || 0) + 1)
      })
      return usage
    }, new Map<string, number>())
  ).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))

  const metricData = [
    {
      label: statsLabels.completed,
      value: stats.completed,
      icon: 'mdi:check-circle-outline',
      color: 'bg-emerald-400',
      text: 'text-emerald-600 dark:text-emerald-300',
    },
    {
      label: statsLabels.inProgress,
      value: stats.inProgress,
      icon: 'mdi:progress-wrench',
      color: 'bg-amber-400',
      text: 'text-amber-600 dark:text-amber-300',
    },
    {
      label: statusLabels.planned,
      value: Math.max(0, stats.total - stats.completed - stats.inProgress),
      icon: 'mdi:calendar-clock-outline',
      color: 'bg-violet-400',
      text: 'text-violet-600 dark:text-violet-300',
    },
  ]

  return (
    <div className="space-y-3 sm:space-y-5">
      {!compact && <section className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_260px] sm:gap-4">
        <article
          className="relative overflow-hidden rounded-2xl border p-4 shadow-sm sm:rounded-3xl sm:p-6"
          style={{
            backgroundColor: 'var(--theme-card-bg-90)',
            borderColor: 'var(--theme-card-border)',
          }}
        >
          <div className="pointer-events-none absolute -left-20 -top-24 h-52 w-52 rounded-full bg-[var(--theme-primary-300)] opacity-15 dark:opacity-[0.03] blur-3xl" aria-hidden />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-8">
            <div className="flex shrink-0 items-center gap-3 sm:block sm:min-w-32">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--theme-primary-500)] to-[var(--theme-secondary)] text-white shadow-sm sm:mb-3" aria-hidden>
                <Icon icon="mdi:folder-multiple-outline" className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400 dark:text-gray-400 sm:text-xs">
                  {statsLabels.total}
                </p>
                <p className="mt-0.5 text-3xl font-black tabular-nums tracking-tight text-gray-900 dark:text-gray-100 sm:text-5xl">
                  {String(stats.total).padStart(2, '0')}
                </p>
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="mb-3 flex h-2.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                {metricData.map((metric) => (
                  metric.value > 0 && (
                    <span
                      key={metric.label}
                      className={`${metric.color} first:rounded-l-full last:rounded-r-full`}
                      style={{ width: `${stats.total > 0 ? (metric.value / stats.total) * 100 : 0}%` }}
                      title={`${metric.label}: ${metric.value}`}
                    />
                  )
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {metricData.map((metric) => (
                  <div key={metric.label} className="min-w-0 rounded-xl border px-2.5 py-2.5 sm:rounded-2xl sm:px-3" style={{ borderColor: 'var(--theme-card-border)' }}>
                    <div className={`flex items-center gap-1.5 ${metric.text}`}>
                      <Icon icon={metric.icon} className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      <span className="truncate text-[10px] font-medium sm:text-xs">{metric.label}</span>
                    </div>
                    <p className="mt-1 text-lg font-bold tabular-nums text-gray-900 dark:text-gray-100 sm:text-xl">
                      {metric.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </article>

        <article
          className="group relative min-h-36 overflow-hidden rounded-2xl border p-5 shadow-sm sm:rounded-3xl"
          style={{
            background: 'linear-gradient(145deg, color-mix(in srgb, var(--theme-primary-500) 12%, var(--theme-card-bg)), var(--theme-card-bg))',
            borderColor: 'var(--theme-primary-200)',
          }}
        >
          <Icon icon="mdi:code-braces" className="pointer-events-none absolute -bottom-7 -right-5 h-32 w-32 rotate-12 text-[var(--theme-primary-500)] opacity-[0.08] transition-transform duration-500 group-hover:rotate-6" aria-hidden />
          <div className="relative flex h-full flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{statsLabels.techStack}</span>
              <Icon icon="mdi:code-tags" className="h-5 w-5 text-[var(--theme-primary-500)]" aria-hidden />
            </div>
            <p className="mt-5 text-4xl font-black tabular-nums tracking-tight text-[var(--theme-primary-700)] dark:text-[var(--theme-primary-300)]">
              {String(stats.techStackCount).padStart(2, '0')}
            </p>
          </div>
        </article>
      </section>}

      <section
        className={`relative overflow-hidden rounded-2xl border shadow-sm ${compact ? 'p-2.5 sm:p-3.5' : 'p-2.5 sm:rounded-3xl sm:p-5'}`}
        style={{
          background: 'linear-gradient(145deg, color-mix(in srgb, var(--theme-primary-100) 28%, var(--theme-card-bg-90)), var(--theme-card-bg-90) 42%, color-mix(in srgb, var(--theme-secondary) 4%, var(--theme-card-bg-90)))',
          borderColor: 'var(--theme-primary-100)',
        }}
      >
        <div className="mb-3 flex items-center justify-between gap-3 px-0.5 sm:mb-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
              style={{
                backgroundColor: 'var(--theme-primary-100)',
                color: 'var(--theme-primary-600)',
              }}
              aria-hidden
            >
              <Icon icon="mdi:view-grid-outline" className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100 sm:text-base">
                {sectionLabels.allProjects}
              </h2>
              <p className="mt-0.5 text-[10px] text-gray-400 dark:text-gray-400 sm:text-xs">
                {stats.total} {statsLabels.total}
              </p>
            </div>
          </div>
          <span
            className="rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums"
            style={{
              backgroundColor: 'var(--theme-primary-100)',
              color: 'var(--theme-primary-700)',
            }}
          >
            {String(stats.total).padStart(2, '0')}
          </span>
        </div>

        {sortedProjects.length > 0 ? (
          <div className={`grid grid-cols-1 gap-2.5 md:grid-cols-2 ${compact ? 'sm:gap-3' : 'xl:grid-cols-3 sm:gap-4'}`}>
            {sortedProjects.map((project, index) => (
              <ProjectCard
                key={project.id}
                project={project}
                index={index}
                featured={featuredIds.has(project.id)}
                featuredLabel={sectionLabels.featured}
                statusLabels={statusLabels}
                buttonLabels={buttonLabels}
                cardLabels={cardLabels}
                compact={compact}
              />
            ))}
          </div>
        ) : (
          <div className="flex min-h-40 flex-col items-center justify-center rounded-2xl border border-dashed text-center text-gray-400 dark:text-gray-400">
            <Icon icon="mdi:folder-open-outline" className="mb-2 h-8 w-8" aria-hidden />
            <p className="text-sm">{sectionLabels.allProjects}</p>
          </div>
        )}
      </section>

      {!compact && technologyUsage.length > 0 && (
        <section
          className="rounded-2xl border p-3 shadow-sm sm:rounded-3xl sm:p-5"
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
              <Icon icon="mdi:code-tags" className="h-4 w-4" />
            </span>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 sm:text-base">
              {sectionLabels.techStack}
            </h2>
          </div>
          <div className="chip-scroll -mx-0.5 flex gap-1.5 overflow-x-auto px-0.5 pb-0.5 sm:flex-wrap sm:overflow-visible">
            {technologyUsage.map(([technology, count]) => (
              <Chip key={technology} count={count} title={`${technology}: ${count}`}>
                {technology}
              </Chip>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function ProjectCard({
  project,
  index,
  featured,
  featuredLabel,
  statusLabels,
  buttonLabels,
  cardLabels,
  compact,
}: {
  project: Project
  index: number
  featured: boolean
  featuredLabel: string
  statusLabels: { completed: string; inProgress: string; planned: string }
  buttonLabels: { visitProject: string }
  cardLabels: {
    created: string
    updated: string
    dominantLanguage: string
  }
  compact: boolean
}) {
  const platform = project.platform?.toLowerCase()
  const platformIcon = platform === 'github'
    ? 'mdi:github'
    : platform === 'gitee'
      ? 'simple-icons:gitee'
      : 'mdi:source-repository'
  const repositoryPath = [project.owner, project.repositoryName].filter(Boolean).join(' / ')
  const lastDate = project.updatedAt || project.createdAt
  const dateLabel = project.updatedAt ? cardLabels.updated : cardLabels.created
  const statusLabel = project.status === 'in-progress'
    ? statusLabels.inProgress
    : statusLabels[project.status]
  const statusStyle = project.status === 'completed'
    ? {
        backgroundColor: 'var(--theme-primary-100)',
        borderColor: 'var(--theme-primary-200)',
        color: 'var(--theme-primary-700)',
      }
    : project.status === 'in-progress'
      ? {
          backgroundColor: 'color-mix(in srgb, var(--theme-secondary) 10%, var(--theme-card-bg))',
          borderColor: 'color-mix(in srgb, var(--theme-secondary) 28%, transparent)',
          color: 'var(--theme-secondary)',
        }
      : {
          backgroundColor: 'color-mix(in srgb, var(--theme-primary-300) 16%, var(--theme-card-bg))',
          borderColor: 'var(--theme-primary-100)',
          color: 'var(--theme-primary-600)',
        }
  const tone = projectTones[index % projectTones.length]

  // 处理项目图片 URL
  const projectImage = project.imageUrl ? getImageUrl(project.imageUrl) : null
  const useNativeImg = projectImage ? shouldUseNativeImg(projectImage) : false
  const hasImage = !!projectImage

  return (
    <article
      className={`group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:border-[var(--theme-primary-300)] hover:shadow-xl ${compact ? `min-h-[220px] ${featured ? 'md:col-span-2 sm:min-h-[250px]' : 'sm:min-h-[238px]'}` : `min-h-[260px] ${featured ? 'md:col-span-2 sm:min-h-[340px] xl:col-span-2' : 'sm:min-h-[292px]'}`}`}
      style={{
        background: featured
          ? 'linear-gradient(145deg, color-mix(in srgb, var(--theme-primary-100) 46%, var(--theme-card-bg)), color-mix(in srgb, var(--theme-secondary) 7%, var(--theme-card-bg)) 58%, var(--theme-card-bg))'
          : 'linear-gradient(145deg, color-mix(in srgb, var(--theme-primary-50) 48%, var(--theme-card-bg)), var(--theme-card-bg) 68%)',
        borderColor: 'var(--theme-primary-200)',
      }}
    >
      {/* 顶部渐变条 */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-0.5 z-10"
        style={{ background: `linear-gradient(to right, ${tone.icon}, var(--theme-secondary), transparent)` }}
        aria-hidden
      />

      {/* 图片区域 - Featured 或普通卡片 */}
      {hasImage && (
        <div className={`relative w-full overflow-hidden ${featured ? 'h-40 sm:h-52' : 'h-32 sm:h-40'}`}>
          {useNativeImg ? (
            <img
              src={projectImage!}
              alt={project.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
          ) : (
            <Image
              src={projectImage!}
              alt={project.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              sizes={featured ? '(max-width: 768px) 100vw, 50vw' : '(max-width: 768px) 100vw, 33vw'}
            />
          )}
          {/* 图片底部渐变遮罩 */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[var(--theme-card-bg)] to-transparent" />
          {/* 状态标签 - 图片左上角 */}
          <span
            className="absolute left-3 top-3 inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-medium backdrop-blur-sm sm:text-[11px]"
            style={{
              ...statusStyle,
              backgroundColor: statusStyle.backgroundColor.replace(')', ', 0.9)'),
            }}
          >
            {statusLabel}
          </span>
          {/* Featured 标签 */}
          {featured && (
            <span className="absolute right-3 top-3 rounded-full bg-[var(--theme-primary-500)] px-2.5 py-1 text-[10px] font-semibold text-white shadow-sm backdrop-blur-sm sm:text-[11px]">
              {featuredLabel}
            </span>
          )}
        </div>
      )}

      {/* 内容区域 */}
      <div className={`relative flex flex-col flex-1 ${compact ? `p-3.5 ${featured ? 'sm:p-5' : ''}` : `p-4 sm:p-5 ${featured ? 'xl:p-7' : ''}`}`}>
        {/* 装饰性背景元素 */}
        <div
          className={`pointer-events-none absolute -right-14 -top-14 rounded-full opacity-[0.14] dark:opacity-[0.03] blur-3xl transition-transform duration-500 group-hover:scale-125 ${featured ? 'h-64 w-64' : 'h-40 w-40'}`}
          style={{ backgroundColor: tone.glow }}
          aria-hidden
        />
        <span
          className={`pointer-events-none absolute -bottom-7 -right-1 select-none font-black leading-none tracking-tighter opacity-[0.08] ${featured ? 'text-[10rem] sm:text-[13rem]' : 'text-[8rem]'}`}
          style={{ color: tone.number }}
          aria-hidden
        >
          {String(index + 1).padStart(2, '0')}
        </span>

        {/* 平台图标和仓库路径 */}
        <div className="relative flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border shadow-sm ${featured ? 'sm:h-10 sm:w-10' : ''}`}
              style={{
                backgroundColor: 'color-mix(in srgb, var(--theme-card-bg) 68%, var(--theme-primary-100))',
                borderColor: 'var(--theme-primary-100)',
                color: tone.icon,
              }}
              aria-hidden
            >
              <Icon icon={platformIcon} className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400 dark:text-gray-400 sm:text-[11px]">
                {platform || project.category}
              </p>
              {repositoryPath && (
                <p className="mt-0.5 truncate text-[11px] text-gray-500 dark:text-gray-400" title={repositoryPath}>
                  {repositoryPath}
                </p>
              )}
            </div>
          </div>
          {/* 如果没有图片，状态标签放这里 */}
          {!hasImage && (
            <span
              className="inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-[10px] font-medium sm:text-[11px]"
              style={statusStyle}
            >
              {statusLabel}
            </span>
          )}
        </div>

        {/* 标题 */}
        <div className={`relative flex items-center gap-2 ${featured ? 'mt-4 sm:mt-5' : 'mt-3'}`}>
          <h3 className={`min-w-0 flex-1 line-clamp-1 font-bold tracking-tight text-gray-900 dark:text-gray-100 ${featured ? (compact ? 'text-lg sm:text-xl' : 'text-lg sm:text-2xl xl:text-3xl') : 'text-base sm:text-lg'}`} title={project.title}>
            {project.title}
          </h3>
          {!hasImage && featured && (
            <span className="shrink-0 rounded-full bg-[var(--theme-primary-100)] px-2 py-0.5 text-[9px] font-semibold text-[var(--theme-primary-700)] sm:text-[10px]">
              {featuredLabel}
            </span>
          )}
        </div>

        {/* 描述 */}
        <p className={`relative mt-2 line-clamp-2 text-xs leading-5 text-gray-500 dark:text-gray-400 sm:text-sm ${featured ? 'max-w-2xl sm:mt-2.5 sm:text-base sm:leading-6' : 'sm:leading-5'}`}>
          {project.description || repositoryPath || project.title}
        </p>

        {/* 技术栈 */}
        {project.techStack.length > 0 && (
          <div className={`relative flex min-h-6 flex-wrap gap-1.5 overflow-hidden ${featured ? 'mt-4' : 'mt-3'}`}>
            {project.techStack.slice(0, featured ? 6 : 4).map((technology) => (
              <Chip key={technology}>{technology}</Chip>
            ))}
            {project.techStack.length > (featured ? 6 : 4) && (
              <Chip>+{project.techStack.length - (featured ? 6 : 4)}</Chip>
            )}
          </div>
        )}

        {/* 底部信息 */}
        <div className={`relative mt-auto ${featured ? 'pt-4' : 'pt-3'}`}>
          <div className="flex items-center justify-between gap-3 text-[10px] text-gray-400 dark:text-gray-400 sm:text-xs">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1" title="Stars">
                <Icon icon="mdi:star-outline" className="h-3.5 w-3.5" aria-hidden />
                {project.starsCount || 0}
              </span>
              <span className="inline-flex items-center gap-1" title="Forks">
                <Icon icon="mdi:source-fork" className="h-3.5 w-3.5" aria-hidden />
                {project.forksCount || 0}
              </span>
              {project.languageStats?.dominant_language && (
                <span className="hidden max-w-20 items-center gap-1 truncate sm:inline-flex" title={`${cardLabels.dominantLanguage}: ${project.languageStats.dominant_language}`}>
                  <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--theme-primary-400)]" />
                  {project.languageStats.dominant_language}
                </span>
              )}
            </div>
            {lastDate && (
              <span className="shrink-0" title={dateLabel}>
                {formatDate(lastDate)}
              </span>
            )}
          </div>

          {project.projectUrl && (
            <Link
              href={project.projectUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`mt-3 flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold text-[var(--theme-primary-700)] transition-all hover:bg-[var(--theme-primary-50)] dark:text-[var(--theme-primary-300)] sm:text-sm ${featured ? 'w-full sm:w-52' : 'w-full'}`}
              style={{
                backgroundColor: 'color-mix(in srgb, var(--theme-primary-100) 55%, transparent)',
              }}
            >
              <span className="inline-flex items-center gap-1.5">
                <Icon icon={platformIcon} className="h-4 w-4" aria-hidden />
                {buttonLabels.visitProject}
              </span>
              <Icon icon="mdi:arrow-top-right" className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
            </Link>
          )}
        </div>
      </div>
    </article>
  )
}

function formatDate(value: string) {
  const timestamp = Date.parse(value)
  if (Number.isNaN(timestamp)) return value

  const date = new Date(timestamp)
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
