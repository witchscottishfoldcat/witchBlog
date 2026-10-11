import { Suspense, type ReactNode } from 'react'
import dynamic from 'next/dynamic'
import { getTranslations } from 'next-intl/server'
import { getPublicSiteConfig } from '@/lib/api'
import { ProfileCard, SidebarCard } from '@/components/Sidebar'
import SidebarAnnouncementCard from '@/components/sidebar/SidebarAnnouncementCard'
import { buildProfileFallback, ProfileCardWithLinks } from '@/components/sidebar/ProfileCardWithLinks'

const TagList = dynamic(() => import('@/components/TagList'), {
  ssr: true,
  loading: () => (
    <div className="flex flex-wrap gap-2 animate-pulse">
      <span className="w-16 h-6 rounded-full bg-gray-200 dark:bg-gray-800" />
      <span className="w-12 h-6 rounded-full bg-gray-200 dark:bg-gray-800" />
      <span className="w-20 h-6 rounded-full bg-gray-200 dark:bg-gray-800" />
    </div>
  ),
})

const CategoryList = dynamic(() => import('@/components/CategoryList'), {
  ssr: true,
  loading: () => (
    <div className="space-y-2 animate-pulse">
      <div className="h-4 rounded bg-gray-200 dark:bg-gray-800" />
      <div className="h-4 rounded bg-gray-200 dark:bg-gray-800" />
      <div className="h-4 rounded bg-gray-200 dark:bg-gray-800" />
    </div>
  ),
})

interface AppSidebarLeftProps {
  locale: string
  showCategoriesAndTags?: boolean
  showAnnouncement?: boolean
  children?: ReactNode
}

export default async function AppSidebarLeft({ locale, showCategoriesAndTags = false, showAnnouncement = true, children }: AppSidebarLeftProps) {
  const [t, siteConfig] = await Promise.all([
    getTranslations('sidebar'),
    getPublicSiteConfig(),
  ])

  const profileDataFallback = buildProfileFallback(siteConfig)

  return (
    <>
      <Suspense fallback={<ProfileCard {...profileDataFallback} />}>
        <ProfileCardWithLinks siteConfig={siteConfig} />
      </Suspense>

      {showAnnouncement && <SidebarAnnouncementCard locale={locale} siteConfig={siteConfig} />}

      {showCategoriesAndTags ? (
        <>
          <SidebarCard title={t('categories')}>
            <Suspense fallback={null}>
              <CategoryList locale={locale} />
            </Suspense>
          </SidebarCard>

          <SidebarCard title={t('tags')}>
            <Suspense fallback={null}>
              <TagList locale={locale} />
            </Suspense>
          </SidebarCard>
        </>
      ) : (
        children
      )}
    </>
  )
}
