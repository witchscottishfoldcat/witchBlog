import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

import { getDiaries } from '@/lib/api'
import { SidebarCard } from '@/components/Sidebar'

interface DiaryArchiveNavProps {
  locale: string
}

/**
 * 侧边栏：按年份 / 标签归类（基于最近一批公开日记的统计）
 */
export default async function DiaryArchiveNav({ locale }: DiaryArchiveNavProps) {
  const t = await getTranslations('diary')
  const { diaries, total } = await getDiaries({ skip: 0, limit: 100, public_only: true })

  const yearCounts = new Map<number, number>()
  const tagCounts = new Map<string, number>()

  for (const d of diaries) {
    const y = new Date(d.created_at).getFullYear()
    yearCounts.set(y, (yearCounts.get(y) || 0) + 1)
    for (const tag of d.tags || []) {
      const trimmed = typeof tag === 'string' ? tag.trim() : ''
      if (trimmed) {
        tagCounts.set(trimmed, (tagCounts.get(trimmed) || 0) + 1)
      }
    }
  }

  const years = [...yearCounts.keys()].sort((a, b) => b - a)
  const tags = [...tagCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 14)

  const base = `/${locale}/my/diary`

  const linkClass =
    'inline-flex items-center rounded-lg border border-transparent px-2 py-1 text-gray-700 transition hover:border-pink-200 hover:bg-pink-50/80 dark:text-gray-300 dark:hover:border-pink-800 dark:hover:bg-pink-950/40'

  if (years.length === 0 && tags.length === 0) {
    return null
  }

  return (
    <SidebarCard title={t('archiveTitle')}>
      <div className="space-y-4 text-sm">
        <Link href={base} className={linkClass + ' font-medium'}>
          {t('archiveAll')}
        </Link>

        {years.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
              {t('archiveByYear')}
            </p>
            <ul className="flex flex-wrap gap-2">
              {years.map((y) => (
                <li key={y}>
                  <Link href={`${base}?year=${y}`} className={linkClass}>
                    {y}
                    <span className="ml-1 text-xs text-gray-400 dark:text-gray-500">
                      ({yearCounts.get(y)})
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {tags.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
              {t('archiveByTag')}
            </p>
            <ul className="flex flex-wrap gap-2">
              {tags.map(([tag, count]) => (
                <li key={tag}>
                  <Link
                    href={`${base}?tag=${encodeURIComponent(tag)}`}
                    className={linkClass}
                  >
                    #{tag}
                    <span className="ml-1 text-xs text-gray-400 dark:text-gray-500">
                      ({count})
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {total > 100 && (
          <p className="text-xs leading-relaxed text-gray-400 dark:text-gray-500">
            {t('archiveSampleHint')}
          </p>
        )}
      </div>
    </SidebarCard>
  )
}
