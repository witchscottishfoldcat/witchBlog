import { getAllTags } from '@/lib/api'
import { getTranslations } from 'next-intl/server'
import { Chip } from '@/components/ui/Chip'
import { NAV_ROUTES } from '@/constants'

interface TagListProps {
  locale: string
  limit?: number
}

/**
 * 标签列表组件
 * 从 API 和 contentlayer 获取所有标签，按使用频率排序显示
 */
export default async function TagList({ locale: _locale, limit = 8 }: TagListProps) {
  const t = await getTranslations('components')
  // 获取所有标签（从 API 和 contentlayer）
  const { tags: sortedTags, tagCountMap } = await getAllTags()

  // 限制显示的标签数量
  const displayTags = sortedTags.slice(0, limit)

  return (
    <div className="chip-scroll -mx-0.5 flex gap-1.5 overflow-x-auto px-0.5 pb-0.5 md:mx-0 md:flex-wrap md:overflow-visible md:gap-2 md:pb-0">
      {displayTags.length > 0 ? (
        displayTags.map((tag) => {
          const count = tagCountMap.get(tag) || 0
          return (
            <Chip
              key={tag}
              href={`${NAV_ROUTES.posts(_locale)}?tag=${encodeURIComponent(tag)}`}
              count={count}
              title={`${tag} (${count})`}
              scroll={false}
            >
              #{tag}
            </Chip>
          )
        })
      ) : (
        <span className="text-xs text-gray-500 dark:text-gray-400 px-1">
          {t('noTags')}
        </span>
      )}
    </div>
  )
}

