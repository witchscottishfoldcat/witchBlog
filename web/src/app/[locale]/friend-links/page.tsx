import { Suspense } from 'react'
import Navbar from '@/components/Navbar'
import ArchiveHeroBanner from '@/components/ArchiveHeroBanner'
import PageLayout from '@/components/PageLayout'
import AppSidebarLeft from '@/components/AppSidebarLeft'
import FriendLinkTagsNav from '@/components/sidebar/FriendLinkTagsNav'
import AppSidebarRight from '@/components/AppSidebarRight'
import FriendLinkList, { FriendLink } from '@/components/FriendLinkList'
import { getLinks, convertLinkToFriendLink } from '@/lib/api'
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
    logger.error(`[FriendLinksPage] Failed to load messages for locale: ${locale}`, error);
    // 如果加载失败，尝试加载默认语言
    const defaultMessages = (await import(`@/messages/zh.json`)).default;
    return defaultMessages as Messages;
  }
}

export default async function FriendLinksPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  
  // 验证 locale 并加载翻译
  const validLocale = isValidLocale(locale) ? locale : 'zh'
  const messages = await loadMessages(validLocale)
  const friendLinksMessages = messages.friendLinks
  
  // 创建翻译函数
  const friendLinksT = (key: string) => resolveNestedMessage(friendLinksMessages, key)
  
  // 开发环境下记录翻译值
  if (process.env.NODE_ENV === 'development') {
    logger.log(`[FriendLinksPage] Locale: ${locale}, ValidLocale: ${validLocale}`)
    logger.log(`[FriendLinksPage] Title: ${friendLinksT('title')}`)
    logger.log(`[FriendLinksPage] Subtitle: ${friendLinksT('subtitle')}`)
  }

  // 从 API 获取友链列表
  let friendLinks: FriendLink[] = []
  try {
    const apiLinks = await getLinks({
      is_active: true,
      skip: 0,
      limit: 100,
      sort_by: 'sort_order',
    })
    
    // 转换为组件需要的格式
    friendLinks = apiLinks.map(link => convertLinkToFriendLink(link, locale))
    
    // 按 sort_order 排序（降序，数字越大越靠前）
    friendLinks.sort((a, b) => (b.sortOrder || 0) - (a.sortOrder || 0))
    
    logger.log(`FriendLinks: Fetched ${friendLinks.length} links from API`)
  } catch (error) {
    logger.error('Failed to fetch friend links from API:', error)
    friendLinks = []
  }

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
                  <FriendLinkTagsNav locale={locale} />
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
              <FriendLinkList
                links={friendLinks}
                title={friendLinksT('title')}
                subtitle={friendLinksT('subtitle')}
                noFriendLinksText={friendLinksT('noFriendLinks')}
              />
            </div>
          }
        />
    </div>
  )
}

