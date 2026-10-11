import { Suspense } from 'react'
import Navbar from '@/components/Navbar'
import ArchiveHeroBanner from '@/components/ArchiveHeroBanner'
import PageLayout from '@/components/PageLayout'
import AppSidebarLeft from '@/components/AppSidebarLeft'
import AboutFilesNav from '@/components/sidebar/AboutFilesNav'
import AppSidebarRight from '@/components/AppSidebarRight'
import { getAboutFiles, getMdFileContent, parseMarkdownWithFrontmatter } from '@/lib/api'
import AboutFiles from '@/components/AboutFiles'
import { logger } from '@/lib/logger'
import { isValidLocale } from '@/i18n'
import { resolveNestedMessage } from '@/lib/i18n-utils'
import type { Messages } from '@/types/messages'
import MobilePageHeader from '@/components/mobile/MobilePageHeader'
import PageIntroCard from '@/components/PageIntroCard'

/**
 * 直接加载翻译文件（不依赖 getRequestConfig）
 */
async function loadMessages(locale: string): Promise<Messages> {
  try {
    const messages = (await import(`@/messages/${locale}.json`)).default;
    return messages as Messages;
  } catch (error) {
    logger.error(`[AboutPage] Failed to load messages for locale: ${locale}`, error);
    // 如果加载失败，尝试加载默认语言
    const defaultMessages = (await import(`@/messages/zh.json`)).default;
    return defaultMessages as Messages;
  }
}

// 静态生成配置：关于页面缓存 60 秒，确保更新及时显示
export const revalidate = 60

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  
  // 验证 locale 并加载翻译
  const validLocale = isValidLocale(locale) ? locale : 'zh'
  const [messages, aboutFilesRaw] = await Promise.all([
    loadMessages(validLocale),
    getAboutFiles(),
  ])
  
  const aboutMessages = messages.about
  
  // 创建翻译函数
  const aboutT = (key: string) => resolveNestedMessage(aboutMessages, key)
  
  // 开发环境下记录翻译值
  if (process.env.NODE_ENV === 'development') {
    logger.log(`[AboutPage] Locale: ${locale}, ValidLocale: ${validLocale}`)
    logger.log(`[AboutPage] RelatedFiles: ${aboutT('relatedFiles')}`)
    logger.log(`[AboutPage] FilesCount: ${aboutT('filesCount')}`)
  }

  // 获取 About 文件列表并补充 frontmatter 标题
  let aboutFiles = aboutFilesRaw

  // 为每个文件提取 frontmatter 标题（仅对 Markdown 文件）
  aboutFiles = await Promise.all(
    aboutFiles.map(async (file) => {
      // 只处理 Markdown 文件
      const isMarkdown = file.filename.toLowerCase().endsWith('.md') || 
                         file.filename.toLowerCase().endsWith('.markdown')
      
      if (!isMarkdown) {
        return file
      }

      try {
        // 获取文件内容的前几行（只获取 frontmatter 部分，减少数据传输）
        const content = await getMdFileContent(file.url, true)
        const { frontmatter } = parseMarkdownWithFrontmatter(content)
        
        // 如果 frontmatter 中有 title，使用它
        if (frontmatter.title && typeof frontmatter.title === 'string') {
          return {
            ...file,
            frontmatterTitle: frontmatter.title.trim(),
          }
        }
      } catch (error) {
        // 如果获取失败，继续使用原始 title
        logger.error(`Failed to extract frontmatter title for file ${file.id}:`, error)
      }

      return file
    })
  )

  return (
    <div 
      className="min-h-screen bg-gradient-to-b"
      style={{
        background: `linear-gradient(to bottom, var(--theme-bg-start), var(--theme-bg-middle), var(--theme-bg-end))`
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
                  <AboutFilesNav locale={locale} />
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
            <div className="space-y-3 sm:space-y-8">
            <MobilePageHeader title={aboutT('title')} subtitle={aboutT('description')} />
            <PageIntroCard title={aboutT('title')} subtitle={aboutT('description')} />
            {/* About Files Section - 从接口获取的文件列表 */}
            <section className="rounded-2xl sm:rounded-[32px] border border-white/80 bg-white/90 p-4 sm:p-6 lg:p-8 shadow-[0_20px_60px_rgba(255,182,193,0.25)] backdrop-blur dark:border-gray-800 dark:bg-gray-900/80">
              <div className="mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
                {/* <span className="text-2xl">📁</span> */}
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {aboutT('relatedFiles')}
                </h2>
                {aboutFiles.length > 0 && (
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                    {aboutFiles.length} {aboutT('filesCount')}
                  </span>
                )}
              </div>
              {aboutFiles.length > 0 ? (
                <AboutFiles files={aboutFiles} locale={locale} />
              ) : (
                <div className="py-12 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                    <span className="text-4xl">📁</span>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400">
                    {aboutT('noFiles')}
                  </p>
                </div>
              )}
            </section>
            </div>
          }
        />
    </div>
  )
}

