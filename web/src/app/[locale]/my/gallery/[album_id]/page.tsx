import { notFound } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import ArchiveHeroBanner from '@/components/ArchiveHeroBanner'
import PageLayout from '@/components/PageLayout'
import { getAlbumById } from '@/lib/api'
import AlbumPhotoGrid from '@/components/AlbumPhotoGrid'
import { format } from 'date-fns'
import { isValidLocale } from '@/i18n'
import { resolveNestedMessage } from '@/lib/i18n-utils'
import type { Messages } from '@/types/messages'
import { logger } from '@/lib/logger'
import MobileBackBar from '@/components/mobile/MobileBackBar'
import { Chip } from '@/components/ui/Chip'
import { getTranslations } from 'next-intl/server'

/**
 * 直接加载翻译文件（不依赖 getRequestConfig）
 */
async function loadMessages(locale: string): Promise<Messages> {
  try {
    const messages = (await import(`@/messages/${locale}.json`)).default;
    return messages as Messages;
  } catch (error) {
    logger.error(`[AlbumDetailPage] Failed to load messages for locale: ${locale}`, error);
    // 如果加载失败，尝试加载默认语言
    const defaultMessages = (await import(`@/messages/zh.json`)).default;
    return defaultMessages as Messages;
  }
}

export const revalidate = 60

export default async function AlbumDetailPage({
  params,
}: {
  params: Promise<{ locale: string; album_id: string }>
}) {
  const { locale, album_id } = await params
  const albumId = parseInt(album_id, 10)

  if (isNaN(albumId)) {
    notFound()
  }

  // 验证 locale 并加载翻译
  const validLocale = isValidLocale(locale) ? locale : 'zh'
  const galleryNavT = await getTranslations('gallery')
  const [messages, album] = await Promise.all([
    loadMessages(validLocale),
    getAlbumById(albumId),
  ])
  
  const galleryMessages = messages.gallery
  
  const galleryT = (key: string) => resolveNestedMessage(galleryMessages, key)

  if (!album) {
    notFound()
  }

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
          content={
            <div className="max-md:mobile-article-shell">
            <MobileBackBar href={`/${locale}/my/gallery`} label={galleryNavT('gallery')} />

            <Link
              href={`/${locale}/my/gallery`}
              className="mb-6 hidden items-center gap-2 text-sm text-gray-600 transition-colors hover:text-[var(--theme-primary-600)] dark:text-gray-400 dark:hover:text-[var(--theme-primary-300)] md:inline-flex"
            >
              <span>←</span>
              <span>{galleryT('backToGallery')}</span>
            </Link>

            <div
              className="mobile-app-section max-md:mobile-page-card mb-3 rounded-2xl border p-3 backdrop-blur sm:mb-8 md:rounded-[32px] sm:p-6 md:p-8"
              style={{
                backgroundColor: 'var(--theme-card-bg-90)',
                borderColor: 'var(--theme-card-border)',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
              }}
            >
              <div className="mb-2 hidden items-center gap-3 md:mb-4 md:flex">
                <div className="h-8 w-1 rounded-full accent-bar-theme" />
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 sm:text-3xl">
                  {album.title}
                </h1>
              </div>
              <h1 className="mb-2 line-clamp-2 text-lg font-bold text-gray-900 dark:text-gray-100 md:hidden">
                {album.title}
              </h1>

              {album.description && (
                <p className="mb-3 line-clamp-3 text-xs leading-relaxed text-gray-600 dark:text-gray-400 max-md:mb-2 md:mb-6 md:line-clamp-none md:text-base">
                  {album.description}
                </p>
              )}

              <div className="chip-scroll flex gap-1 overflow-x-auto pb-0.5 md:hidden">
                <Chip>
                  {album.photo_count || album.photos?.length || 0} {galleryT('photos')}
                </Chip>
                {album.view_count > 0 && (
                  <Chip>
                    {album.view_count} {galleryT('views')}
                  </Chip>
                )}
                <Chip>{format(new Date(album.created_at), 'yyyy-MM-dd')}</Chip>
                {album.tags?.map((tag) => (
                  <Chip key={tag}>{tag}</Chip>
                ))}
              </div>

              <div className="hidden flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400 md:flex">
                <span className="flex items-center gap-1">
                  <span>📷</span>
                  <span>
                    {album.photo_count || album.photos?.length || 0} {galleryT('photos')}
                  </span>
                </span>
                {album.view_count > 0 && (
                  <span className="flex items-center gap-1">
                    <span>👁️</span>
                    <span>
                      {album.view_count} {galleryT('views')}
                    </span>
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <span>📅</span>
                  <span>{format(new Date(album.created_at), 'yyyy-MM-dd')}</span>
                </span>
              </div>

              {album.tags && album.tags.length > 0 && (
                <div className="mt-4 hidden flex-wrap gap-2 md:flex">
                  {album.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-pink-50 px-3 py-1 text-xs text-pink-600 dark:bg-gray-700 dark:text-pink-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div
              className="mobile-app-section max-md:mobile-page-card rounded-2xl border p-2 backdrop-blur max-md:p-2 md:rounded-[32px] sm:p-6 md:p-8"
              style={{
                backgroundColor: 'var(--theme-card-bg-90)',
                borderColor: 'var(--theme-card-border)',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
              }}
            >
              <AlbumPhotoGrid photos={album.photos || []} />
            </div>
            </div>
          }
        />
    </div>
  )
}

