import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { SidebarCard } from '@/components/Sidebar'
import { NAV_ROUTES } from '@/constants'
import { sidebarLinkClass } from './styles'

interface MySpaceNavProps {
  locale: string
}

export default async function MySpaceNav({ locale }: MySpaceNavProps) {
  const [t, navT, galleryT] = await Promise.all([
    getTranslations('sidebar'),
    getTranslations('nav'),
    getTranslations('gallery'),
  ])

  const links = [
    { href: NAV_ROUTES.myDiary(locale), label: navT('diary') },
    { href: NAV_ROUTES.myGallery(locale), label: galleryT('gallery') },
    { href: `/${locale}/my`, label: navT('anime') },
  ]

  return (
    <SidebarCard title={t('mySpace')}>
      <div className="space-y-1">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className={sidebarLinkClass}>
            <span>{link.label}</span>
          </Link>
        ))}
      </div>
    </SidebarCard>
  )
}
