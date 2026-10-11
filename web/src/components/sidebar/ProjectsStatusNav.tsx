import { getTranslations } from 'next-intl/server'
import { getProjects, convertApiProjectToProject } from '@/lib/api'
import { SidebarCard } from '@/components/Sidebar'
import { sidebarLinkClass } from './styles'

interface ProjectsStatusNavProps {
  locale: string
}

export default async function ProjectsStatusNav({ locale }: ProjectsStatusNavProps) {
  const [t, projectsT] = await Promise.all([
    getTranslations('sidebar'),
    getTranslations('projects'),
  ])
  const apiProjects = await getProjects({ skip: 0, limit: 100 })
  const projects = apiProjects.map((p) => convertApiProjectToProject(p, locale))

  const stats = {
    total: projects.length,
    completed: projects.filter((p) => p.status === 'completed').length,
    inProgress: projects.filter((p) => p.status === 'in-progress').length,
    planned: projects.filter((p) => p.status === 'planned').length,
  }

  const items = [
    { label: projectsT('stats.total'), value: stats.total },
    { label: projectsT('stats.completed'), value: stats.completed },
    { label: projectsT('stats.inProgress'), value: stats.inProgress },
    { label: projectsT('status.planned'), value: stats.planned },
  ].filter((item) => item.value > 0)

  if (items.length === 0) return null

  return (
    <SidebarCard title={t('projectOverview')}>
      <div className="space-y-1">
        {items.map((item) => (
          <div key={item.label} className={sidebarLinkClass}>
            <span>{item.label}</span>
            <span
              className="rounded-full px-2 py-0.5 text-xs tabular-nums"
              style={{ backgroundColor: 'var(--theme-card-bg-80)', color: 'var(--theme-primary-500)' }}
            >
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </SidebarCard>
  )
}
