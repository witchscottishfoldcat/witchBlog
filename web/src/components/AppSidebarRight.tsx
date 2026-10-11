import { Suspense } from 'react'
import { getTranslations } from 'next-intl/server'
import { SidebarCard } from '@/components/Sidebar'
import RSSSubscribeCard from '@/components/RSSSubscribeCard'
import LatestUpdatesSidebar from './LatestUpdatesSidebar'
import MusicPlayerWrapper from '@/components/MusicPlayerWrapper'
import type { ReactNode } from 'react'
interface AppSidebarRightProps {
  locale: string
  latestUpdatesReplacement?: ReactNode
}

export default async function AppSidebarRight({ locale, latestUpdatesReplacement }: AppSidebarRightProps) {
  const navT = await getTranslations('nav')

  return (
    <>
      {latestUpdatesReplacement || (
        <Suspense fallback={null}>
          <LatestUpdatesSidebar locale={locale} />
        </Suspense>
      )}

      <RSSSubscribeCard />

      <SidebarCard title={navT('music')}>
        <MusicPlayerWrapper />
      </SidebarCard>
    </>
  )
}
