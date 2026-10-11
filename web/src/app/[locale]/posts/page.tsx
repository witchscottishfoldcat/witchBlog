import { Suspense } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { allPosts } from 'contentlayer/generated'
import { getTranslations } from 'next-intl/server'
import Navbar from '@/components/Navbar'
import ArchiveHeroBanner from '@/components/ArchiveHeroBanner'
import PageLayout from '@/components/PageLayout'
import AppSidebarLeft from '@/components/AppSidebarLeft'
import RecentPostsNav from '@/components/sidebar/RecentPostsNav'
import CategoryPostsNav from '@/components/sidebar/CategoryPostsNav'
import TagPostsNav from '@/components/sidebar/TagPostsNav'
import AppSidebarRight from '@/components/AppSidebarRight'
import { LeftSidebarFallback, RightSidebarFallback } from '@/components/layout/PageSidebarFallback'
import PostList from '@/components/PostList'
import MobilePageHeader from '@/components/mobile/MobilePageHeader'
import PageIntroCard from '@/components/PageIntroCard'
import { NAV_ROUTES } from '@/constants'
import { getPublicMdFiles, getArchives, convertMdFileToPost, convertArchiveToPost } from '@/lib/api'
import { logger } from '@/lib/logger'
import { locales } from '@/i18n'
import { getSiteBaseUrl } from '@/lib/site-url'
export const revalidate = 120

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations('posts')
  const siteUrl = getSiteBaseUrl()
  const canonical = `${siteUrl}/${locale}/posts`
  const description = locale === 'zh'
    ? '浏览 WitchCat 的博客文章、技术记录与生活分享。'
    : locale === 'ja'
      ? 'WitchCat のブログ記事、技術メモ、日々の記録をご覧ください。'
      : locale === 'ko'
        ? 'WitchCat의 블로그 글, 기술 기록과 일상 이야기를 둘러보세요.'
        : "Browse WitchCat's blog posts, technical notes, and life stories."

  return {
    title: t('myBlogPosts'),
    description,
    alternates: {
      canonical,
      languages: Object.fromEntries(
        locales.map((item) => [item, `${siteUrl}/${item}/posts`])
      ),
    },
    openGraph: {
      title: t('myBlogPosts'),
      description,
      type: 'website',
      url: canonical,
    },
  }
}

export default async function PostsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string; subcategory?: string; tag?: string }>;
}) {
  const { locale } = await params;
  const { category: categoryParam, subcategory: subcategoryParam, tag: tagParam } = await searchParams;
  const t = await getTranslations('posts')
  const commonT = await getTranslations('common')
  const sidebarT = await getTranslations('sidebar')

  let sortedPosts: Array<{
    slug: string
    title: string
    date: string
    description?: string
    category?: string
    subcategory?: string
    tags?: string[]
    wordCount?: number
    isEncrypted?: boolean
    pinned?: boolean
    author?: string
  }> = []
  let categorySubcategories: Array<{ label: string; count: number }> = []

  try {
    // 从后端 API 获取文章（MD 文件 + 归档）
    const [mdFilesResponse, archives] = await Promise.all([
      getPublicMdFiles({ skip: 0, limit: 100 }),
      getArchives({ skip: 0, limit: 100, is_public: true }),
    ])

    const mdPosts = mdFilesResponse.files.map((file) => convertMdFileToPost(file, locale))
    const archivePosts = archives.map((archive) => convertArchiveToPost(archive, locale))
    const contentlayerPosts = allPosts.map((post) => ({
      slug: post.slug,
      title: post.title,
      date: post.date,
      description: post.description,
      category: post.category,
      subcategory: post.subcategory,
      tags: post.tags || [],
      isEncrypted: post.encrypted,
      author: post.author,
    }))

    sortedPosts = [...mdPosts, ...archivePosts, ...contentlayerPosts].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )
  } catch (error) {
    logger.error('Failed to fetch posts from API:', error)
  }

  // 按分类筛选（点击侧边栏分类时）
  if (categoryParam && categoryParam.trim()) {
    const categoryFilter = categoryParam.trim().toLowerCase()
    sortedPosts = sortedPosts.filter(
      (post) => (post.category || '').toLowerCase() === categoryFilter
    )
    const subcategoryCounts = new Map<string, number>()
    sortedPosts.forEach((post) => {
      const label = post.subcategory?.trim()
      if (label) subcategoryCounts.set(label, (subcategoryCounts.get(label) || 0) + 1)
    })
    categorySubcategories = Array.from(subcategoryCounts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([label, count]) => ({ label, count }))
  }

  if (subcategoryParam && subcategoryParam.trim()) {
    const subcategoryFilter = subcategoryParam.trim().toLowerCase()
    sortedPosts = sortedPosts.filter(
      (post) => (post.subcategory || '').toLowerCase() === subcategoryFilter
    )
  }

  if (tagParam && tagParam.trim()) {
    const tagFilter = tagParam.trim().toLowerCase()
    sortedPosts = sortedPosts.filter((post) =>
      (post.tags || []).some((tag) => tag.trim().toLowerCase() === tagFilter)
    )
  }

  const categoryPath = [categoryParam?.trim(), subcategoryParam?.trim()].filter(Boolean).join(' › ')
  const filterPath = categoryPath || (tagParam?.trim() ? `#${tagParam.trim()}` : '')
  const categoryBackHref = subcategoryParam?.trim() && categoryParam?.trim()
    ? `${NAV_ROUTES.posts(locale)}?category=${encodeURIComponent(categoryParam.trim())}`
    : NAV_ROUTES.home(locale)
  const categoryBackLabel = subcategoryParam?.trim()
    ? sidebarT('backToParentCategory')
    : commonT('backToHome')
  const postCountLabel = locale === 'zh'
    ? `共 ${sortedPosts.length} 篇`
    : locale === 'ja'
      ? `${sortedPosts.length}件`
      : locale === 'ko'
        ? `${sortedPosts.length}개`
        : `${sortedPosts.length} posts`
  const desktopPostsTitle = (
    <>
      {t('myBlogPosts')}
      {filterPath ? (
        <span className="ml-2 align-baseline text-lg font-semibold text-gray-400 dark:text-gray-500">
          · {filterPath}
        </span>
      ) : null}
      <span className="ml-2 inline-block rounded-full bg-[var(--theme-primary-50)] px-2.5 py-0.5 align-middle text-xs font-bold text-[var(--theme-primary-600)]">
        {postCountLabel}
      </span>
    </>
  )

  return (
    <div
      className="min-h-screen bg-gradient-to-b max-md:bg-[var(--theme-bg-middle)]"
      style={{
        background: `linear-gradient(to bottom, var(--theme-bg-start), var(--theme-bg-middle), var(--theme-bg-end))`,
      }}
    >
      <Navbar />
      <div className="max-md:hidden">
        <ArchiveHeroBanner />
      </div>

        <PageLayout
          leftSidebar={
            <Suspense fallback={<LeftSidebarFallback />}>
<AppSidebarLeft locale={locale}>
                <Suspense fallback={null}>
                  {categoryParam?.trim() ? (
                    <CategoryPostsNav
                      locale={locale}
                      category={categoryParam.trim()}
                      subcategory={subcategoryParam?.trim() || undefined}
                      posts={sortedPosts}
                      subcategories={categorySubcategories}
                    />
                  ) : tagParam?.trim() ? (
                    <TagPostsNav
                      locale={locale}
                      tag={tagParam.trim()}
                      posts={sortedPosts}
                    />
                  ) : (
                    <RecentPostsNav locale={locale} />
                  )}
                </Suspense>
              </AppSidebarLeft>
            </Suspense>
          }
          rightSidebar={
            <Suspense fallback={<RightSidebarFallback />}>
<AppSidebarRight locale={locale} />
            </Suspense>
          }
          content={
            <div>
              <MobilePageHeader
                title={t('myBlogPosts')}
                subtitle={filterPath || undefined}
                backHref={categoryBackHref}
                backLabel={categoryBackLabel}
              />
              <PageIntroCard
                title={desktopPostsTitle}
                actions={filterPath ? (
                  <Link
                    href={categoryBackHref}
                    className="inline-flex items-center gap-1 rounded-full bg-[var(--theme-tag-bg)] px-2.5 py-1 text-xs font-medium text-[var(--theme-primary-700)] transition hover:bg-[var(--theme-primary-100)]"
                  >
                    <span aria-hidden>‹</span>
                    {categoryBackLabel}
                  </Link>
                ) : undefined}
              />
              <PostList posts={sortedPosts} locale={locale} />
            </div>
          }
        />
    </div>
  )
}
