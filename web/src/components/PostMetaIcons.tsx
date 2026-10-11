'use client'

import { Icon } from '@iconify/react'
import { normalizeTags } from '@/lib/post-utils'
import { Chip } from '@/components/ui/Chip'

interface PostMetaIconsProps {
  wordCount?: number
  readingTime?: number
  date: string
  category?: string
  subcategory?: string
  tags?: string[]
  wordsLabel: string
  readingTimeLabel: string
}

/** 桌面端 meta 浅色小图标方块的统一样式 */
const metaIconBox =
  'flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[var(--theme-primary-100)] text-[var(--theme-primary-600)] dark:bg-[var(--theme-primary-100)]/25 dark:text-[var(--theme-primary-300)]'

export default function PostMetaIcons({
  wordCount,
  readingTime,
  date,
  category,
  subcategory,
  tags,
  wordsLabel,
  readingTimeLabel,
}: PostMetaIconsProps) {
  const tagList = normalizeTags(tags)

  const metaChips = (
    <>
      {wordCount != null && wordCount > 0 && (
        <Chip>
          {wordCount} {wordsLabel}
        </Chip>
      )}
      {readingTime != null && readingTime > 0 && (
        <Chip>
          {readingTime} {readingTimeLabel}
        </Chip>
      )}
      <Chip>{date}</Chip>
      {category && <Chip>{category}{subcategory ? ` › ${subcategory}` : ''}</Chip>}
      {tagList.map((tag) => (
        <Chip key={tag}>#{tag}</Chip>
      ))}
    </>
  )

  return (
    <>
      {/* 移动端：横向滚动 */}
      <div className="chip-scroll -mx-0.5 mb-3 flex items-center gap-1 overflow-x-auto px-0.5 pb-0.5 md:hidden">
        {metaChips}
      </div>
      {/* 桌面端：浅色小图标 + 灰色细字，标签单独一行 */}
      <div className="mb-2 hidden flex-col gap-2.5 text-[13px] text-gray-500 dark:text-gray-400 md:flex">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          {wordCount != null && wordCount > 0 && (
            <span className="inline-flex items-center gap-2">
              <span className={metaIconBox}>
                <Icon icon="mdi:pencil-outline" className="h-3.5 w-3.5" />
              </span>
              {wordCount} {wordsLabel}
            </span>
          )}
          {readingTime != null && readingTime > 0 && (
            <span className="inline-flex items-center gap-2">
              <span className={metaIconBox}>
                <Icon icon="mdi:clock-outline" className="h-3.5 w-3.5" />
              </span>
              {readingTime} {readingTimeLabel}
            </span>
          )}
          <span className="inline-flex items-center gap-2">
            <span className={metaIconBox}>
              <Icon icon="mdi:calendar-blank-outline" className="h-3.5 w-3.5" />
            </span>
            {date}
          </span>
          {category && (
            <span className="inline-flex items-center gap-2">
              <span className={metaIconBox}>
                <Icon icon="mdi:book-open-outline" className="h-3.5 w-3.5" />
              </span>
              {category}
              {subcategory ? <span className="text-gray-400 dark:text-gray-500">/ {subcategory}</span> : null}
            </span>
          )}
        </div>
        {tagList.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {tagList.map((tag) => (
              <span key={tag} className="inline-flex items-center gap-2">
                <span className={metaIconBox}>
                  <Icon icon="mdi:pound" className="h-3.5 w-3.5" />
                </span>
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
