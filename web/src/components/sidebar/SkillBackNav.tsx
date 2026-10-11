import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { SidebarCard } from '@/components/Sidebar'
import { NAV_ROUTES } from '@/constants'
import { sidebarLinkClass } from './styles'

interface SkillBackNavProps {
  locale: string
}

export default async function SkillBackNav({ locale }: SkillBackNavProps) {
  const skillsT = await getTranslations('skills')

  return (
    <SidebarCard title={skillsT('byCategory')}>
      <Link href={NAV_ROUTES.skills(locale)} className={sidebarLinkClass}>
        <span>{skillsT('backToSkills')}</span>
        <span className="text-xs">←</span>
      </Link>
    </SidebarCard>
  )
}
