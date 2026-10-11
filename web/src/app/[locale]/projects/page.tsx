import { Suspense } from 'react'
import { Icon } from '@iconify/react'
import Navbar from '@/components/Navbar'
import ArchiveHeroBanner from '@/components/ArchiveHeroBanner'
import PageLayout from '@/components/PageLayout'
import AppSidebarLeft from '@/components/AppSidebarLeft'
import ProjectList, { Project } from '@/components/ProjectList'
import {
  buildProjectSidebarStats,
  ProjectLanguageCoverageCard,
  ProjectLanguageCard,
  ProjectSourceCard,
  ProjectStatusCard,
  ProjectSummaryCard,
} from '@/components/sidebar/ProjectStatsCards'
import { LeftSidebarFallback, RightSidebarFallback } from '@/components/layout/PageSidebarFallback'
import { getProjects, getLanguageStats, convertApiProjectToProject } from '@/lib/api'
import { isValidLocale } from '@/i18n'
import { resolveNestedMessage } from '@/lib/i18n-utils'
import type { Messages } from '@/types/messages'
import { logger } from '@/lib/logger'
import MobilePageHeader from '@/components/mobile/MobilePageHeader'
import PageIntroCard from '@/components/PageIntroCard'
import { getTranslations } from 'next-intl/server'

/**
 * 直接加载翻译文件（不依赖 getRequestConfig）
 */
async function loadMessages(locale: string): Promise<Messages> {
  try {
    const messages = (await import(`@/messages/${locale}.json`)).default;
    return messages as Messages;
  } catch (error) {
    logger.error(`[ProjectsPage] Failed to load messages for locale: ${locale}`, error);
    // 如果加载失败，尝试加载默认语言
    const defaultMessages = (await import(`@/messages/zh.json`)).default;
    return defaultMessages as Messages;
  }
}

export default async function ProjectsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params

  const validLocale = isValidLocale(locale) ? locale : 'zh'
  const navT = await getTranslations('nav')

  const [messages, apiProjects, languageUsageStats] = await Promise.all([
    loadMessages(validLocale),
    getProjects({
      skip: 0,
      limit: 100,
    }),
    getLanguageStats(10),
  ])
  
  const projectsMessages = messages.projects
  
  // 创建翻译函数
  const projectsT = (key: string) => resolveNestedMessage(projectsMessages, key)
  
  // 开发环境下记录翻译值
  if (process.env.NODE_ENV === 'development') {
    logger.log(`[ProjectsPage] Locale: ${locale}, ValidLocale: ${validLocale}`)
    logger.log(`[ProjectsPage] Title: ${projectsT('title')}`)
    logger.log(`[ProjectsPage] Subtitle: ${projectsT('subtitle')}`)
  }

  // 转换为 Project 格式
  const projects: Project[] = apiProjects.map((apiProject) => convertApiProjectToProject(apiProject, locale))

  const projectsWithLocale = projects
  const sidebarStats = buildProjectSidebarStats(projects)

  const stats = {
    total: projects.length,
    completed: projects.filter((p) => p.status === 'completed').length,
    inProgress: projects.filter((p) => p.status === 'in-progress').length,
    techStackCount: Array.from(new Set(projects.flatMap((p) => p.techStack))).length,
    languageCount: sidebarStats.languages.length,
  }
  const planned = projects.filter((project) => project.status === 'planned').length
  const languageCoverageItems = languageUsageStats.length > 0
    ? languageUsageStats.map((item) => ({
        label: item.language,
        count: item.project_count,
        percentage: item.total_percentage,
      }))
    : sidebarStats.languageProjects

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
                <ProjectSummaryCard
                  total={stats.total}
                  languageCount={stats.languageCount}
                  totalLabel={projectsT('stats.total')}
                  languageLabel={projectsT('stats.languages')}
                />
                <ProjectStatusCard
                  title={projectsT('statusOverview')}
                  total={stats.total}
                  completed={stats.completed}
                  inProgress={stats.inProgress}
                  planned={planned}
                  labels={{
                    completed: projectsT('status.completed'),
                    inProgress: projectsT('status.inProgress'),
                    planned: projectsT('status.planned'),
                  }}
                />
              </AppSidebarLeft>
            </Suspense>
          }
          rightSidebar={
            <Suspense fallback={<RightSidebarFallback />}>
              <ProjectLanguageCard title={projectsT('languageStats')} items={sidebarStats.languages} />
              <ProjectLanguageCoverageCard
                title={projectsT('languageCoverage')}
                countLabel={projectsT('tagStatsCount')}
                items={languageCoverageItems}
              />
              <ProjectSourceCard title={projectsT('sourceStats')} platforms={sidebarStats.platforms} tags={sidebarStats.tags} />
            </Suspense>
          }
          content={
            <div className="space-y-3 sm:space-y-4">
            <MobilePageHeader
              title={projectsT('title')}
              subtitle={projectsT('subtitle')}
              backHref={`/${locale}`}
              backLabel={navT('projects')}
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
                  <Icon icon="mdi:folder-star-multiple-outline" className="h-5 w-5" />
                </span>
              }
            />
            <PageIntroCard title={projectsT('title')} subtitle={projectsT('subtitle')} />

            <ProjectList
              projects={projectsWithLocale}
              compact
              stats={stats}
              statsLabels={{
                total: projectsT('stats.total'),
                completed: projectsT('stats.completed'),
                inProgress: projectsT('stats.inProgress'),
                techStack: projectsT('stats.techStack'),
              }}
              statusLabels={{
                completed: projectsT('status.completed'),
                inProgress: projectsT('status.inProgress'),
                planned: projectsT('status.planned'),
              }}
              buttonLabels={{
                visitProject: projectsT('buttons.visitProject'),
              }}
              sectionLabels={{
                featured: projectsT('sections.featured'),
                allProjects: projectsT('sections.allProjects'),
                techStack: projectsT('sections.techStack'),
              }}
              cardLabels={{
                created: projectsT('created'),
                updated: projectsT('updated'),
                dominantLanguage: projectsT('dominantLanguage'),
              }}
            />

            </div>
          }
        />
    </div>
  )
}

