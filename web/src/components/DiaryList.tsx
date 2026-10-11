'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import type { Components } from 'react-markdown'
import Pagination from './Pagination'
import { Chip } from '@/components/ui/Chip'
import { getImageUrl, shouldUseNativeImg } from '@/lib/image-utils'
import { logger } from '@/lib/logger'
import { useTranslations } from 'next-intl'
import { format } from 'date-fns/format'
import type { Locale } from 'date-fns'
import { zhCN, enUS, ja, ko } from 'date-fns/locale'

function dateFnsLocaleFor(lang: string) {
  switch (lang) {
    case 'zh':
      return zhCN
    case 'ja':
      return ja
    case 'ko':
      return ko
    default:
      return enUS
  }
}

export interface DiaryEntry {
  id: number
  title: string
  content: string
  images: string[]
  date: Date
  locale: string
  weather?: string
  mood?: string
  tags?: string[]
}

interface DiaryListProps {
  entries: DiaryEntry[]
  timeAgoLabel: string
  currentPage?: number
  totalPages?: number
  basePath?: string
  locale: string
  /** 筛选时替换「暂无日记」的提示 */
  emptyMessage?: string
  /** 副标题下方一行说明（如按年/标签筛选） */
  filterHint?: string | null
  paginationLabels?: {
    previous: string
    next: string
    page: string
    of: string
  }
}

type MonthSectionItem =
  | { kind: 'section'; key: string; label: string }
  | { kind: 'entry'; entry: DiaryEntry }

function monthSectionLabel(date: Date, locale: string, df: Locale): string {
  if (locale === 'zh' || locale === 'ja') {
    return format(date, 'yyyy年MM月', { locale: df })
  }
  if (locale === 'ko') {
    return format(date, 'yyyy년 M월', { locale: df })
  }
  return format(date, 'MMMM yyyy', { locale: df })
}

function diaryExcerpt(content: string, maxLen = 96): string {
  const plain = content
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/[#>*_`~|-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!plain) return ''
  return plain.length > maxLen ? `${plain.slice(0, maxLen)}…` : plain
}

function buildMonthSections(entries: DiaryEntry[], locale: string, df: Locale): MonthSectionItem[] {
  const sorted = [...entries].sort((a, b) => b.date.getTime() - a.date.getTime())
  const items: MonthSectionItem[] = []
  let lastMonthKey = ''
  for (const entry of sorted) {
    const mk = format(entry.date, 'yyyy-MM')
    if (mk !== lastMonthKey) {
      lastMonthKey = mk
      items.push({
        kind: 'section',
        key: `m-${mk}`,
        label: monthSectionLabel(entry.date, locale, df),
      })
    }
    items.push({ kind: 'entry', entry })
  }
  return items
}

// getTimeAgo 函数已移动到组件内部，使用翻译

// 图片组件，带错误处理
function ImageWithErrorHandler({ 
  src, 
  alt, 
  originalSrc, 
  className 
}: { 
  src: string
  alt?: string
  originalSrc?: string
  className?: string
}) {
  const [hasError, setHasError] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(true)

  return (
    <div className="my-4 relative">
      {hasError ? (
        <div className="flex items-center justify-center p-4 bg-gray-100 dark:bg-gray-800 rounded-2xl text-gray-400 dark:text-gray-500 text-sm min-h-[200px]">
          <div className="text-center">
            <svg className="mx-auto h-8 w-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p>图片加载失败</p>
            {process.env.NODE_ENV === 'development' && originalSrc && (
              <p className="mt-1 text-xs opacity-75">{originalSrc}</p>
            )}
          </div>
        </div>
      ) : (
        <>
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-2xl">
              <div className="animate-pulse text-gray-400 dark:text-gray-500 text-sm">加载中...</div>
            </div>
          )}
          <img
            src={src}
            alt={alt || ''}
            className={className}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            crossOrigin="anonymous"
            onLoad={() => {
              setIsLoading(false)
              logger.log('[DiaryList Markdown] Image loaded successfully:', src)
            }}
            onError={() => {
              setIsLoading(false)
              setHasError(true)
              logger.error('[DiaryList Markdown] Failed to load image:', {
                src,
                originalSrc,
                alt
              })
            }}
          />
        </>
      )}
    </div>
  )
}

// 规范化 URL 用于比较（去除查询参数、协议等）
function normalizeImageUrl(url: string): string {
  try {
    // 如果是代理 URL，提取原始 URL
    if (url.startsWith('/api/proxy-image')) {
      const match = url.match(/url=([^&]+)/)
      if (match) {
        url = decodeURIComponent(match[1])
      }
    }
    // 移除协议、查询参数、hash
    const urlObj = new URL(url)
    return `${urlObj.hostname}${urlObj.pathname}`.toLowerCase()
  } catch {
    // 如果解析失败，返回原始 URL（小写）
    return url.toLowerCase()
  }
}

// 检查图片 URL 是否在 images 数组中
function isImageInArray(imageUrl: string, images: string[]): boolean {
  if (!images || images.length === 0) return false
  
  const normalizedUrl = normalizeImageUrl(imageUrl)
  return images.some(img => {
    const normalizedImg = normalizeImageUrl(img)
    return normalizedUrl === normalizedImg
  })
}

// 创建 Markdown 组件配置，接收 images 数组用于去重
function createDiaryMarkdownComponents(images: string[] = []): Partial<Components> {
  return {
  // 段落样式 - 如果包含块级元素（如图片），使用 div 而不是 p（避免嵌套问题）
  p: ({ children }) => {
    // 检查子元素是否包含块级元素（img、div 等）
    const hasBlockElement = React.Children.toArray(children).some((child) => {
      if (React.isValidElement(child)) {
        const elementType = child.type
        // 检查是否是块级元素
        if (typeof elementType === 'string') {
          return ['img', 'div', 'figure', 'picture'].includes(elementType)
        }
        // 检查是否是自定义组件（如 Next.js Image 可能被包裹在 div 中）
        const props = child.props as Record<string, unknown>
        if (props && ('src' in props || 'fill' in props)) {
          return true
        }
      }
      return false
    })
    
    // 如果包含块级元素，使用 div 而不是 p（避免 <p> 内嵌套 <div> 的问题）
    if (hasBlockElement) {
      return (
        <div className="mb-4 text-base leading-relaxed text-gray-700 dark:text-gray-300">
          {children}
        </div>
      )
    }
    
    return (
      <p className="mb-4 text-base leading-relaxed text-gray-700 dark:text-gray-300">
        {children}
      </p>
    )
  },
  
  // 图片：渲染为图片，支持代理 URL
  // 优先使用 images 数组：如果图片在 images 数组中存在，则隐藏（去重）；否则渲染
  img: ({ src, alt }) => {
    if (!src) {
      logger.warn('[DiaryList Markdown] Image src is empty')
      return null
    }

    // ReactMarkdown 的 src 类型为 string | Blob，这里只处理字符串 URL，
    // 如果是 Blob 类型则跳过，避免类型错误
    if (typeof src !== 'string') {
      logger.warn('[DiaryList Markdown] Image src is not a string, skipping:', src)
      return null
    }

    const srcStr = src as string
    
    // 如果 images 数组存在且不为空，检查当前图片是否在数组中（去重）
    if (images && images.length > 0) {
      // 检查当前图片是否在 images 数组中（去重）
      if (isImageInArray(srcStr, images)) {
        logger.log('[DiaryList Markdown] Image skipped (already in images array, avoiding duplicate):', {
          src: srcStr,
          imagesCount: images.length
        })
        // 返回 null，不渲染重复的图片
        return null
      }
    }
    
    // 如果图片不在 images 数组中，或者 images 数组为空，则渲染 Markdown 中的图片
    logger.log('[DiaryList Markdown] Rendering image from Markdown content:', {
      src: srcStr,
      imagesArray: images,
      imagesLength: images?.length || 0,
      isInArray: images && images.length > 0 ? isImageInArray(srcStr, images) : false
    })
    
    const finalSrc = getImageUrl(srcStr) || srcStr
    if (finalSrc !== srcStr) {
      logger.log('[DiaryList Markdown] Normalized image URL:', { original: srcStr, final: finalSrc })
    }

    // 代理 / 外部 / 后端 OSS 相对路径使用原生 img
    if (shouldUseNativeImg(finalSrc)) {
      return (
        <ImageWithErrorHandler
          src={finalSrc}
          alt={alt || ''}
          originalSrc={src}
          className="my-4 rounded-2xl max-w-full h-auto shadow-lg block"
        />
      )
    }
    
    // 对于本地路径，使用 Next.js Image 组件（需要包裹 div 因为使用了 fill）
    return (
      <div className="relative my-4 aspect-video overflow-hidden rounded-2xl bg-gray-100 dark:bg-gray-800">
        <Image
          src={finalSrc}
          alt={alt || ''}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          onLoad={() => {
            logger.log('[DiaryList Markdown] Local image loaded successfully:', finalSrc)
          }}
          onError={(e) => {
            const target = e.target as HTMLImageElement
            logger.error('[DiaryList Markdown] Failed to load local image:', {
              src: finalSrc,
              originalSrc: src,
              alt
            })
            target.style.display = 'none'
          }}
        />
      </div>
    )
  },
  
  // 链接：只显示文字，移除链接样式
  a: ({ children }) => (
    <span className="text-gray-700 dark:text-gray-300">
      {children}
    </span>
  ),
  
  // 其他基本样式
  strong: ({ children }) => (
    <strong className="font-bold text-gray-900 dark:text-gray-100">
      {children}
    </strong>
  ),
  em: ({ children }) => (
    <em className="italic text-gray-800 dark:text-gray-200">
      {children}
    </em>
  ),
  code: ({ className, children, ...props }: React.ComponentPropsWithoutRef<'code'>) => {
    const isInline = !className
    return isInline ? (
      <code
        className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-sm text-pink-600 dark:text-pink-400 font-mono"
        {...props}
      >
        {children}
      </code>
    ) : (
      <code className={className || ''} {...props}>
        {children}
      </code>
    )
  },
  pre: ({ children }) => (
    <pre className="bg-gray-900 dark:bg-gray-950 rounded-lg p-4 overflow-x-auto mb-4">
      {children}
    </pre>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-pink-500 pl-4 italic my-4 text-gray-600 dark:text-gray-400">
      {children}
    </blockquote>
  ),
  ul: ({ children }) => (
    <ul className="list-disc list-inside mb-4 space-y-2 text-gray-700 dark:text-gray-300 ml-4">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-inside mb-4 space-y-2 text-gray-700 dark:text-gray-300 ml-4">
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="my-1.5 leading-7">
      {children}
    </li>
  ),
  h1: ({ children }) => (
    <h3 className="mt-4 mb-2 text-lg font-bold text-gray-900 dark:text-gray-100">
      {children}
    </h3>
  ),
  h2: ({ children }) => (
    <h3 className="mt-4 mb-2 text-base font-semibold text-gray-900 dark:text-gray-100">
      {children}
    </h3>
  ),
  h3: ({ children }) => (
    <h3 className="mt-3 mb-1.5 text-base font-semibold text-gray-800 dark:text-gray-200">
      {children}
    </h3>
  ),
  hr: () => (
    <hr className="my-4 border-0 border-t border-dashed border-gray-300 dark:border-gray-600" />
  ),
  }
}

function DiaryEntryCard({
  entry,
  locale,
  df,
}: {
  entry: DiaryEntry
  locale: string
  df: Locale
}) {
  const t = useTranslations('diary')
  const dayNum = format(entry.date, 'd', { locale: df })
  const monthYear =
    locale === 'zh'
      ? format(entry.date, 'yyyy年M月', { locale: df })
      : format(entry.date, 'MMM yyyy', { locale: df })
  const weekday = format(entry.date, 'EEEE', { locale: df })
  const excerpt = diaryExcerpt(entry.content)
  const firstImage = entry.images[0]
  const timeAgoDays = Math.floor(
    (Date.now() - entry.date.getTime()) / (1000 * 60 * 60 * 24)
  )

  const mobileCard = (
    <Link
      href={`/${locale}/my/diary/${entry.id}`}
      className="mobile-feed-item block p-2.5 md:hidden"
    >
      <div className="flex gap-2.5">
        {firstImage ? (
          <div className="relative h-[4.5rem] w-12 shrink-0 overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-700">
            <img
              src={firstImage}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
            />
          </div>
        ) : (
          <div
            className="flex h-[4.5rem] w-12 shrink-0 flex-col items-center justify-center rounded-lg border border-dashed text-center"
            style={{ borderColor: 'var(--theme-card-border)' }}
          >
            <span className="font-serif text-lg font-bold tabular-nums leading-none text-gray-900 dark:text-gray-50">
              {dayNum}
            </span>
            <span className="mt-0.5 text-[9px] text-gray-500 dark:text-gray-400">
              {format(entry.date, locale === 'zh' ? 'M月' : 'MMM', { locale: df })}
            </span>
          </div>
        )}
        <div className="min-w-0 flex-1">
          {entry.title ? (
            <h3 className="line-clamp-1 text-xs font-semibold text-gray-900 dark:text-gray-100">
              {entry.title}
            </h3>
          ) : (
            <p className="text-[10px] text-gray-500 dark:text-gray-400">{monthYear}</p>
          )}
          <div className="chip-scroll -mx-0.5 mt-1 flex gap-1 overflow-x-auto pb-0.5">
            <Chip>{dayNum}</Chip>
            <Chip>{weekday}</Chip>
            {entry.weather && <Chip>{entry.weather}</Chip>}
            {entry.mood && <Chip>{entry.mood}</Chip>}
            {entry.tags?.slice(0, 2).map((tag, idx) => (
              <Chip key={idx}>#{tag}</Chip>
            ))}
          </div>
          {excerpt ? (
            <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-gray-600 dark:text-gray-400">
              {excerpt}
            </p>
          ) : null}
          <p className="mt-1 text-[10px] text-gray-500 dark:text-gray-500">
            {timeAgoDays} {t('timeAgoLabel')}
          </p>
        </div>
      </div>
    </Link>
  )

  const desktopCard = (
    <article
      className="group relative hidden overflow-hidden rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl md:block"
      style={{
        background: 'linear-gradient(145deg, color-mix(in srgb, var(--theme-primary-50) 48%, var(--theme-card-bg)), var(--theme-card-bg) 68%)',
        borderColor: 'var(--theme-primary-200)',
      }}
    >
      {/* 顶部彩色线条 */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-0.5"
        style={{ background: `linear-gradient(to right, var(--theme-primary-400), var(--theme-secondary), transparent)` }}
        aria-hidden
      />
      {/* 大数字水印 */}
      <span
        className="pointer-events-none absolute -bottom-7 -right-1 select-none font-black leading-none tracking-tighter opacity-[0.08] text-[8rem]"
        style={{ color: 'var(--theme-primary-500)' }}
        aria-hidden
      >
        {String(dayNum).padStart(2, '0')}
      </span>

      <div className="relative flex flex-col md:flex-row md:items-stretch">
        <Link
          href={`/${locale}/my/diary/${entry.id}`}
          className="flex shrink-0 flex-row items-center gap-4 border-b border-dashed border-gray-200/90 px-5 py-4 pl-8 md:w-36 md:flex-col md:items-start md:justify-center md:border-b-0 md:border-r md:py-6 dark:border-gray-700/90"
        >
          <span className="font-serif text-2xl font-bold tabular-nums leading-none text-gray-900 dark:text-gray-50 max-md:text-xl sm:text-4xl">
            {dayNum}
          </span>
          <div className="flex flex-col gap-0.5 text-left text-xs text-gray-600 dark:text-gray-400 sm:text-sm">
            <span className="font-medium">{monthYear}</span>
            <span className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-500 md:text-xs">
              {weekday}
            </span>
          </div>
        </Link>

        <div className="min-w-0 flex-1 space-y-4 p-5 pt-4 md:p-6 md:pl-5">
          {entry.title && (
            <Link href={`/${locale}/my/diary/${entry.id}`} className="block">
              <h2 className="font-serif text-xl font-semibold text-gray-900 transition-colors group-hover:text-pink-600 dark:text-gray-100 dark:group-hover:text-pink-400 sm:text-2xl">
                {entry.title}
                <span className="ml-2 inline text-base font-normal text-pink-400 opacity-0 transition-opacity group-hover:opacity-100">
                  →
                </span>
              </h2>
            </Link>
          )}

          {(entry.weather || entry.mood || (entry.tags && entry.tags.length > 0)) && (
            <div className="chip-scroll -mx-0.5 flex gap-1 overflow-x-auto px-0.5 pb-0.5 sm:flex-wrap sm:gap-2 sm:overflow-visible">
              {entry.weather && <Chip>🌤️ {entry.weather}</Chip>}
              {entry.mood && <Chip>😊 {entry.mood}</Chip>}
              {entry.tags?.map((tag, idx) => (
                <Chip key={idx}>#{tag}</Chip>
              ))}
            </div>
          )}

          {/* 摘要 + 首图预览（限制高度） */}
          <div className="group/content relative">
            <div className="rounded-xl border border-dashed border-amber-200/60 bg-[linear-gradient(transparent_1.5rem,rgba(251,113,133,0.08)_1.51rem)] bg-[length:100%_1.5rem] px-4 py-3 text-base leading-[1.5rem] dark:border-pink-900/40 dark:bg-[linear-gradient(transparent_1.5rem,rgba(244,63,94,0.06)_1.51rem)]">
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkBreaks]}
                components={createDiaryMarkdownComponents(entry.images)}
              >
                {diaryExcerpt(entry.content, 120)}
              </ReactMarkdown>
            </div>
            {/* 渐变遮罩 + 展开提示 */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white/80 to-transparent dark:from-gray-900/80" />
          </div>

          {/* 最多显示1张图片预览 */}
          {entry.images && entry.images.length > 0 && (() => {
            const firstImage = entry.images
              .filter((image) => image && typeof image === 'string' && image.trim().length > 0)
              [0]
            if (!firstImage) return null
            return (
              <div className="relative aspect-video overflow-hidden rounded-2xl bg-gray-100 dark:bg-gray-800 max-h-[180px]">
                <img
                  src={firstImage}
                  alt={`${entry.title || 'Diary'} preview`}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                  }}
                />
                {entry.images.length > 1 && (
                  <div className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-medium text-white">
                    +{entry.images.length - 1}
                  </div>
                )}
              </div>
            )
          })()}

          <div className="flex items-center justify-between border-t border-dashed border-gray-200/80 pt-4 dark:border-gray-700/80">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {(() => {
                const now = new Date()
                const diffInMs = now.getTime() - entry.date.getTime()
                const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
                return `${diffInDays} ${t('timeAgoLabel')}`
              })()}
            </p>
            <Link
              href={`/${locale}/my/diary/${entry.id}`}
              className="flex items-center gap-1 text-sm text-pink-500 transition-colors hover:text-pink-600 dark:text-pink-400 dark:hover:text-pink-300"
            >
              {t('readMore')}
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </article>
  )

  return (
    <>
      {mobileCard}
      {desktopCard}
    </>
  )
}

export default function DiaryList({
  entries,
  currentPage,
  totalPages,
  basePath,
  locale: localeProp,
  paginationLabels,
  emptyMessage,
  filterHint,
}: DiaryListProps) {
  const locale = localeProp || entries[0]?.locale || 'en'
  const t = useTranslations('diary')

  if (entries.length === 0) {
    return (
      <div 
        className="mobile-app-section max-md:mobile-page-card rounded-2xl md:rounded-[32px] border p-6 sm:p-8 md:p-12 text-center backdrop-blur"
        style={{
          backgroundColor: 'var(--theme-card-bg-90)',
          borderColor: 'var(--theme-card-border)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)'
        }}
      >
        <p className="text-gray-500 dark:text-gray-400">
          {emptyMessage ?? t('noDiaries')}
        </p>
      </div>
    )
  }

  const df = dateFnsLocaleFor(locale)
  const monthSections = buildMonthSections(entries, locale, df)

  return (
    <div 
      className="mobile-app-section max-md:space-y-3 max-md:border-0 max-md:bg-transparent max-md:p-0 max-md:shadow-none rounded-2xl md:rounded-[32px] border p-3 sm:p-6 md:p-8 backdrop-blur md:border"
      style={{
        backgroundColor: 'var(--theme-card-bg-90)',
        borderColor: 'var(--theme-card-border)',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)'
      }}
    >
      {filterHint ? (
        <p className="text-xs text-pink-600 dark:text-pink-400">{filterHint}</p>
      ) : null}

      {/* Diary Entries — 按月份分节 */}
      <div className="max-md:mobile-feed-panel max-md:mobile-feed-list space-y-6 max-md:space-y-0 md:space-y-6">
        {monthSections.map((item) => {
          if (item.kind === 'section') {
            return (
              <div key={item.key} className="pt-2 first:pt-0 max-md:px-2 max-md:pt-1">
                <div className="mb-2 flex items-center gap-2 md:gap-3">
                  <span className="h-px flex-1 bg-gradient-to-r from-transparent via-pink-200 to-pink-300 dark:via-pink-800 dark:to-pink-900" />
                  <h2 className="shrink-0 font-serif text-[10px] font-semibold uppercase tracking-[0.15em] text-pink-600 dark:text-pink-400 md:text-xs md:tracking-[0.2em]">
                    {item.label}
                  </h2>
                  <span className="h-px flex-1 bg-gradient-to-l from-transparent via-pink-200 to-pink-300 dark:via-pink-800 dark:to-pink-900" />
                </div>
              </div>
            )
          }
          return <DiaryEntryCard key={item.entry.id} entry={item.entry} locale={locale} df={df} />
        })}
      </div>

      {/* Pagination */}
      {currentPage !== undefined && totalPages !== undefined && basePath && paginationLabels && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          basePath={basePath}
          locale={locale}
          labels={paginationLabels}
        />
      )}
    </div>
  )
}

