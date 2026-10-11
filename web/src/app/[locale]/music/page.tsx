import { Suspense } from 'react'
import Navbar from '@/components/Navbar'
import ArchiveHeroBanner from '@/components/ArchiveHeroBanner'
import PageLayout from '@/components/PageLayout'
import AppSidebarLeft from '@/components/AppSidebarLeft'
import MusicHall from '@/components/MusicHall'
import MobilePageHeader from '@/components/mobile/MobilePageHeader'
import { LeftSidebarFallback, RightSidebarFallback } from '@/components/layout/PageSidebarFallback'
import {
  MusicCategoryCard,
  MusicPlaylistCard,
  MusicRecentCard,
  MusicSummaryCard,
} from '@/components/sidebar/MediaStatsCards'
import VinylPlayerCard from '@/components/sidebar/VinylPlayerCard'
import { getMusicHome } from '@/lib/api'
import { getTranslations } from 'next-intl/server'

type MusicPageProps = {
  params: Promise<{ locale: string }>
}

export default async function MusicPage({ params }: MusicPageProps) {
  const { locale } = await params
  const navT = await getTranslations('nav')
  const musicHome = await getMusicHome()

  const titleText =
    locale === 'zh' ? '音乐馆' : locale === 'ja' ? '音楽館' : locale === 'ko' ? '뮤직' : 'Music'
  const subTitleText =
    locale === 'zh'
      ? '浏览歌单与最近播放'
      : locale === 'ja'
        ? 'プレイリストと最近再生'
        : locale === 'ko'
          ? '플레이리스트와 최근 재생'
          : 'Playlists and recent plays'

  return (
    <div
      className="min-h-screen bg-gradient-to-b max-md:bg-[var(--theme-bg-middle)]"
      style={{
        background: 'linear-gradient(to bottom, var(--theme-bg-start), var(--theme-bg-middle), var(--theme-bg-end))',
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
              <MusicSummaryCard home={musicHome} locale={locale} />
            </AppSidebarLeft>
          </Suspense>
        }
        rightSidebar={
          <Suspense fallback={<RightSidebarFallback />}>
            <VinylPlayerCard locale={locale} />
            <MusicCategoryCard home={musicHome} locale={locale} />
            <MusicPlaylistCard home={musicHome} locale={locale} />
            <MusicRecentCard home={musicHome} locale={locale} />
          </Suspense>
        }
        content={
          <div className="relative z-10">
            <MobilePageHeader
              title={titleText}
              subtitle={subTitleText}
              backHref={`/${locale}`}
              backLabel={navT('music')}
            />
            <Suspense
              fallback={
                <div className="space-y-6">
                  <div className="h-40 rounded-3xl bg-white/60 dark:bg-gray-900/50 animate-pulse" />
                  <div className="h-64 rounded-3xl bg-white/60 dark:bg-gray-900/50 animate-pulse" />
                </div>
              }
            >
              <MusicHall locale={locale} compactLayout initialHome={musicHome} />
            </Suspense>
          </div>
        }
      />
    </div>
  )
}
