import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { SidebarCard } from '@/components/Sidebar'
import { sidebarLinkClass } from './styles'

interface GamesQuickNavProps {
  locale: string
}

export default async function GamesQuickNav({ locale }: GamesQuickNavProps) {
  const [t, navT] = await Promise.all([getTranslations('sidebar'), getTranslations('nav')])

  return (
    <SidebarCard title={t('quickLinks')}>
      <div className="space-y-1">
        <Link href={`/${locale}/games`} className={sidebarLinkClass}>
          <span>{navT('games')}</span>
        </Link>
        <Link href={`/${locale}`} className={sidebarLinkClass}>
          <span>{navT('home')}</span>
        </Link>
      </div>
    </SidebarCard>
  )
}
