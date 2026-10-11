import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { SidebarCard } from '@/components/Sidebar'
import { sidebarLinkClass } from './styles'

interface OthersQuickNavProps {
  locale: string
}

const pages = ['projects', 'skills', 'timeline'] as const

export default async function OthersQuickNav({ locale }: OthersQuickNavProps) {
  const [t, othersT] = await Promise.all([
    getTranslations('sidebar'),
    getTranslations('others'),
  ])

  return (
    <SidebarCard title={t('quickLinks')}>
      <div className="space-y-1">
        {pages.map((key) => (
          <Link
            key={key}
            href={`/${locale}/${key === 'projects' ? 'projects' : key}`}
            className={`${sidebarLinkClass} flex-col !items-start gap-0.5`}
          >
            <span className="font-medium">{othersT(`pages.${key}.title`)}</span>
            <span className="text-xs text-gray-400 dark:text-gray-500">{othersT(`pages.${key}.description`)}</span>
          </Link>
        ))}
      </div>
    </SidebarCard>
  )
}
