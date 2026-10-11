import { Suspense } from 'react'
import Navbar from '@/components/Navbar'
import ArchiveHeroBanner from '@/components/ArchiveHeroBanner'
import PageLayout from '@/components/PageLayout'
import AppSidebarLeft from '@/components/AppSidebarLeft'
import GameShowcase from '@/components/GameShowcase'
import { LeftSidebarFallback, RightSidebarFallback } from '@/components/layout/PageSidebarFallback'
import {
  GamesCategoryCard,
  GamesHighlightsCard,
  GamesPlatformCard,
  GamesStatusCard,
  GamesSummaryCard,
} from '@/components/sidebar/MediaStatsCards'
import { getGamesOverview } from '@/lib/api'

type GamesPageProps = {
  params: Promise<{ locale: string }>
}

export default async function GamesPage({ params }: GamesPageProps) {
  const { locale } = await params
  const gamesOverview = await getGamesOverview()

  return (
    <div
      className="min-h-screen bg-gradient-to-b"
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
              <GamesSummaryCard overview={gamesOverview} locale={locale} />
              <GamesStatusCard overview={gamesOverview} locale={locale} />
            </AppSidebarLeft>
          </Suspense>
        }
        rightSidebar={
          <Suspense fallback={<RightSidebarFallback />}>
            <GamesCategoryCard overview={gamesOverview} locale={locale} />
            <GamesPlatformCard overview={gamesOverview} locale={locale} />
            <GamesHighlightsCard overview={gamesOverview} locale={locale} />
          </Suspense>
        }
        content={
          <Suspense
            fallback={
              <div className="space-y-6">
                <div className="h-40 rounded-3xl bg-white/60 dark:bg-gray-900/50 animate-pulse" />
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="h-48 rounded-2xl bg-white/60 dark:bg-gray-900/50 animate-pulse" />
                  ))}
                </div>
              </div>
            }
          >
            <GameShowcase locale={locale} compactLayout initialOverview={gamesOverview} />
          </Suspense>
        }
      />
    </div>
  )
}
