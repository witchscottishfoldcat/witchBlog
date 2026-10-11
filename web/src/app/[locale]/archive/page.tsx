import { Suspense } from 'react'
import type { Metadata } from 'next'
import { allPosts } from 'contentlayer/generated'
import { getTranslations } from 'next-intl/server'
import Navbar from '@/components/Navbar'
import ArchiveHeroBanner from '@/components/ArchiveHeroBanner'
import PageLayout from '@/components/PageLayout'
import AppSidebarLeft from '@/components/AppSidebarLeft'
import ArchiveYearNav from '@/components/sidebar/ArchiveYearNav'
import AppSidebarRight from '@/components/AppSidebarRight'
import { getArchives, convertArchiveToPost, getMdFileContent } from '@/lib/api'
import type { Archive } from '@/lib/api'
import { logger } from '@/lib/logger'
import ArchiveYearList from '@/components/ArchiveYearList'
import MobilePageHeader from '@/components/mobile/MobilePageHeader'
import { locales } from '@/i18n'
import { getSiteBaseUrl } from '@/lib/site-url'
type ArchivePageProps = {
  params: Promise<{ locale: string }>
}

type ArchivePost = {
  slug: string
  title: string
  date: string
  description?: string
  tags: string[]
}

// 静态生成配置：归档页面缓存 60 秒，确保更新及时显示
export const revalidate = 60

export async function generateMetadata({
  params,
}: ArchivePageProps): Promise<Metadata> {
  const { locale } = await params
  const archiveT = await getTranslations('archive')
  const siteUrl = getSiteBaseUrl()
  const canonical = `${siteUrl}/${locale}/archive`

  return {
    title: archiveT('title'),
    description: archiveT('subtitle'),
    alternates: {
      canonical,
      languages: Object.fromEntries(
        locales.map((item) => [item, `${siteUrl}/${item}/archive`])
      ),
    },
    openGraph: {
      title: archiveT('title'),
      description: archiveT('subtitle'),
      type: 'website',
      url: canonical,
    },
  }
}

export default async function ArchivePage({ params }: ArchivePageProps) {
  const { locale } = await params
  const [archiveT, navT, archives] = await Promise.all([
    getTranslations('archive'),
    getTranslations('nav'),
    // 搜索引擎与访客页面只展示公开归档
    getArchives({ skip: 0, limit: 1000, is_public: true }),
  ])

  let archivePosts: ArchivePost[] = []
  try {
    logger.log('Fetched archives from API:', archives?.length || 0, 'items')
    if (archives && archives.length > 0) {
      // 为所有归档获取 markdown 内容以提取 frontmatter 标题
      // 使用 Promise.all 并发获取，但限制并发数量以避免过载
      const BATCH_SIZE = 5 // 每批处理 5 个
      const batches: Archive[][] = []
      for (let i = 0; i < archives.length; i += BATCH_SIZE) {
        batches.push(archives.slice(i, i + BATCH_SIZE))
      }
      
      // 按批次处理，每批内部并发
      for (const batch of batches) {
        const batchPosts = await Promise.all(
          batch.map(async (archive) => {
            try {
              // 优先使用 parsed_metadata（后端已解析好的，编码正确）
              // 只有在没有 parsed_metadata 时才获取 markdown 内容
              let markdownContent: string | undefined = undefined
              if (!archive.parsed_metadata) {
                // 如果没有 parsed_metadata，尝试获取 markdown 内容以提取 frontmatter
                // 优先使用 original_file_id 通过代理端点获取，如果失败则自动回退到 OSS 地址
                if (archive.original_file_id) {
                  // 使用 original_file_id 通过代理端点获取，传入 file_url 作为回退地址
                  markdownContent = await getMdFileContent(archive.original_file_id, true, false, archive.file_url)
                } else if (archive.file_url) {
                  // 如果没有 original_file_id，直接使用 file_url
                  markdownContent = await getMdFileContent(archive.file_url, true)
                }
              }
              const converted = convertArchiveToPost(archive, locale, markdownContent)
              return {
                slug: converted.slug,
                title: converted.title,
                date: converted.date,
                description: converted.description || '',
                tags: converted.tags || [],
              }
            } catch (error) {
              // 如果获取失败，使用 API 返回的标题作为后备（包括 parsed_metadata）
              logger.warn(`Failed to fetch content for archive ${archive.id}, using API data:`, error)
              const converted = convertArchiveToPost(archive, locale)
              return {
                slug: converted.slug,
                title: converted.title,
                date: converted.date,
                description: converted.description || '',
                tags: converted.tags || [],
              }
            }
          })
        )
        archivePosts.push(...batchPosts)
      }
      
      archivePosts = archivePosts.filter((post) => post.date && post.title) // 过滤掉没有日期或标题的文章
      logger.log('Processed archive posts:', archivePosts.length, 'items')
    }
  } catch (error) {
    logger.error('Failed to fetch archives from API:', error)
  }
  
  // 从 contentlayer 获取 posts
  const contentlayerPosts: ArchivePost[] = allPosts
    .map((post) => ({
      slug: post.slug,
      title: post.title,
      date: post.date,
      description: post.description,
      tags: post.tags || [],
    }))
    .filter((post) => post.date) // 过滤掉没有日期的文章
  
  // 合并两种数据源，去重（基于 slug）
  const allArchivePosts = [...archivePosts, ...contentlayerPosts]
  const uniquePosts = Array.from(
    new Map(allArchivePosts.map((post) => [post.slug, post])).values()
  )
  
  // 按日期排序
  const timelinePosts = uniquePosts.sort((a, b) => {
    try {
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      if (isNaN(dateA) || isNaN(dateB)) return 0
      return dateB - dateA
    } catch {
      return 0
    }
  })

  // 按年份分组
  const groupedByYear = timelinePosts.reduce<Record<number, ArchivePost[]>>((acc, post) => {
    try {
      const date = new Date(post.date)
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear()
        acc[year] = acc[year] ? [...acc[year], post] : [post]
      }
    } catch {
      // 忽略无效日期
    }
    return acc
  }, {})

  const yearSections = Object.entries(groupedByYear)
    .map(([year, posts]) => ({
      year: Number(year),
      posts,
    }))
    .sort((a, b) => b.year - a.year)

  const totalPosts = timelinePosts.length
  
  // 调试信息
  logger.log('Archive page data:', {
    archivePostsCount: archivePosts.length,
    contentlayerPostsCount: contentlayerPosts.length,
    totalPosts,
    yearSectionsCount: yearSections.length,
    yearSections: yearSections.map(s => ({ year: s.year, count: s.posts.length }))
  })

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
                  <ArchiveYearNav locale={locale} />
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
            <div className="relative z-10 space-y-3 max-md:space-y-3 sm:space-y-0">
              <MobilePageHeader
                title={archiveT('title')}
                subtitle={archiveT('subtitle')}
                backHref={`/${locale}`}
                backLabel={navT('archive')}
                trailing={
                  <span className="shrink-0 rounded-full bg-[var(--theme-tag-bg)] px-2 py-0.5 text-[10px] font-medium tabular-nums text-[var(--theme-primary-700)] dark:text-[var(--theme-primary-300)]">
                    {totalPosts}
                  </span>
                }
              />
              <div
                className="relative isolate max-md:border-0 max-md:bg-transparent max-md:p-0 max-md:shadow-none md:rounded-[32px] md:border md:card-padding md:shadow-2xl md:bg-white md:dark:bg-[#111827]"
                style={{ borderColor: 'var(--theme-card-border)' }}
              >
                <div className="mb-6 hidden md:block">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 sm:text-3xl">
                    {archiveT('title')}
                  </h1>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    {archiveT('subtitle')}
                  </p>
                  <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                    {archiveT('postsCount', { count: totalPosts })}
                  </p>
                </div>
                <ArchiveYearList
                  locale={locale}
                  yearSections={yearSections}
                  emptyLabel={archiveT('empty')}
                  getYearPostsLabel={(count) => archiveT('yearPosts', { count })}
                />
              </div>
            </div>
          }
        />
    </div>
  )
}


