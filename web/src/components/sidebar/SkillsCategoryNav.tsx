import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { getSkills, convertApiSkillToSkill } from '@/lib/api'
import { SidebarCard } from '@/components/Sidebar'
import { NAV_ROUTES } from '@/constants'
import { sidebarLinkClass } from './styles'

interface SkillsCategoryNavProps {
  locale: string
}

export default async function SkillsCategoryNav({ locale }: SkillsCategoryNavProps) {
  const [t, skillsT] = await Promise.all([
    getTranslations('sidebar'),
    getTranslations('skills'),
  ])
  const apiSkills = await getSkills({ skip: 0, limit: 100 })
  const skills = apiSkills.map((s) => convertApiSkillToSkill(s, locale))

  const categories = ['frontend', 'backend', 'database', 'tools', 'other'] as const
  const items = categories
    .map((cat) => ({
      key: cat,
      label: skillsT(`categories.${cat}`),
      count: skills.filter((s) => s.category === cat).length,
    }))
    .filter((item) => item.count > 0)

  if (items.length === 0) return null

  return (
    <SidebarCard title={t('skillCategories')}>
      <div className="space-y-1">
        {items.map((item) => (
          <Link
            key={item.key}
            href={`${NAV_ROUTES.skills(locale)}?category=${item.key}`}
            className={sidebarLinkClass}
          >
            <span>{item.label}</span>
            <span
              className="rounded-full px-2 py-0.5 text-xs"
              style={{ backgroundColor: 'var(--theme-card-bg-80)', color: 'var(--theme-primary-500)' }}
            >
              {item.count}
            </span>
          </Link>
        ))}
      </div>
    </SidebarCard>
  )
}
