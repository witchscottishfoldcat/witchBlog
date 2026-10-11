import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { format } from 'date-fns/format'
import type { Metadata } from 'next'
import { Suspense } from 'react'
import Navbar from '@/components/Navbar'
import ArchiveHeroBanner from '@/components/ArchiveHeroBanner'
import PageLayout from '@/components/PageLayout'
import AppSidebarLeft from '@/components/AppSidebarLeft'
import MarkdownContent from '@/components/MarkdownContent'
import TableOfContents from '@/components/TableOfContents'
import PostMetaIcons from '@/components/PostMetaIcons'
import { getMdFileById, getArchiveById, getMdFileContent, convertMdFileToPost, convertArchiveToPost, parseMarkdownWithFrontmatter, getPublicMdFiles, getArchives, getPublicSiteConfig } from '@/lib/api'
import PostArticleExtras from '@/components/sidebar/PostArticleExtras'
import { LeftSidebarFallback } from '@/components/layout/PageSidebarFallback'
import { logger } from '@/lib/logger'
import { normalizeTags, stripDuplicateTitleHeading } from '@/lib/post-utils'
import MobileBackBar from '@/components/mobile/MobileBackBar'
import { locales } from '@/i18n'
import { getSiteBaseUrl } from '@/lib/site-url'
import { ZCOOL_KuaiLe } from 'next/font/google'

// 站名同款卡通风字体，用于「返回首页」按钮
const zcoolKuaiLe = ZCOOL_KuaiLe({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  fallback: ['cursive', 'system-ui', 'sans-serif'],
})

// 静态生成配置：文章内容缓存 60 秒，确保更新及时显示
export const revalidate = 60

// 允许动态渲染未在 generateStaticParams 中预生成的页面
export const dynamicParams = true

// 生成静态参数：在构建时预生成所有可能的 slug
export async function generateStaticParams() {
  const params: Array<{ locale: string; slug: string }> = []
  
  try {
    // 获取所有公开的 MD 文件
    const mdFilesResponse = await getPublicMdFiles({ skip: 0, limit: 1000 })
    mdFilesResponse.files.filter((file) => !file.encrypted).forEach((file) => {
      locales.forEach((locale) => {
        params.push({ locale, slug: file.id.toString() })
      })
    })
    
    // 获取所有公开的归档文件
    const archives = await getArchives({ skip: 0, limit: 1000, is_public: true })
    archives.filter((archive) => !archive.encrypted).forEach((archive) => {
      locales.forEach((locale) => {
        params.push({ locale, slug: archive.id.toString() })
      })
    })
    
    logger.log(`generateStaticParams: Generated ${params.length} static params for posts`)
  } catch (error) {
    // 如果 API 不可用（构建时），记录警告但不阻止构建
    logger.warn('generateStaticParams: Failed to fetch posts/archives, returning empty params:', error)
  }
  
  return params
}

/**
 * 生成文章页面的 SEO metadata
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale, slug } = await params
  const fileId = parseInt(slug, 10)
  
  if (isNaN(fileId)) {
    return {
      title: 'Post Not Found',
      description: 'The requested post could not be found.',
      robots: { index: false, follow: false },
    }
  }

  try {
    // 尝试获取文章信息
    const mdFile = await getMdFileById(fileId)
    let archive = null
    
    if (!mdFile) {
      archive = await getArchiveById(fileId)
    }
    
    if (!mdFile && !archive) {
      return {
        title: 'Post Not Found',
        description: 'The requested post could not be found.',
        robots: { index: false, follow: false },
      }
    }

    // 获取文章内容以提取 frontmatter
    let post
    let rawContent = ''
    
    try {
      if (mdFile?.id) {
        rawContent = await getMdFileContent(mdFile.id, true, false, mdFile.file_url)
        post = convertMdFileToPost(mdFile, locale)
      } else if (archive) {
        if (archive.original_file_id) {
          rawContent = await getMdFileContent(archive.original_file_id, true, false, archive.file_url)
        } else if (archive.file_url) {
          rawContent = await getMdFileContent(archive.file_url)
        }
        post = convertArchiveToPost(archive, locale, rawContent)
      }
    } catch (error) {
      logger.error('Failed to fetch content for metadata:', error)
    }

    if (!post) {
      return {
        title: 'Post Not Found',
        description: 'The requested post could not be found.',
        robots: { index: false, follow: false },
      }
    }

    const siteConfig = await getPublicSiteConfig()
    const siteName = siteConfig.site_name || 'WitchCatUI'
    const siteUrl = getSiteBaseUrl()
    const canonical = `${siteUrl}/${locale}/posts/${slug}`
    const shouldIndex = !post.isEncrypted
    
    // 生成描述：优先使用文章描述，否则截取内容前150字符
    let description = post.description || ''
    if (!description && rawContent) {
      // 解析 frontmatter 并获取正文内容
      const { content: markdownContent } = parseMarkdownWithFrontmatter(rawContent)
      if (markdownContent) {
        description = markdownContent
          .replace(/[#*`]/g, '') // 移除 Markdown 标记
          .replace(/\n/g, ' ') // 替换换行为空格
          .trim()
          .slice(0, 150)
      }
    }
    if (!description) {
      description = locale === 'zh' 
        ? `${siteName} - ${post.title}`
        : `${siteName} - ${post.title}`
    }

    return {
      title: `${post.title} | ${siteName}`,
      description,
      keywords: post.tags?.join(', ') || post.category || undefined,
      authors: post.author ? [{ name: post.author }] : undefined,
      alternates: {
        canonical,
        languages: Object.fromEntries(
          locales.map((item) => [item, `${siteUrl}/${item}/posts/${slug}`])
        ),
      },
      robots: {
        index: shouldIndex,
        follow: shouldIndex,
      },
      openGraph: {
        title: post.title,
        description,
        type: 'article',
        url: canonical,
        siteName,
        publishedTime: post.date,
        tags: post.tags,
      },
      twitter: {
        card: 'summary_large_image',
        title: post.title,
        description,
      },
    }
  } catch (error) {
    logger.error('Failed to generate metadata for post:', error)
    return {
      title: 'Post | WitchCatUI',
      description: "Witch's Folded Ear Blog",
      robots: { index: false, follow: false },
    }
  }
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  const t = await getTranslations('common')
  const blogT = await getTranslations('blog')
  
  // 尝试将 slug 转换为数字 ID
  const fileId = parseInt(slug, 10)
  if (isNaN(fileId)) {
    notFound()
  }

  // 先尝试从 MdFile 获取，如果找不到，再尝试从 Archive 获取
  const mdFile = await getMdFileById(fileId)
  let archive = null
  let fileUrl = ''
  let isArchive = false

  if (mdFile) {
    fileUrl = mdFile.file_url
  } else {
    // 尝试从归档中获取
    archive = await getArchiveById(fileId)
    if (!archive) {
      notFound()
    }
    isArchive = true
    fileUrl = archive.file_url
  }

  // 获取文件内容
  // 优先使用文件 ID 通过代理端点获取，如果代理服务失败（404/500）则自动回退到使用 OSS 地址
  let rawContent = ''
  try {
    if (mdFile?.id) {
      logger.log(`[PostPage] Fetching content for MD file ID: ${mdFile.id}`)
      // 传入 file_url 作为回退地址
      rawContent = await getMdFileContent(mdFile.id, true, false, mdFile.file_url)
      logger.log(`[PostPage] Fetched content length: ${rawContent.length}`)
    } else if (archive) {
      // 对于归档文件，优先使用 original_file_id
      if (archive.original_file_id) {
        logger.log(`[PostPage] Fetching content for archive using original_file_id: ${archive.original_file_id}`)
        // 传入 file_url 作为回退地址
        rawContent = await getMdFileContent(archive.original_file_id, true, false, archive.file_url)
        logger.log(`[PostPage] Fetched content length: ${rawContent.length}`)
      } else if (fileUrl) {
        // 如果没有 original_file_id，直接使用 file_url
        logger.log(`[PostPage] Using file_url: ${fileUrl}`)
        rawContent = await getMdFileContent(fileUrl)
      }
    } else if (fileUrl) {
      logger.log(`[PostPage] Using file_url: ${fileUrl}`)
      rawContent = await getMdFileContent(fileUrl)
    }
  } catch (error) {
    logger.error(`[PostPage] Failed to fetch content:`, error)
    rawContent = ''
  }

  // 解析 frontmatter
  const { frontmatter, content: markdownContent } = parseMarkdownWithFrontmatter(rawContent)
  logger.log(`[PostPage] Parsed markdown content length: ${markdownContent.length}, has frontmatter: ${Object.keys(frontmatter).length > 0}`)
  
  // 转换为 Post 格式，优先使用 frontmatter 中的数据
  let post
  if (isArchive && archive) {
    post = convertArchiveToPost(archive, locale, rawContent)
  } else if (mdFile) {
    post = convertMdFileToPost(mdFile, locale)
  } else {
    notFound()
  }
  
  // 如果 frontmatter 中有数据，覆盖 API 返回的数据
  if (frontmatter.title) post.title = frontmatter.title
  if (frontmatter.description) post.description = frontmatter.description
  if (frontmatter.category) {
    post.category = frontmatter.category as string
  }
  if (frontmatter.subcategory) {
    post.subcategory = frontmatter.subcategory as string
  }
  if (frontmatter.tags) {
    post.tags = normalizeTags(frontmatter.tags)
  }
  if (frontmatter.published) post.date = frontmatter.published
  if (frontmatter.updated) post.date = frontmatter.updated
  
  // 去掉正文开头与标题重复的一级标题，避免和头部卡片里的标题重复显示
  const articleContent = stripDuplicateTitleHeading(markdownContent, post.title)

  // 计算字数和阅读时间
  const wordCount = articleContent ? articleContent.split(/\s+/).filter(Boolean).length : (mdFile?.word_count || archive?.word_count || 0)
  const readingTime = Math.ceil(wordCount / 200)
  const siteConfig = await getPublicSiteConfig()
  const siteUrl = getSiteBaseUrl()
  const canonicalUrl = `${siteUrl}/${locale}/posts/${slug}`
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description || undefined,
    datePublished: post.date,
    dateModified: post.date,
    mainEntityOfPage: canonicalUrl,
    url: canonicalUrl,
    inLanguage: locale,
    articleSection: post.category || undefined,
    keywords: post.tags?.join(', ') || undefined,
    wordCount,
    author: {
      '@type': 'Person',
      name: post.author || siteConfig.site_name || 'WitchCat',
    },
    publisher: {
      '@type': 'Organization',
      name: siteConfig.site_name || 'WitchCat',
    },
  }

  return (
    <div 
      className="min-h-screen bg-gradient-to-b max-md:bg-[var(--theme-bg-middle)]"
      style={{
        background: `linear-gradient(to bottom, var(--theme-bg-start), var(--theme-bg-middle), var(--theme-bg-end))`
      }}
    >
      {!post.isEncrypted && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(articleJsonLd).replace(/</g, '\\u003c'),
          }}
        />
      )}
      <Navbar />
      <div className="max-md:hidden">
        <ArchiveHeroBanner />
      </div>

        <PageLayout
          leftSidebar={
            <Suspense fallback={<LeftSidebarFallback />}>
              <AppSidebarLeft locale={locale}>
                <PostArticleExtras
                  locale={locale}
                  category={post.category}
                  subcategory={post.subcategory}
                  tags={post.tags}
                  wordCount={wordCount}
                  readingTime={readingTime}
                />
              </AppSidebarLeft>
            </Suspense>
          }
          content={
            <div className="max-md:mobile-article-shell md:rounded-none">
              <MobileBackBar
                href={isArchive ? `/${locale}/archive` : `/${locale}`}
                label={isArchive ? t('backToArchive') : t('backToHome')}
              />

              <article className="flex flex-col lg:grid lg:grid-cols-4 lg:gap-6">
                <div className="order-1 flex flex-col lg:order-1 lg:col-span-3">
                  {/* 桌面端：标题区与正文合并为同一张卡片，用细分隔线衔接，保证视觉一致 */}
                  <div className="md:rounded-xl md:border md:border-[var(--theme-card-border)] md:bg-[var(--theme-card-bg)]">
                    <header className="mt-4 mb-4 md:mt-0 md:mb-0 md:border-b md:border-[var(--theme-card-border)] md:px-6 md:pt-6 md:pb-5 lg:px-8 lg:pt-7 lg:pb-6">
                    <Link
                      href={isArchive ? `/${locale}/archive` : `/${locale}`}
                      className="group mb-3 hidden items-center no-underline md:inline-flex"
                    >
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--theme-primary-200)] px-3.5 py-1 text-[var(--theme-primary-600)] transition-colors duration-200 group-hover:bg-[var(--theme-primary-100)] dark:border-[var(--theme-primary-300)]/40 dark:text-[var(--theme-primary-300)] dark:group-hover:bg-white/5">
                        <svg
                          className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M19 12H5" />
                          <path d="m11 6-6 6 6 6" />
                        </svg>
                        <span className={`text-sm leading-none tracking-wide ${zcoolKuaiLe.className}`}>
                          {isArchive ? t('backToArchive') : t('backToHome')}
                        </span>
                      </span>
                    </Link>

                    <h1
                      className="mb-4 flex items-start gap-3 break-all text-xl font-bold leading-snug text-gray-900 dark:text-gray-100 sm:text-2xl md:text-3xl lg:text-4xl"
                    >
                      <span
                        aria-hidden="true"
                        className="mt-[0.32em] h-[0.95em] w-1 shrink-0 rounded-full bg-[var(--theme-primary-500)]"
                      />
                      {post.title}
                    </h1>

                    <PostMetaIcons
                      wordCount={wordCount}
                      readingTime={readingTime}
                      date={format(new Date(post.date), 'yyyy-MM-dd')}
                      category={post.category}
                      subcategory={post.subcategory}
                      tags={post.tags}
                      wordsLabel={t('words')}
                      readingTimeLabel={t('readingTime')}
                    />

                    {post.description && (
                      <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-gray-500 dark:text-gray-400 md:text-[15px]">
                        {post.description}
                      </p>
                    )}

                    {post.isEncrypted && (
                      <div className="mt-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-900/20 md:mt-4 md:p-4">
                        <p className="text-xs text-yellow-800 dark:text-yellow-300 sm:text-sm">
                          🔒 {blogT('encrypted')}
                        </p>
                      </div>
                    )}
                    </header>

                    <div className="mb-4 lg:hidden">
                      <TableOfContents />
                    </div>

                    <div className="max-md:mobile-article-body p-4 sm:p-6 md:px-8 md:pb-8 md:pt-5">
                    {markdownContent && markdownContent.trim() ? (
                      <MarkdownContent content={articleContent} mobileReader />
                    ) : rawContent && rawContent.trim() ? (
                      <MarkdownContent content={rawContent} mobileReader />
                    ) : (
                      <div className="py-8 text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                          <span className="text-3xl">🔒</span>
                        </div>
                        <p className="font-medium text-gray-600 dark:text-gray-300">
                          {isArchive
                            ? locale === 'zh'
                              ? '该归档内容为私有或链接已失效，暂无法查看正文。'
                              : 'This archived content is private or the link is no longer valid.'
                            : locale === 'zh'
                              ? '当前文章内容暂无权限或暂时无法加载。'
                              : 'This post content is not accessible or cannot be loaded at the moment.'}
                        </p>
                        {process.env.NODE_ENV === 'development' && (
                          <p className="mt-4 text-xs text-gray-400">
                            Debug: rawContent length: {rawContent.length}, markdownContent length:{' '}
                            {markdownContent?.length || 0}
                          </p>
                        )}
                      </div>
                    )}
                    </div>
                  </div>
                </div>

                <div className="order-2 hidden lg:order-2 lg:col-span-1 lg:mt-0 lg:block">
                  <div className="lg:sticky lg:top-24">
                    <TableOfContents />
                  </div>
                </div>
              </article>
            </div>
          }
        />
    </div>
  )
}


