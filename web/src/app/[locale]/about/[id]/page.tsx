import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import MarkdownContent from '@/components/MarkdownContent'
import PageLayout from '@/components/PageLayout'
import AppSidebarLeft from '@/components/AppSidebarLeft'
import AboutFilesNav from '@/components/sidebar/AboutFilesNav'
import AppSidebarRight from '@/components/AppSidebarRight'
import ArchiveHeroBanner from '@/components/ArchiveHeroBanner'
import { getAboutFiles, getMdFileContent, parseMarkdownWithFrontmatter } from '@/lib/api'
import { logger } from '@/lib/logger'
import { isValidLocale } from '@/i18n'
import { resolveNestedMessage } from '@/lib/i18n-utils'
import type { Messages } from '@/types/messages'

/**
 * 直接加载翻译文件（不依赖 getRequestConfig）
 */
async function loadMessages(locale: string): Promise<Messages> {
  try {
    const messages = (await import(`@/messages/${locale}.json`)).default;
    return messages as Messages;
  } catch (error) {
    logger.error(`[AboutFilePage] Failed to load messages for locale: ${locale}`, error);
    // 如果加载失败，尝试加载默认语言
    const defaultMessages = (await import(`@/messages/zh.json`)).default;
    return defaultMessages as Messages;
  }
}

// 静态生成配置：About 文件内容缓存 60 秒，确保更新及时显示
export const revalidate = 60

export default async function AboutFilePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params
  
  // 验证 locale 并加载翻译
  const validLocale = isValidLocale(locale) ? locale : 'zh'
  const messages = await loadMessages(validLocale)
  const aboutMessages = messages.about
  
  // 创建翻译函数
  const aboutT = (key: string) => resolveNestedMessage(aboutMessages, key)

  // 尝试将 id 转换为数字
  const fileId = parseInt(id, 10)
  if (isNaN(fileId)) {
    notFound()
  }

  // 获取所有 About 文件列表
  const aboutFiles = await getAboutFiles()
  
  // 查找对应的文件
  const file = aboutFiles.find((f) => f.id === fileId)
  if (!file) {
    notFound()
  }

  // 获取文件内容并移除 frontmatter
  let content = ''
  let displayTitle = file.title || file.filename
  try {
    const rawContent = await getMdFileContent(file.url, true) // 使用缓存
    // 解析 frontmatter 和正文内容
    const { frontmatter, content: markdownContent } = parseMarkdownWithFrontmatter(rawContent)
    // 如果 frontmatter 中有 title，优先使用它
    if (frontmatter.title && typeof frontmatter.title === 'string') {
      displayTitle = frontmatter.title.trim()
    }
    
    // 移除 Markdown 内容中第一个 h1 标题（如果与页面标题相同）
    let processedContent = markdownContent.trim()
    // 检查第一个 h1 标题
    const h1Regex = /^#\s+(.+)$/m
    const h1Match = processedContent.match(h1Regex)
    if (h1Match && h1Match[1] && h1Match[1].trim() === displayTitle) {
      // 移除第一个 h1 标题行
      processedContent = processedContent.replace(h1Regex, '').trim()
    }
    
    content = processedContent
  } catch (error) {
    logger.error('Failed to fetch about file content:', error)
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-b"
      style={{
        background: `linear-gradient(to bottom, var(--theme-bg-start), var(--theme-bg-middle), var(--theme-bg-end))`,
      }}
    >
      <Navbar />
      <ArchiveHeroBanner />

        <PageLayout
          leftSidebar={
            <Suspense
              fallback={
                <div className="space-y-6">
                  <div className="h-32 rounded-2xl bg-white/70 dark:bg-gray-900/60 shadow-md animate-pulse" />
                  <div className="space-y-3">
                    <div className="h-4 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
                    <div className="h-4 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
                    <div className="h-4 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
                  </div>
                </div>
              }
            >
<AppSidebarLeft locale={locale}>
                <Suspense fallback={null}>
                  <AboutFilesNav locale={locale} currentId={id} />
                </Suspense>
              </AppSidebarLeft>
            </Suspense>
          }
          rightSidebar={
            <Suspense
              fallback={
                <div className="space-y-6">
                  <div className="h-24 rounded-2xl bg-white/70 dark:bg-gray-900/60 shadow-md animate-pulse" />
                  <div className="h-32 rounded-2xl bg-white/70 dark:bg-gray-900/60 shadow-md animate-pulse" />
                  <div className="h-24 rounded-2xl bg-white/70 dark:bg-gray-900/60 shadow-md animate-pulse" />
                </div>
              }
            >
<AppSidebarRight locale={locale} />
            </Suspense>
          }
          content={
            <div>
            {/* Back Button */}
            <Link
              href={`/${locale}/about`}
              className="mb-6 inline-flex items-center gap-2 text-sm text-gray-600 transition-colors hover:text-[var(--theme-primary-500)] dark:text-gray-400 dark:hover:text-[var(--theme-primary-400)]"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {aboutT('backToAbout')}
            </Link>

            {/* Article */}
            <article className="rounded-2xl sm:rounded-[32px] border border-white/80 bg-white/90 card-padding shadow-[0_20px_60px_rgba(255,182,193,0.25)] backdrop-blur dark:border-gray-800 dark:bg-gray-900/80">
              {/* Header */}
              <header className="mb-8">
                <h1 className="mb-4 text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 md:text-4xl">
                  {displayTitle}
                </h1>
              </header>

              {/* Content */}
              <div className="prose prose-lg dark:prose-invert max-w-none
                prose-headings:font-bold 
                prose-p:text-gray-700 dark:prose-p:text-gray-300 
                prose-a:text-[var(--theme-primary-500)] dark:prose-a:text-[var(--theme-primary-400)] 
                prose-strong:text-gray-900 dark:prose-strong:text-gray-100 
                prose-code:rounded prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:text-sm dark:prose-code:bg-gray-800 
                prose-pre:bg-gray-900 dark:prose-pre:bg-gray-950 prose-pre:rounded-lg
                prose-blockquote:border-l-4 prose-blockquote:border-[var(--theme-primary-500)] prose-blockquote:pl-4 prose-blockquote:italic
                prose-ul:list-disc prose-ol:list-decimal
                prose-ul:my-4 prose-ol:my-4 prose-li:my-2">
                {content ? (
                  <MarkdownContent content={content} />
                ) : (
                  <div className="py-12 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                      <span className="text-4xl">📄</span>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400">
                      {aboutT('unableToLoad')}
                    </p>
                  </div>
                )}
              </div>
            </article>
            </div>
          }
        />
    </div>
  )
}

