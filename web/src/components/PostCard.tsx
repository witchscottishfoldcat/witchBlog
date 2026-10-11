'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import { useTranslations } from 'next-intl'
import ReactMarkdown from 'react-markdown'
import { Icon } from '@iconify/react'
import { memo, useMemo } from 'react'
import { Chip } from '@/components/ui/Chip'

interface PostCardProps {
  slug: string
  title: string
  date: string
  description?: string
  category?: string
  subcategory?: string
  tags?: string[]
  wordCount?: number
  locale: string
  isEncrypted?: boolean
  pinned?: boolean
  author?: string
  viewMode?: 'list' | 'grid'
}

// ReactMarkdown 组件配置（提取到组件外部，避免重复创建）
const markdownComponents = {
  p: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
  strong: ({ children }: { children?: React.ReactNode }) => <strong className="font-bold">{children}</strong>,
  em: ({ children }: { children?: React.ReactNode }) => <em className="italic">{children}</em>,
  code: ({ children }: { children?: React.ReactNode }) => <code className="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-sm">{children}</code>,
}

/** 与标题字号联动，避免桌面端大标题时图标偏小且偏上 */
const postTitleIconClass =
  'mr-1.5 sm:mr-2 h-[1.1em] w-[1.1em] shrink-0 [&>svg]:block [&>svg]:h-full [&>svg]:w-full'

function PostCard({
  slug,
  title,
  date,
  description,
  category,
  tags = [],
  wordCount,
  locale,
  isEncrypted = false,
  pinned = false,
  author,
  viewMode = 'list',
}: PostCardProps) {
  const t = useTranslations('common')
  const tBlog = useTranslations('blog')

  // 统一日期格式，供列表和网格视图复用
  const formattedDate = useMemo(() => format(new Date(date), 'yyyy-MM-dd'), [date])

  const metaChips = (
    <div className="chip-scroll -mx-0.5 mb-2 flex gap-1 overflow-x-auto px-0.5 pb-0.5 sm:mx-0 sm:mb-3 sm:flex-wrap sm:gap-2 sm:overflow-visible sm:pb-0">
      {pinned && (
        <Chip active className="!px-2">
          📌 {tBlog('pinned')}
        </Chip>
      )}
      {isEncrypted && <Chip>🔒 {tBlog('encrypted')}</Chip>}
      <Chip>{formattedDate}</Chip>
      {author && <Chip>{author}</Chip>}
      {category && (
        <Chip>{category}</Chip>
      )}
      {wordCount != null && wordCount > 0 && (
        <Chip>
          {wordCount} {t('words')}
        </Chip>
      )}
    </div>
  )

  const tagChips =
    tags.length > 0 ? (
      <div className="chip-scroll -mx-0.5 flex gap-1 overflow-x-auto px-0.5 pb-0.5 sm:flex-wrap sm:gap-1.5 sm:overflow-visible">
        {tags.map((tag) => (
          <Chip key={tag}>#{tag}</Chip>
        ))}
      </div>
    ) : null

  if (viewMode === 'grid') {
    return (
      <Link href={`/${locale}/posts/${slug}`} prefetch={true}>
        <article 
          className="group max-md:mobile-page-card max-md:hover:shadow-none max-md:hover:translate-y-0 rounded-2xl p-3 sm:p-6 md:shadow-lg md:hover:shadow-xl transition-all duration-300 md:hover:-translate-y-1 h-full flex flex-col"
          style={{
            backgroundColor: 'var(--theme-card-bg)'
          }}
        >
          <h2 
            className="text-base sm:text-xl font-bold mb-2 text-gray-800 dark:text-gray-200 transition-colors flex items-center gap-1.5 group"
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--theme-primary-600)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = ''
            }}
          >
            <Icon icon="mdi:file-document-outline" className={postTitleIconClass} style={{ color: 'var(--theme-primary-500)' }} />
            <span className="min-w-0 flex-1 line-clamp-2 sm:line-clamp-none break-words leading-snug">
              <ReactMarkdown components={markdownComponents}>
                {title}
              </ReactMarkdown>
            </span>
          </h2>
          {metaChips}
          {description && (
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 flex-grow line-clamp-2 sm:line-clamp-none sm:mb-4 sm:text-base">
              {description}
            </p>
          )}
          {tagChips && <div className="mb-2 sm:mb-4">{tagChips}</div>}
          <div className="mt-auto hidden sm:flex justify-end">
            <div 
              className="px-4 py-2 rounded-lg transition-colors group-hover"
              style={{
                backgroundColor: 'var(--theme-primary-100)',
                color: 'var(--theme-primary-600)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--theme-primary-200)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--theme-primary-100)'
              }}
            >
              <span className="text-sm font-medium">→</span>
            </div>
          </div>
        </article>
      </Link>
    )
  }

  // List view
  return (
    <Link href={`/${locale}/posts/${slug}`}>
      <article 
        className="group max-md:mobile-feed-item max-md:mobile-page-card max-md:hover:shadow-none max-md:hover:translate-y-0 rounded-2xl p-3 sm:p-6 md:shadow-lg md:hover:shadow-xl transition-all duration-300 md:hover:-translate-y-1 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6"
        style={{
          backgroundColor: 'var(--theme-card-bg)'
        }}
      >
        <div className="flex-grow min-w-0">
          <h2 
            className="text-base sm:text-xl md:text-2xl font-bold mb-2 text-gray-800 dark:text-gray-200 transition-colors flex items-center gap-1.5 group sm:mb-3"
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--theme-primary-600)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = ''
            }}
          >
            <Icon icon="mdi:file-document-outline" className={postTitleIconClass} style={{ color: 'var(--theme-primary-500)' }} />
            <span className="min-w-0 flex-1 line-clamp-2 sm:line-clamp-none break-words leading-snug">
              <ReactMarkdown components={markdownComponents}>
                {title}
              </ReactMarkdown>
            </span>
          </h2>
          {metaChips}
          {description && (
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-1 line-clamp-2 sm:line-clamp-none sm:text-base">{description}</p>
          )}
          {tagChips}
        </div>
        <div className="hidden sm:flex flex-shrink-0">
          <div
            className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg flex items-center justify-center transition-colors"
            style={{
              backgroundColor: 'var(--theme-primary-100)',
              color: 'var(--theme-primary-600)',
            }}
          >
            <span className="text-xl sm:text-2xl">→</span>
          </div>
        </div>
      </article>
    </Link>
  )
}

// 使用 memo 优化，避免不必要的重新渲染
export default memo(PostCard, (prevProps, nextProps) => {
  return (
    prevProps.slug === nextProps.slug &&
    prevProps.title === nextProps.title &&
    prevProps.date === nextProps.date &&
    prevProps.description === nextProps.description &&
    prevProps.category === nextProps.category &&
    prevProps.subcategory === nextProps.subcategory &&
    prevProps.locale === nextProps.locale &&
    prevProps.isEncrypted === nextProps.isEncrypted &&
    prevProps.viewMode === nextProps.viewMode &&
    prevProps.wordCount === nextProps.wordCount &&
    JSON.stringify(prevProps.tags) === JSON.stringify(nextProps.tags)
  )
})

