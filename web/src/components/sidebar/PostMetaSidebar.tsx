import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { SidebarCard } from '@/components/Sidebar'
import { NAV_ROUTES } from '@/constants'
import { Chip } from '@/components/ui/Chip'
import { sidebarChipLinkClass } from './styles'

interface PostMetaSidebarProps {
  locale: string
  category?: string
  subcategory?: string
  tags?: string[]
  wordCount?: number
  readingTime?: number
}

export default async function PostMetaSidebar({
  locale,
  category,
  subcategory,
  tags = [],
  wordCount,
  readingTime,
}: PostMetaSidebarProps) {
  const [t, commonT] = await Promise.all([
    getTranslations('sidebar'),
    getTranslations('common'),
  ])

  if (!category && tags.length === 0 && !wordCount) return null

  return (
    <SidebarCard title={t('articleInfo')}>
      <div className="space-y-3 text-sm">
        {category && (
          <div>
            <p className="mb-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">{t('categories')}</p>
            <div className="flex flex-wrap items-center gap-1.5">
              <Chip href={`${NAV_ROUTES.posts(locale)}?category=${encodeURIComponent(category)}`} scroll={false}>{category}</Chip>
              {subcategory && (
                <>
                  <span className="text-xs text-gray-400">›</span>
                  <Chip href={`${NAV_ROUTES.posts(locale)}?category=${encodeURIComponent(category)}&subcategory=${encodeURIComponent(subcategory)}`} scroll={false}>
                    {subcategory}
                  </Chip>
                </>
              )}
            </div>
          </div>
        )}
        {tags.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">{t('tags')}</p>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <Link
                  key={tag}
                  href={`${NAV_ROUTES.posts(locale)}?tag=${encodeURIComponent(tag)}`}
                  scroll={false}
                  className={sidebarChipLinkClass}
                >
                  #{tag}
                </Link>
              ))}
            </div>
          </div>
        )}
        {(wordCount || readingTime) && (
          <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
            {wordCount ? (
              <span>
                {wordCount} {commonT('words')}
              </span>
            ) : null}
            {readingTime ? (
              <span>
                {readingTime} {commonT('readingTimeLabel')}
              </span>
            ) : null}
          </div>
        )}
      </div>
    </SidebarCard>
  )
}
