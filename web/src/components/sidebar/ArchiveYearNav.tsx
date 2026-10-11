import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { getArchives, convertArchiveToPost } from '@/lib/api'
import { SidebarCard } from '@/components/Sidebar'
import { NAV_ROUTES } from '@/constants'
import { sidebarLinkClass } from './styles'

interface ArchiveYearNavProps {
  locale: string
}

export default async function ArchiveYearNav({ locale }: ArchiveYearNavProps) {
  const t = await getTranslations('sidebar')
  const archives = await getArchives({})
  const yearCounts = new Map<number, number>()

  for (const archive of archives) {
    const converted = convertArchiveToPost(archive, locale)
    if (!converted.date) continue
    const year = new Date(converted.date).getFullYear()
    yearCounts.set(year, (yearCounts.get(year) || 0) + 1)
  }

  const years = [...yearCounts.keys()].sort((a, b) => b - a)
  if (years.length === 0) return null

  return (
    <SidebarCard title={t('archiveYears')}>
      <div className="space-y-1">
        {years.map((year) => (
          <Link key={year} href={`${NAV_ROUTES.archive(locale)}#y-${year}`} className={sidebarLinkClass}>
            <span>{year}</span>
            <span
              className="rounded-full px-2 py-0.5 text-xs"
              style={{ backgroundColor: 'var(--theme-card-bg-80)', color: 'var(--theme-primary-500)' }}
            >
              {yearCounts.get(year)}
            </span>
          </Link>
        ))}
      </div>
    </SidebarCard>
  )
}
