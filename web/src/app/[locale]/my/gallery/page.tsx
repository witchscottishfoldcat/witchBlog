import { Suspense } from 'react'
import Navbar from '@/components/Navbar'
import ArchiveHeroBanner from '@/components/ArchiveHeroBanner'
import PageLayout from '@/components/PageLayout'
import AppSidebarLeft from '@/components/AppSidebarLeft'
import dynamic from 'next/dynamic'
import type { GalleryEntry } from '@/components/GalleryList'
import Link from 'next/link'
import { Icon } from '@iconify/react'
import { SidebarCard } from '@/components/Sidebar'
import { LeftSidebarFallback, RightSidebarFallback } from '@/components/layout/PageSidebarFallback'

// 懒加载非关键客户端组件
const GalleryList = dynamic(() => import('@/components/GalleryList').then(mod => mod.default), {
  loading: () => <div className="text-center py-12"><p className="text-gray-500">加载中...</p></div>,
  ssr: true,
})
import { getAlbums, convertAlbumToGalleryEntry } from '@/lib/api'
import GalleryPagination from '@/components/GalleryPagination'
import { isValidLocale } from '@/i18n'
import { resolveNestedMessage } from '@/lib/i18n-utils'
import type { Messages } from '@/types/messages'
import { logger } from '@/lib/logger'
import MobilePageHeader from '@/components/mobile/MobilePageHeader'
import PageIntroCard from '@/components/PageIntroCard'
import { getTranslations } from 'next-intl/server'

/**
 * 直接加载翻译文件（不依赖 getRequestConfig）
 */
async function loadMessages(locale: string): Promise<Messages> {
  try {
    const messages = (await import(`@/messages/${locale}.json`)).default;
    return messages as Messages;
  } catch (error) {
    logger.error(`[GalleryPage] Failed to load messages for locale: ${locale}`, error);
    // 如果加载失败，尝试加载默认语言
    const defaultMessages = (await import(`@/messages/zh.json`)).default;
    return defaultMessages as Messages;
  }
}

export default async function GalleryPage({ 
  params,
  searchParams,
}: { 
  params: Promise<{ locale: string }>
  searchParams: Promise<{ skip?: string; limit?: string; tag?: string; sort_by?: string }>
}) {
  const { locale } = await params
  const searchParamsData = await searchParams
  
  // 验证 locale 并加载翻译
  const validLocale = isValidLocale(locale) ? locale : 'zh'
  const galleryNavT = await getTranslations('gallery')
  const messages = await loadMessages(validLocale)
  const galleryMessages = messages.gallery
  
  const galleryT = (key: string) => resolveNestedMessage(galleryMessages, key)
  
  // 开发环境下记录翻译值
  if (process.env.NODE_ENV === 'development') {
    logger.log(`[GalleryPage] Locale: ${locale}, ValidLocale: ${validLocale}`)
    logger.log(`[GalleryPage] Title: ${galleryT('title')}`)
    logger.log(`[GalleryPage] Subtitle: ${galleryT('subtitle')}`)
  }

  // 获取所有相册用于侧边栏统计
  const allAlbumsResponse = await getAlbums({ skip: 0, limit: 1000, public_only: true })
  const allAlbums = allAlbumsResponse.albums

  // 统计标签
  const tagCounts = new Map<string, number>()
  let totalPhotos = 0
  let totalViews = 0

  allAlbums.forEach((album) => {
    totalPhotos += (album.photo_count as number) || 0
    totalViews += (album.view_count as number) || 0
    const tags: string[] = album.tags || []
    tags.forEach((tag: string) => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
    })
  })

  const tagStats = Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag, count]) => ({ tag, count }))

  const tagParam = searchParamsData.tag || ''

  // 从 API 获取相册数据（分页）
  const albumsResponse = await getAlbums({
    skip: searchParamsData.skip ? parseInt(searchParamsData.skip, 10) : 0,
    limit: searchParamsData.limit ? parseInt(searchParamsData.limit, 10) : 20,
    public_only: true,
    tag: searchParamsData.tag || null,
    sort_by: (searchParamsData.sort_by as 'created_at' | 'updated_at' | 'view_count' | 'title') || 'created_at',
  })

  // 转换为 GalleryEntry 格式
  const entriesWithLocale: GalleryEntry[] = albumsResponse.albums.map((album) =>
    convertAlbumToGalleryEntry(album, locale)
  )

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
          forceThreeColumn
          leftSidebar={
            <Suspense fallback={<LeftSidebarFallback />}>
              <AppSidebarLeft locale={locale} showAnnouncement={false}>
                {/* 相册统计 */}
                <SidebarCard>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="min-w-0 rounded-xl bg-[var(--theme-primary-50)] px-2 py-3 text-center">
                      <Icon icon="mdi:image-album-outline" className="mx-auto h-4 w-4 text-[var(--theme-primary-500)]" aria-hidden />
                      <p className="mt-1 text-xl font-bold tabular-nums text-gray-800 dark:text-gray-100">{allAlbums.length}</p>
                      <p className="mt-0.5 truncate text-[9px] text-gray-500 dark:text-gray-400" title={galleryT('albumsLabel') || '个相册'}>{galleryT('albumsLabel') || '个相册'}</p>
                    </div>
                    <div className="min-w-0 rounded-xl bg-[var(--theme-primary-50)] px-2 py-3 text-center">
                      <Icon icon="mdi:image-multiple-outline" className="mx-auto h-4 w-4 text-[var(--theme-primary-500)]" aria-hidden />
                      <p className="mt-1 text-xl font-bold tabular-nums text-gray-800 dark:text-gray-100">{totalPhotos}</p>
                      <p className="mt-0.5 truncate text-[9px] text-gray-500 dark:text-gray-400" title={galleryT('photos') || '张照片'}>{galleryT('photos')}</p>
                    </div>
                  </div>
                </SidebarCard>
                {/* 总浏览量 */}
                <SidebarCard>
                  <div className="flex items-center gap-3 rounded-xl bg-[var(--theme-primary-50)] px-4 py-3">
                    <Icon icon="mdi:eye-outline" className="h-5 w-5 text-[var(--theme-primary-500)]" aria-hidden />
                    <div>
                      <p className="text-xl font-bold tabular-nums text-gray-800 dark:text-gray-100">{totalViews}</p>
                      <p className="text-[9px] text-gray-500 dark:text-gray-400">{galleryT('totalViews') || '总浏览'}</p>
                    </div>
                  </div>
                </SidebarCard>
              </AppSidebarLeft>
            </Suspense>
          }
          rightSidebar={
            <Suspense fallback={<RightSidebarFallback />}>
              {/* 标签筛选 */}
              {tagStats.length > 0 && (
                <SidebarCard title={galleryT('popularTags') || '热门标签'}>
                  <div className="flex flex-wrap gap-2">
                    {tagStats.map(({ tag, count }) => (
                      <Link
                        key={tag}
                        href={`/${locale}/my/gallery?tag=${encodeURIComponent(tag)}`}
                        className={`rounded-full px-3 py-1.5 text-[11px] font-medium transition-all hover:shadow-sm ${tagParam === tag ? 'bg-[var(--theme-primary-500)] text-white shadow-sm' : 'bg-[var(--theme-primary-50)] text-[var(--theme-primary-600)] hover:bg-[var(--theme-primary-100)]'}`}
                      >
                        {tag}
                        <span className={`ml-1 tabular-nums ${tagParam === tag ? 'text-white/80' : 'text-[var(--theme-primary-400)]'}`}>
                          {count}
                        </span>
                      </Link>
                    ))}
                  </div>
                </SidebarCard>
              )}
            </Suspense>
          }
          content={
            <div className="space-y-3 sm:space-y-8">
            <MobilePageHeader
              title={galleryT('title')}
              subtitle={galleryT('subtitle')}
              backHref={`/${locale}`}
              backLabel={galleryNavT('gallery')}
            />
            <PageIntroCard title={galleryT('title')} subtitle={galleryT('subtitle')} />
            <GalleryList
              entries={entriesWithLocale}
            />
            
            {/* Pagination */}
            {albumsResponse.total > 0 && (
              <GalleryPagination
                currentSkip={searchParamsData.skip ? parseInt(searchParamsData.skip, 10) : 0}
                limit={searchParamsData.limit ? parseInt(searchParamsData.limit, 10) : 20}
                total={albumsResponse.total}
                basePath={`/${locale}/my/gallery`}
                locale={locale}
                labels={{
                  previous: galleryT('pagination.previous'),
                  next: galleryT('pagination.next'),
                  showing: galleryT('pagination.showing'),
                  of: galleryT('pagination.of'),
                  results: galleryT('pagination.results'),
                }}
              />
            )}
            </div>
          }
        />
    </div>
  )
}


