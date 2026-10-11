import dynamic from 'next/dynamic'
import AppSidebarLeft from '@/components/AppSidebarLeft'
import AppSidebarRight from '@/components/AppSidebarRight'
import PageLayout from '@/components/PageLayout'
import { LeftSidebarFallback, RightSidebarFallback } from '@/components/layout/PageSidebarFallback'
import { Suspense } from 'react'
import {
  getPublicMdFiles,
  convertMdFileToPost,
} from '@/lib/api'
import MobilePageHeader from '@/components/mobile/MobilePageHeader'
import { getTranslations } from 'next-intl/server'
import { logger } from '@/lib/logger'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { bannerConfig } from '@/config/assets'
import Pagination from '@/components/Pagination'

const HOME_POSTS_PER_PAGE = 10

// 懒加载关键组件，减轻首屏负担
const Navbar = dynamic(() => import('@/components/Navbar'), {
  ssr: true,
  loading: () => <div className="fixed top-0 left-0 right-0 z-50 h-16 bg-transparent" />,
})

const ArchiveHeroBanner = dynamic(() => import('@/components/ArchiveHeroBanner'), {
  ssr: true,
  loading: () => <div className="h-[min(420px,55vh)] w-full bg-gradient-to-br from-pink-100 to-purple-100 animate-pulse sm:h-[480px] md:h-[clamp(760px,82vh,900px)] dark:from-gray-900 dark:to-gray-800" />,
})

const PostList = dynamic(() => import('@/components/PostList'), {
  loading: () => (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-40 rounded-2xl bg-white/70 dark:bg-gray-900/60 shadow-md animate-pulse" />
      ))}
    </div>
  ),
  ssr: true,
})

// 静态生成配置：每 120 秒重新生成（优化首屏加载）
export const revalidate = 120

export default async function HomePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { locale } = await params;
  const { page: pageParam } = await searchParams
  const parsedPage = Number.parseInt(pageParam || '1', 10)
  const currentPage = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1

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
          <Suspense fallback={<LeftSidebarFallback />}>
            <AppSidebarLeft locale={locale} showCategoriesAndTags />
          </Suspense>
        }
        rightSidebar={
          <Suspense fallback={<RightSidebarFallback />}>
            <AppSidebarRight locale={locale} />
          </Suspense>
        }
        content={
          <Suspense
            fallback={
              <div className="space-y-4">
                <div className="h-9 w-40 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
                <div className="space-y-4">
                  <div className="h-40 rounded-2xl bg-white/70 dark:bg-gray-900/60 shadow-md animate-pulse" />
                  <div className="h-40 rounded-2xl bg-white/70 dark:bg-gray-900/60 shadow-md animate-pulse" />
                  <div className="h-40 rounded-2xl bg-white/70 dark:bg-gray-900/60 shadow-md animate-pulse" />
                </div>
              </div>
            }
          >
            <HomePostSection locale={locale} currentPage={currentPage} />
          </Suspense>
        }
      />
      
    </div>
  );
}

/**
 * 首页文章列表区域（服务端组件）
 * 只负责拉文章接口并渲染列表，由 Suspense 控制加载骨架
 */
function bannerLocaleText(
  map: { zh: string; en: string; ja: string; ko: string },
  locale: string
): string {
  const key = locale as keyof typeof map
  return map[key] || map.zh || map.en
}

async function HomePostSection({
  locale,
  currentPage,
}: {
  locale: string
  currentPage: number
}) {
  const t = await getTranslations('posts')
  const blogT = await getTranslations('blog')
  const heroItem = bannerConfig.items[0]
  const heroTitle = bannerLocaleText(heroItem.title, locale)
  const heroSubtitle = bannerLocaleText(heroItem.subtitle, locale)
  let totalPages = 1
  let redirectPage: number | null = null
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
  }> = []

  try {
    const apiResponse = await getPublicMdFiles({
      skip: 0,
      limit: 1000,
    })

    const allPosts = apiResponse.files
      .map((file) => convertMdFileToPost(file, locale))
      .sort((a, b) => {
        if (a.pinned && !b.pinned) return -1
        if (!a.pinned && b.pinned) return 1
        return new Date(b.date).getTime() - new Date(a.date).getTime()
      })

    totalPages = Math.max(1, Math.ceil(allPosts.length / HOME_POSTS_PER_PAGE))
    if (currentPage > totalPages) redirectPage = totalPages
    const start = (currentPage - 1) * HOME_POSTS_PER_PAGE
    sortedPosts = allPosts.slice(start, start + HOME_POSTS_PER_PAGE)
  } catch (error) {
    logger.error('Failed to fetch posts from API:', error)
    sortedPosts = []
  }

  if (redirectPage !== null) {
    redirect(redirectPage === 1 ? `/${locale}` : `/${locale}?page=${redirectPage}`)
  }

  return (
    <div className="space-y-3 max-md:space-y-2">
      <div className="mobile-app-section max-md:mobile-page-card rounded-xl border p-2.5 md:hidden" style={{ borderColor: 'var(--theme-card-border)', backgroundColor: 'var(--theme-card-bg)' }}>
        <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">{heroTitle}</h2>
        <p className="mt-0.5 text-[11px] leading-snug text-gray-500 dark:text-gray-400">{heroSubtitle}</p>
      </div>
      <MobilePageHeader
        title={t('myBlogPosts')}
        subtitle={heroSubtitle}
        trailing={
          <Link
            href={`/${locale}/posts`}
            className="shrink-0 text-[11px] font-medium text-[var(--theme-primary-600)] active:opacity-70"
          >
            {blogT('viewAll')}
          </Link>
        }
      />
      <PostList posts={sortedPosts} locale={locale} compact desktopTitle={t('myBlogPosts')} />
      <Pagination
        currentPage={Math.min(currentPage, totalPages)}
        totalPages={totalPages}
        basePath={`/${locale}`}
        locale={locale}
        labels={{
          previous: t('pagination.previous'),
          next: t('pagination.next'),
          page: t('pagination.page'),
          of: t('pagination.of'),
        }}
      />
    </div>
  )
}

