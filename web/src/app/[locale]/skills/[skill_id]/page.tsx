import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { format } from 'date-fns/format'
import Navbar from '@/components/Navbar'
import ArchiveHeroBanner from '@/components/ArchiveHeroBanner'
import PageLayout from '@/components/PageLayout'
import AppSidebarLeft from '@/components/AppSidebarLeft'
import AppSidebarRight from '@/components/AppSidebarRight'
import SkillBackNav from '@/components/sidebar/SkillBackNav'
import { LeftSidebarFallback, RightSidebarFallback } from '@/components/layout/PageSidebarFallback'
import { getSkillById, convertApiProjectToProject } from '@/lib/api'
import { isValidLocale } from '@/i18n'
import { resolveNestedMessage } from '@/lib/i18n-utils'
import type { Messages } from '@/types/messages'
import { logger } from '@/lib/logger'
import MobileBackBar from '@/components/mobile/MobileBackBar'
import { Chip } from '@/components/ui/Chip'
import { getTranslations } from 'next-intl/server'

/**
 * 直接加载翻译文件（不依赖 getRequestConfig）
 */
async function loadMessages(locale: string): Promise<Messages> {
  try {
    const messages = (await import(`@/messages/${locale}.json`)).default;
    return messages as Messages;
  } catch (error) {
    logger.error(`[SkillDetailPage] Failed to load messages for locale: ${locale}`, error);
    // 如果加载失败，尝试加载默认语言
    const defaultMessages = (await import(`@/messages/zh.json`)).default;
    return defaultMessages as Messages;
  }
}

export default async function SkillDetailPage({
  params,
}: {
  params: Promise<{ locale: string; skill_id: string }>
}) {
  const { locale, skill_id } = await params
  
  // 验证 locale 并加载翻译
  const validLocale = isValidLocale(locale) ? locale : 'zh'
  const navT = await getTranslations('nav')
  const messages = await loadMessages(validLocale)
  const skillsMessages = messages.skills
  
  const skillsT = (key: string) => resolveNestedMessage(skillsMessages, key)

  // 尝试将 skill_id 转换为数字 ID
  const skillIdNum = parseInt(skill_id, 10)
  if (isNaN(skillIdNum)) {
    notFound()
  }

  // 从 API 获取技能详情（包含相关项目）
  const apiSkill = await getSkillById(skillIdNum, { include_projects: true })
  if (!apiSkill) {
    notFound()
  }

  // 从技能详情中获取相关项目
  const projects = (apiSkill.related_projects || []).map((p) => convertApiProjectToProject(p, locale))

  // 计算经验值
  const totalMonths = apiSkill.total_learning_days / 30
  const years = Math.floor(totalMonths / 12)
  const months = Math.round(totalMonths % 12)

  // 格式化日期
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), locale === 'zh' ? 'yyyy年MM月dd日' : 'MMM dd, yyyy')
    } catch {
      return dateString
    }
  }

  // 格式化时间段
  const formatPeriod = (period: { start_date: string; end_date: string | null }) => {
    const start = formatDate(period.start_date)
    if (period.end_date) {
      const end = formatDate(period.end_date)
      return `${start} - ${end}`
    }
    return locale === 'zh' ? `${start} - 至今` : `${start} - Present`
  }

  const levelLabels = {
    expert: skillsT('levels.expert'),
    advanced: skillsT('levels.advanced'),
    intermediate: skillsT('levels.intermediate'),
    beginner: skillsT('levels.beginner'),
  }

  const categoryLabels = {
    frontend: skillsT('categories.frontend'),
    backend: skillsT('categories.backend'),
    database: skillsT('categories.database'),
    tools: skillsT('categories.tools'),
    other: skillsT('categories.other'),
  }

  const levelColorMap = {
    expert: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    advanced: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    intermediate: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    beginner: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  }

  const currentLevel = apiSkill.current_level.toLowerCase()
  const levelColor = levelColorMap[currentLevel as keyof typeof levelColorMap] || levelColorMap.beginner

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
          leftSidebar={
            <Suspense fallback={<LeftSidebarFallback />}>
              <AppSidebarLeft locale={locale}>
                <SkillBackNav locale={locale} />
              </AppSidebarLeft>
            </Suspense>
          }
          rightSidebar={
            <Suspense fallback={<RightSidebarFallback />}>
              <AppSidebarRight locale={locale} />
            </Suspense>
          }
          content={
            <div className="max-md:mobile-article-shell">
            <MobileBackBar href={`/${locale}/skills`} label={navT('skills')} />

            <div className="max-md:mobile-page-card rounded-2xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800/50 sm:card-padding">
              <div className="mb-4 flex flex-col gap-2 sm:mb-6 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                <div className="min-w-0">
                  <h1 className="mb-1 line-clamp-2 text-lg font-bold text-gray-900 dark:text-gray-100 sm:mb-2 sm:text-3xl">
                    {apiSkill.name}
                  </h1>
                  {apiSkill.description && (
                    <p className="line-clamp-3 text-xs leading-relaxed text-gray-600 dark:text-gray-400 sm:line-clamp-none sm:text-base">
                      {apiSkill.description}
                    </p>
                  )}
                </div>
                <Chip className="self-start md:hidden">
                  {levelLabels[currentLevel as keyof typeof levelLabels] || levelLabels.beginner}
                </Chip>
                <span className={`hidden flex-shrink-0 self-start rounded-full px-4 py-2 text-sm font-medium md:inline ${levelColor}`}>
                  {levelLabels[currentLevel as keyof typeof levelLabels] || levelLabels.beginner}
                </span>
              </div>

              <div className="chip-scroll mb-4 flex gap-1 overflow-x-auto pb-0.5 md:hidden">
                <Chip>
                  {categoryLabels[apiSkill.category.toLowerCase() as keyof typeof categoryLabels] ||
                    categoryLabels.other}
                </Chip>
                <Chip>
                  {apiSkill.total_learning_days} {skillsT('days')}
                </Chip>
                <Chip>
                  {years > 0 && `${years}${skillsT('year')} `}
                  {months > 0 && `${months}${skillsT('month')}`}
                  {years === 0 && months === 0 && skillsT('lessThanMonth')}
                </Chip>
              </div>

              <div className="mb-6 hidden grid-cols-1 gap-4 md:mb-8 md:grid md:grid-cols-3">
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
                  <div className="mb-1 text-xs text-gray-500 dark:text-gray-400">
                    {skillsT('category')}
                  </div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {categoryLabels[apiSkill.category.toLowerCase() as keyof typeof categoryLabels] ||
                      categoryLabels.other}
                  </div>
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
                  <div className="mb-1 text-xs text-gray-500 dark:text-gray-400">
                    {skillsT('learningDays')}
                  </div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {apiSkill.total_learning_days} {skillsT('days')}
                  </div>
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
                  <div className="mb-1 text-xs text-gray-500 dark:text-gray-400">
                    {skillsT('experience')}
                  </div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {years > 0 && `${years} ${years > 1 ? skillsT('years') : skillsT('year')} `}
                    {months > 0 && `${months} ${months > 1 ? skillsT('months') : skillsT('month')}`}
                    {years === 0 && months === 0 && skillsT('lessThanMonth')}
                  </div>
                </div>
              </div>

              {/* Learning Periods */}
              {apiSkill.periods && apiSkill.periods.length > 0 && (
                <div className="mb-4 sm:mb-6">
                  <h2 className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-100 sm:mb-4 sm:text-xl">
                    {skillsT('learningPeriods')}
                  </h2>
                  <div className="max-md:mobile-feed-list space-y-2 md:space-y-3">
                    {apiSkill.periods.map((period) => (
                      <div
                        key={period.id}
                        className="max-md:mobile-feed-item rounded-lg border border-gray-200 bg-gray-50 p-2.5 dark:border-gray-700 dark:bg-gray-800/50 md:rounded-xl md:p-4"
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {formatPeriod(period)}
                          </div>
                        </div>
                        {period.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">{period.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Related Projects */}
              {projects.length > 0 && (
                <div className="mb-4 mt-4 sm:mb-6 sm:mt-8">
                  <div className="mb-2 flex items-center gap-2 sm:mb-6 sm:gap-3">
                    <div className="hidden h-6 w-1 rounded-full accent-bar-theme sm:block sm:h-8" />
                    <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 sm:text-2xl">
                      {skillsT('relatedProjects')} ({apiSkill.project_count ?? projects.length})
                    </h2>
                  </div>
                  <div className="max-md:mobile-feed-panel max-md:mobile-feed-list grid gap-6 md:grid-cols-2">
                    {projects.map((project) => {
                      // 根据平台显示图标
                      const platform = project.platform?.toLowerCase()
                      const platformIcon = platform === 'github' ? 'github' :
                                          platform === 'gitee' ? 'gitee' : null
                      
                      // 状态颜色
                      const statusColorMap = {
                        completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
                        'in-progress': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
                        planned: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
                      }
                      const statusColor = statusColorMap[project.status] || statusColorMap.planned
                      const statusLabel =
                        project.status === 'completed'
                          ? skillsT('status.completed')
                          : project.status === 'in-progress'
                            ? skillsT('status.inProgress')
                            : skillsT('status.planned')

                      return (
                        <div
                          key={project.id}
                          className="group max-md:mobile-feed-item rounded-xl border p-2.5 transition-all max-md:shadow-none md:rounded-2xl md:p-6 md:hover:-translate-y-1 md:hover:shadow-lg"
                          style={{
                            backgroundColor: 'var(--theme-card-bg)',
                            borderColor: 'var(--theme-card-border)',
                          }}
                        >
                          <div className="mb-2 flex items-start justify-between gap-2 sm:mb-3">
                            <div className="flex min-w-0 flex-1 items-center gap-2">
                              <div className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-pink-400 to-purple-500 text-white sm:flex sm:h-10 sm:w-10 sm:rounded-xl">
                                {platformIcon === 'github' ? (
                                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path fillRule="evenodd" clipRule="evenodd" d="M12 .5a11.5 11.5 0 0 0-3.64 22.42c.58.11.79-.25.79-.56v-2.02c-3.22.7-3.9-1.55-3.9-1.55-.53-1.34-1.3-1.7-1.3-1.7-1.06-.74.08-.73.08-.73 1.17.08 1.79 1.2 1.79 1.2 1.04 1.78 2.73 1.27 3.4.97.1-.75.41-1.27.75-1.57-2.57-.29-5.28-1.31-5.28-5.84 0-1.29.46-2.35 1.2-3.18-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.2a10.9 10.9 0 0 1 5.8 0c2.2-1.5 3.17-1.2 3.17-1.2.63 1.59.23 2.76.11 3.05.75.83 1.2 1.9 1.2 3.18 0 4.54-2.72 5.55-5.3 5.84.42.36.8 1.06.8 2.14v3.18c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
                                  </svg>
                                ) : platformIcon === 'gitee' ? (
                                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M11.984 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.016 0zm6.09 5.333c.328 0 .593.266.592.593v1.482a.594.594 0 0 1-.593.592H9.777c-.982 0-1.778.796-1.778 1.778v5.63c0 .327.266.592.593.592h5.63c.982 0 1.778-.796 1.778-1.778v-.296a.593.593 0 0 0-.593-.593h-4.148a.593.593 0 0 1-.593-.592v-1.482a.593.593 0 0 1 .593-.592h6.815c.327 0 .593.265.593.592v3.408a4 4 0 0 1-4 4H5.926a.593.593 0 0 1-.593-.593V9.778a4.444 4.444 0 0 1 4.445-4.444h8.296z" />
                                  </svg>
                                ) : (
                                  <span className="text-xl">{project.category === 'web' ? '🌐' : project.category === 'mobile' ? '📱' : '💻'}</span>
                                )}
                              </div>
                              <h3 className="line-clamp-1 flex-1 text-xs font-semibold text-gray-900 dark:text-gray-100 sm:text-lg">
                                {project.title}
                              </h3>
                            </div>
                            <Chip className="md:hidden">{statusLabel}</Chip>
                            <span className={`hidden flex-shrink-0 rounded-full px-3 py-1 text-xs font-medium md:inline ${statusColor}`}>
                              {statusLabel}
                            </span>
                          </div>

                          <div className="chip-scroll mb-1.5 flex gap-1 overflow-x-auto pb-0.5 md:hidden">
                            {project.starsCount !== undefined && project.starsCount > 0 && (
                              <Chip>{project.starsCount}</Chip>
                            )}
                            {project.techStack?.slice(0, 3).map((tech, idx) => (
                              <Chip key={idx}>{tech}</Chip>
                            ))}
                          </div>

                          {project.description && (
                            <p className="mb-2 line-clamp-2 text-[11px] leading-snug text-gray-600 dark:text-gray-400 sm:mb-4 sm:line-clamp-3 sm:text-sm">
                              {project.description}
                            </p>
                          )}

                          {project.techStack && project.techStack.length > 0 && (
                            <div className="mb-3 hidden flex-wrap gap-2 md:flex">
                              {project.techStack.slice(0, 6).map((tech, idx) => (
                                <span
                                  key={idx}
                                  className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                                >
                                  {tech}
                                </span>
                              ))}
                              {project.techStack.length > 6 && (
                                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                                  +{project.techStack.length - 6}
                                </span>
                              )}
                            </div>
                          )}

                          <div className="flex items-center gap-2">
                            {project.projectUrl && (
                              <a
                                href={project.projectUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 rounded-lg bg-gradient-to-r from-pink-500 to-purple-500 px-3 py-1.5 text-center text-xs font-semibold text-white transition hover:from-pink-600 hover:to-purple-600 sm:rounded-xl sm:px-4 sm:py-2 sm:text-sm"
                              >
                                {skillsT('viewProject')}
                              </a>
                            )}
                            {project.githubUrl && project.githubUrl !== project.projectUrl && (
                              <a
                                href={project.githubUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 sm:rounded-xl sm:px-4 sm:py-2 sm:text-sm"
                              >
                                GitHub
                              </a>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="mt-4 border-t border-gray-200 pt-3 dark:border-gray-700 sm:mt-6 sm:pt-6">
                <div className="flex flex-wrap gap-3 text-[10px] text-gray-500 dark:text-gray-400 sm:gap-4 sm:text-xs">
                  <span>
                    {locale === 'zh' ? '创建时间' : 'Created'}: {formatDate(apiSkill.created_at)}
                  </span>
                  <span>
                    {locale === 'zh' ? '更新时间' : 'Updated'}: {formatDate(apiSkill.updated_at)}
                  </span>
                </div>
              </div>
            </div>
            </div>
          }
        />
    </div>
  )
}

