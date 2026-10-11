import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { SidebarCard } from '@/components/Sidebar'
import { NAV_ROUTES } from '@/constants'
import { sidebarLinkClass } from './styles'

interface MusicQuickNavProps {
  locale: string
}

export default async function MusicQuickNav({ locale }: MusicQuickNavProps) {
  const [t, navT] = await Promise.all([getTranslations('sidebar'), getTranslations('nav')])

  return (
    <SidebarCard title={t('quickLinks')}>
      <div className="space-y-1">
        <Link href={NAV_ROUTES.music(locale)} className={sidebarLinkClass}>
          <span>{navT('music')}</span>
        </Link>
        <Link href={`/${locale}`} className={sidebarLinkClass}>
          <span>{navT('home')}</span>
        </Link>
      </div>
    </SidebarCard>
  )
}
