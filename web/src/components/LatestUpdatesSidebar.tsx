import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { getProjects, convertApiProjectToProject, getTimelines, convertApiTimelineToTimelineEntry } from '@/lib/api'
import { NAV_ROUTES } from '@/constants'
import { SidebarCard } from '@/components/Sidebar'
import { Project } from '@/components/ProjectList'
import { TimelineEntry } from '@/components/TimelineList'
import { logger } from '@/lib/logger'

/**
 * 侧边栏最新更新（项目和动态合并）
 */
export default async function LatestUpdatesSidebar({ locale }: { locale: string }) {
  const t = await getTranslations('blog')
  const projectsT = await getTranslations('projects')
  const navT = await getTranslations('nav')
  const timelineT = await getTranslations('timeline')
  
  let projects: Project[] = []
  let timelineEntries: TimelineEntry[] = []
  
  // 并行获取项目和动态数据
  try {
    const [apiProjects, timelinesResponse] = await Promise.all([
      getProjects({
        skip: 0,
        limit: 100,
      }),
      getTimelines({
        skip: 0,
        limit: 100,
        public_only: true,
      }),
    ])
    
    // 处理项目数据
    projects = apiProjects
      .map((apiProject) => convertApiProjectToProject(apiProject, locale))
      .sort((a, b) => {
        const dateA = new Date(a.updatedAt || a.createdAt || '').getTime()
        const dateB = new Date(b.updatedAt || b.createdAt || '').getTime()
        return dateB - dateA // 最新的在前
      })
      .slice(0, 1) // 只取前1条
    
    // 处理时间线数据
    timelineEntries = timelinesResponse.timelines
      .map((apiTimeline) => convertApiTimelineToTimelineEntry(apiTimeline, locale))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // 最新的在前
      .slice(0, 1) // 只取前1条
  } catch (error) {
    logger.error('Failed to fetch latest updates from API:', error)
    projects = []
    timelineEntries = []
  }
  
  // 如果都没有数据，不显示
  if (projects.length === 0 && timelineEntries.length === 0) return null
  
  return (
    <SidebarCard>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
          {t('latestTimeline')}
        </h3>
      </div>
      <div className="space-y-4">
        {/* 最新项目部分 */}
        {projects.length > 0 && (
          <div>
            <div className="space-y-2">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={NAV_ROUTES.projects(locale)}
                  className="group block rounded-lg border p-3 transition-all hover:shadow-md sidebar-item-theme relative"
                  style={{
                    borderColor: 'var(--theme-card-border)'
                  }}
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:opacity-80 line-clamp-1 flex-1">
                      {project.title}
                    </h4>
                    <span 
                      className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium flex-shrink-0 ${
                        project.status === 'completed' 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                          : project.status === 'in-progress'
                          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                      }`}
                    >
                      {project.status === 'completed' ? projectsT('status.completed') 
                        : project.status === 'in-progress' ? projectsT('status.inProgress')
                        : projectsT('status.planned')}
                    </span>
                  </div>
                  {project.description && (
                    <p className="mb-2 line-clamp-2 text-xs text-gray-600 dark:text-gray-400">
                      {project.description}
                    </p>
                  )}
                  {project.techStack.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {project.techStack.slice(0, 2).map((tech) => (
                        <span
                          key={tech}
                          className="rounded-full bg-blue-50 px-1.5 py-0.5 text-[9px] text-blue-600 dark:bg-blue-900/30 dark:text-blue-300"
                        >
                          {tech}
                        </span>
                      ))}
                      {project.techStack.length > 2 && (
                        <span className="rounded-full bg-blue-50 px-1.5 py-0.5 text-[9px] text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
                          +{project.techStack.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                  {/* 右下角"项目"标签 */}
                  <span className="absolute bottom-2 right-2 rounded-full bg-purple-100 px-1.5 py-0.5 text-[9px] font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                    {navT('projects')}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
        
        {/* 最新动态部分 */}
        {timelineEntries.length > 0 && (
          <div>
            {projects.length > 0 && <div className="my-4 h-px bg-gray-200 dark:bg-gray-700" />}
            <div className="space-y-2">
              {timelineEntries.map((entry) => {
                const dotColorMap = {
                  work: 'bg-green-500',
                  project: 'bg-purple-500',
                  education: 'bg-blue-500',
                  achievement: 'bg-orange-500',
                }
                return (
                  <Link
                    key={entry.id}
                    href={NAV_ROUTES.timeline(locale)}
                    className="group flex gap-3 rounded-lg border p-3 transition-all hover:shadow-md sidebar-item-theme relative"
                    style={{
                      borderColor: 'var(--theme-card-border)'
                    }}
                  >
                    <div className="flex-shrink-0 pt-0.5">
                      <div className={`h-2 w-2 rounded-full ${dotColorMap[entry.type] || 'bg-gray-400'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="mb-1 flex items-start justify-between gap-1">
                        <div className="flex-1 min-w-0">
                          <div className="mb-0.5 text-[10px] text-gray-500 dark:text-gray-400">{entry.date}</div>
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:opacity-80 line-clamp-1">
                            {entry.title}
                          </h4>
                        </div>
                      </div>
                      <p className="line-clamp-2 text-xs text-gray-600 dark:text-gray-400">
                        {entry.description}
                      </p>
                    </div>
                    {/* 右下角"状态"标签 */}
                    <span className="absolute bottom-2 right-2 rounded-full bg-blue-100 px-1.5 py-0.5 text-[9px] font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                      {timelineT('currentStatus')}
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </SidebarCard>
  )
}

