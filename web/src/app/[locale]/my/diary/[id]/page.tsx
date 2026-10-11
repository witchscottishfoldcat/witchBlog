import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { format } from 'date-fns/format'
import Navbar from '@/components/Navbar'
import ArchiveHeroBanner from '@/components/ArchiveHeroBanner'
import PageLayout from '@/components/PageLayout'
import { getDiary, type Diary } from '@/lib/api'
import { getImageUrl, shouldUseNativeImg } from '@/lib/image-utils'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import type { Components } from 'react-markdown'
import React from 'react'
import Image from 'next/image'
import MobileBackBar from '@/components/mobile/MobileBackBar'
import { Chip } from '@/components/ui/Chip'

/**
 * 将 API 返回的 Diary 转换为 DiaryEntry 格式
 */
function convertDiaryToEntry(diary: Diary, locale: string) {
  const images = (diary.images || [])
    .map((img) => {
      const imageUrl =
        typeof img.image_url === 'string' && img.image_url.trim()
          ? img.image_url.trim()
          : typeof img.thumbnail_url === 'string'
            ? img.thumbnail_url.trim()
            : ''
      const resolved = getImageUrl(imageUrl)
      return resolved || null
    })
    .filter((url): url is string => typeof url === 'string' && url.length > 0)

  return {
    id: diary.id,
    title: diary.title || '',
    content: diary.content || '',
    images,
    date: new Date(diary.created_at || diary.updated_at),
    locale,
    weather: diary.weather || undefined,
    mood: diary.mood || undefined,
    tags: diary.tags || undefined,
  }
}

// 日记风格的 Markdown 组件配置 - 优化格式渲染
const diaryMarkdownComponents: Partial<Components> = {
  // 段落 - 更舒适的阅读体验
  p: ({ children, node }) => {
    // 检查段落中是否包含图片节点（图片会被渲染为 figure，不能放在 p 内）
    const hasImage = node && node.children && node.children.some(
      (child: { type?: string; tagName?: string }) =>
        child.type === 'element' && child.tagName === 'img'
    )
    
    // 如果包含图片，不包裹在 p 标签中，直接返回 children（避免 figcaption 在 p 内的错误）
    if (hasImage) {
      return <>{children}</>
    }
    
    // 检查是否是空段落（只包含换行）
    if (React.Children.count(children) === 0 || 
        (React.Children.count(children) === 1 && 
         typeof children === 'string' && 
         children.trim() === '')) {
      return null
    }
    
    return (
      <p className="mb-3 text-sm leading-relaxed text-gray-800 dark:text-gray-200 font-serif indent-0 max-md:mb-3 md:mb-6 md:text-lg md:text-xl">
        {children}
      </p>
    )
  },
  
  // 图片 - 日记本风格
  img: ({ src, alt }) => {
    if (!src) return null

    const srcString = typeof src === 'string' ? src : ''
    if (!srcString) return null

    const finalSrc = getImageUrl(srcString) || srcString

    if (shouldUseNativeImg(finalSrc)) {
      return (
        <figure className="my-8 text-center">
          <img
            src={finalSrc}
            alt={alt || ''}
            className="mx-auto rounded-xl max-w-full h-auto shadow-lg border-2 border-gray-200 dark:border-gray-700"
            loading="lazy"
            referrerPolicy="no-referrer"
            crossOrigin="anonymous"
          />
          {alt && (
            <figcaption className="mt-2 text-sm text-gray-500 dark:text-gray-400 italic">
              {alt}
            </figcaption>
          )}
        </figure>
      )
    }
    
    return (
      <figure className="relative my-8 aspect-video overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 shadow-lg">
        <Image
          src={finalSrc}
          alt={alt || ''}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        {alt && (
          <figcaption className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-sm p-2 text-center">
            {alt}
          </figcaption>
        )}
      </figure>
    )
  },
  
  // 链接 - 保持文字样式
  a: ({ children }) => (
    <span className="text-gray-800 dark:text-gray-200 underline decoration-dotted underline-offset-2">
      {children}
    </span>
  ),
  
  // 强调
  strong: ({ children }) => (
    <strong className="font-bold text-gray-900 dark:text-gray-100">
      {children}
    </strong>
  ),
  em: ({ children }) => (
    <em className="italic text-gray-700 dark:text-gray-300">
      {children}
    </em>
  ),
  
  // 标题 - 更清晰的层次
  h1: ({ children }) => (
    <h1 className="mt-10 mb-6 text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 border-b-2 border-pink-200 dark:border-pink-800 pb-3 font-serif">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mt-8 mb-4 text-2xl md:text-3xl font-semibold text-gray-900 dark:text-gray-100 font-serif">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-6 mb-3 text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-200 font-serif">
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="mt-5 mb-2 text-lg md:text-xl font-semibold text-gray-800 dark:text-gray-200">
      {children}
    </h4>
  ),
  
  // 引用 - 日记风格
  blockquote: ({ children }) => (
    <blockquote className="my-6 pl-6 pr-4 py-3 border-l-4 border-pink-300 dark:border-pink-600 italic text-gray-700 dark:text-gray-300 bg-pink-50/30 dark:bg-pink-900/10 rounded-r-lg">
      {children}
    </blockquote>
  ),
  
  // 列表 - 更美观的样式
  ul: ({ children }) => (
    <ul className="my-6 ml-6 list-disc space-y-3 text-gray-800 dark:text-gray-200 marker:text-pink-400 dark:marker:text-pink-500">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="my-6 ml-6 list-decimal space-y-3 text-gray-800 dark:text-gray-200 marker:text-pink-400 dark:marker:text-pink-500">
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="pl-2 leading-relaxed">
      {children}
    </li>
  ),
  
  // 代码
  code: ({ className, children, ...props }: React.ComponentPropsWithoutRef<'code'>) => {
    const isInline = !className
    return isInline ? (
      <code
        className="px-2 py-1 bg-pink-50 dark:bg-pink-900/20 rounded text-sm text-pink-700 dark:text-pink-300 font-mono border border-pink-200 dark:border-pink-800"
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
    <pre className="bg-gray-900 dark:bg-gray-950 rounded-lg p-4 overflow-x-auto mb-6 border border-gray-800 dark:border-gray-700 shadow-lg">
      {children}
    </pre>
  ),
  
  // 水平线
  hr: () => (
    <hr className="my-8 border-0 border-t-2 border-dashed border-gray-300 dark:border-gray-600" />
  ),
  
  // 表格
  table: ({ children }) => (
    <div className="my-6 overflow-x-auto">
      <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-pink-50 dark:bg-pink-900/20">
      {children}
    </thead>
  ),
  tbody: ({ children }) => (
    <tbody className="bg-white dark:bg-gray-900">
      {children}
    </tbody>
  ),
  tr: ({ children }) => (
    <tr className="border-b border-gray-200 dark:border-gray-700 hover:bg-pink-50/30 dark:hover:bg-pink-900/10 transition-colors">
      {children}
    </tr>
  ),
  th: ({ children }) => (
    <th className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-left font-semibold text-gray-900 dark:text-gray-100">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-gray-700 dark:text-gray-300">
      {children}
    </td>
  ),
}

interface DiaryDetailPageProps {
  params: Promise<{ locale: string; id: string }>
}

export default async function DiaryDetailPage({ params }: DiaryDetailPageProps) {
  const { locale, id } = await params
  const navT = await getTranslations('nav')
  const diaryT = await getTranslations('diary')
  
  // 尝试将 id 转换为数字
  const diaryId = parseInt(id, 10)
  if (isNaN(diaryId)) {
    notFound()
  }
  
  // 获取日记详情
  const diary = await getDiary(diaryId)
  if (!diary) {
    notFound()
  }
  
  // 转换为 DiaryEntry 格式
  const entry = convertDiaryToEntry(diary, locale)
  
  // 格式化日期
  const formattedDate = format(entry.date, locale === 'zh' ? 'yyyy年MM月dd日 EEEE' : 'EEEE, MMMM dd, yyyy')
  const timeOnly = format(entry.date, locale === 'zh' ? 'HH:mm' : 'h:mm a')
  
  return (
    <div 
      className="min-h-screen bg-gradient-to-b max-md:bg-[var(--theme-bg-middle)]"
      style={{
        background: `linear-gradient(to bottom, var(--theme-bg-start), var(--theme-bg-middle), var(--theme-bg-end))`
      }}
    >
      <Navbar />
      <div className="max-md:hidden">
        <ArchiveHeroBanner />
      </div>
      
        <PageLayout
          content={
            <div className="max-md:mobile-article-shell">
            <MobileBackBar href={`/${locale}/my/diary`} label={navT('diary')} />

            <Link
              href={`/${locale}/my/diary`}
              className="mb-6 hidden items-center gap-2 text-sm text-gray-600 transition-colors hover:text-[var(--theme-primary-600)] dark:text-gray-400 dark:hover:text-[var(--theme-primary-300)] md:inline-flex"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {diaryT('title')}
            </Link>
            
            <div className="relative max-md:ml-0">
              <div className="absolute bottom-0 left-0 top-0 hidden w-6 border-l-2 border-dashed border-pink-200 opacity-50 dark:border-pink-800/80 sm:block sm:w-8 md:w-12" />
              
              <article 
                className="relative max-md:ml-0 max-md:rounded-xl max-md:border max-md:p-4 max-md:shadow-md ml-0 rounded-2xl border-2 border-gray-200 bg-[#fffbf5]/95 p-4 shadow-2xl dark:border-gray-700 dark:bg-gray-950/90 sm:ml-12 sm:p-8 md:ml-16 md:p-12 lg:p-16 dark:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]"
                style={{
                  boxShadow:
                    '0 25px 50px -12px rgba(0, 0, 0, 0.15), inset 0 0 0 1px rgba(255, 255, 255, 0.5)',
                }}
              >
                {/* 日期头部 - 日记本风格 */}
                <div className="mb-4 border-b-2 border-dashed border-gray-300 pb-4 dark:border-gray-600 max-md:mb-3 max-md:pb-3 md:mb-10 md:pb-8">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between md:gap-4">
                    <div>
                      <div className="text-base font-bold tracking-tight text-gray-900 dark:text-gray-100 max-md:leading-snug md:mb-2 md:text-3xl lg:text-4xl">
                        {formattedDate}
                      </div>
                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 md:text-base">
                        {timeOnly}
                      </div>
                    </div>
                    
                    <div className="chip-scroll flex gap-1 overflow-x-auto pb-0.5 md:flex-wrap md:gap-3 md:overflow-visible">
                      {entry.weather && (
                        <Chip className="md:hidden">{entry.weather}</Chip>
                      )}
                      {entry.mood && (
                        <Chip className="md:hidden">{entry.mood}</Chip>
                      )}
                      {entry.weather && (
                        <span 
                          className="hidden rounded-full px-4 py-2 text-sm font-medium md:inline"
                          style={{
                            backgroundColor: 'rgba(255, 182, 193, 0.2)',
                            color: '#d946ef'
                          }}
                        >
                          🌤️ {entry.weather}
                        </span>
                      )}
                      {entry.mood && (
                        <span 
                          className="hidden rounded-full px-4 py-2 text-sm font-medium md:inline"
                          style={{
                            backgroundColor: 'rgba(255, 182, 193, 0.2)',
                            color: '#d946ef'
                          }}
                        >
                          😊 {entry.mood}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* 标题 - 优化样式 */}
                {entry.title && (
                  <div className="mb-4 max-md:mb-3 md:mb-10">
                    <h1 
                      className="mb-2 text-lg font-bold leading-tight text-gray-900 dark:text-gray-100 max-md:line-clamp-2 md:mb-4 md:text-5xl"
                      style={{
                        fontFamily: 'serif',
                        letterSpacing: '-0.02em'
                      }}
                    >
                      {entry.title}
                    </h1>
                    {/* 标题装饰线 */}
                    <div className="w-24 h-1 bg-gradient-to-r from-pink-300 to-pink-500 dark:from-pink-600 dark:to-pink-400 rounded-full"></div>
                  </div>
                )}
                
                {/* 标签 */}
                {entry.tags && entry.tags.length > 0 && (
                  <div className="chip-scroll mb-4 flex gap-1 overflow-x-auto pb-0.5 max-md:mb-3 md:mb-8 md:flex-wrap md:gap-2 md:overflow-visible">
                    {entry.tags.map((tag, idx) => (
                      <Chip key={idx} className="md:hidden">
                        #{tag}
                      </Chip>
                    ))}
                    {entry.tags.map((tag, idx) => (
                      <span
                        key={`desktop-${idx}`}
                        className="hidden rounded-full px-3 py-1 text-xs font-medium md:inline"
                        style={{
                          backgroundColor: 'rgba(255, 182, 193, 0.15)',
                          color: '#be185d',
                          border: '1px solid rgba(255, 182, 193, 0.3)'
                        }}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
                
                {/* 图片 - 日记本风格 */}
                {entry.images && entry.images.length > 0 && (
                  <div className={`mb-4 grid gap-2 max-md:mb-3 md:mb-8 md:gap-4 ${
                    entry.images.length === 1 ? 'grid-cols-1' : 
                    entry.images.length === 2 ? 'grid-cols-2' : 
                    'grid-cols-2 md:grid-cols-3'
                  }`}>
                    {entry.images
                      .filter((image) => image && typeof image === 'string' && image.trim().length > 0)
                      .map((image, idx) => {
                        if (shouldUseNativeImg(image)) {
                          return (
                            <div
                              key={idx}
                              className="relative aspect-video overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 shadow-md"
                            >
                              <img
                                src={image}
                                alt={`${entry.title || 'Diary'} - Image ${idx + 1}`}
                                className="h-full w-full object-cover"
                                loading="lazy"
                                referrerPolicy="no-referrer"
                                crossOrigin="anonymous"
                              />
                            </div>
                          )
                        }

                        return (
                          <div
                            key={idx}
                            className="relative aspect-video overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 shadow-md"
                          >
                            <Image
                              src={image}
                              alt={`${entry.title || 'Diary'} - Image ${idx + 1}`}
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 100vw, 50vw"
                            />
                          </div>
                        )
                      })}
                  </div>
                )}
                
                {/* 内容区域 - 日记本风格，优化排版 */}
                <div 
                  className="diary-content max-md:mobile-article-body prose prose-sm max-w-none text-gray-800 dark:prose-invert dark:text-gray-200 md:prose-lg md:prose-xl"
                  style={{
                    fontFamily: 'serif',
                  }}
                >
                  <div className="text-sm leading-relaxed max-md:text-sm md:text-lg">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm, remarkBreaks]}
                      components={diaryMarkdownComponents}
                    >
                      {entry.content}
                    </ReactMarkdown>
                  </div>
                </div>
                
                {/* 底部装饰 */}
                <div className="mt-6 border-t-2 border-dashed border-gray-300 pt-4 dark:border-gray-600 max-md:mt-4 max-md:pt-3 md:mt-12 md:pt-6">
                  <div className="flex items-center justify-center gap-2 text-xs text-gray-400 dark:text-gray-500 md:text-sm">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    <span>{format(entry.date, locale === 'zh' ? 'yyyy年MM月dd日' : 'MMMM dd, yyyy')}</span>
                  </div>
                </div>
              </article>
            </div>
            </div>
          }
        />
    </div>
  )
}
