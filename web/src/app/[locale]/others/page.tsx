import Link from 'next/link'
import { Suspense } from 'react'
import Navbar from '@/components/Navbar'
import ArchiveHeroBanner from '@/components/ArchiveHeroBanner'
import PageLayout from '@/components/PageLayout'
import AppSidebarLeft from '@/components/AppSidebarLeft'
import AppSidebarRight from '@/components/AppSidebarRight'
import OthersQuickNav from '@/components/sidebar/OthersQuickNav'
import { LeftSidebarFallback, RightSidebarFallback } from '@/components/layout/PageSidebarFallback'
import { getTranslations } from 'next-intl/server'

const othersPages = [
  { key: 'projects', icon: '💼', href: '/projects', color: 'from-blue-500 to-cyan-500' },
  { key: 'skills', icon: '🧠', href: '/skills', color: 'from-purple-500 to-pink-500' },
  { key: 'timeline', icon: '📈', href: '/timeline', color: 'from-orange-500 to-red-500' },
] as const

export default async function OthersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const othersT = await getTranslations('others')

  return (
    <div
      className="min-h-screen bg-gradient-to-b"
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
                  <OthersQuickNav locale={locale} />
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
            <div className="space-y-8">
              <div
                className="mobile-app-section max-md:mobile-page-card rounded-2xl md:rounded-[32px] border p-3 sm:p-6 md:p-8 backdrop-blur"
                style={{
                  backgroundColor: 'var(--theme-card-bg-90)',
                  borderColor: 'var(--theme-card-border)',
                  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
                }}
              >
                <div className="mb-2 flex items-center gap-3">
                  <div className="h-6 w-1 rounded-full accent-bar-theme sm:h-8" />
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 sm:text-3xl">{othersT('title')}</h1>
                </div>
                <p className="ml-4 text-sm text-gray-600 dark:text-gray-400">{othersT('subtitle')}</p>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {othersPages.map((page) => {
                  const pageTitleKey = `pages.${page.key}.title` as const
                  const pageDescKey = `pages.${page.key}.description` as const

                  return (
                    <Link
                      key={page.key}
                      href={`/${locale}${page.href}`}
                      className="group relative overflow-hidden rounded-3xl border p-6 backdrop-blur transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
                      style={{
                        backgroundColor: 'var(--theme-card-bg-90)',
                        borderColor: 'var(--theme-card-border)',
                        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
                      }}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${page.color} opacity-0 transition-opacity duration-300 group-hover:opacity-10`} />
                      <div className="relative">
                        <div className="mb-4 flex items-center gap-4">
                          <div className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${page.color} text-3xl shadow-lg`}>
                            {page.icon}
                          </div>
                          <div className="flex-1">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{othersT(pageTitleKey)}</h2>
                          </div>
                        </div>
                        <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">{othersT(pageDescKey)}</p>
                        <div className="mt-4 flex items-center text-sm font-medium text-pink-600 dark:text-pink-400">
                          <span>{othersT('viewDetails')}</span>
                          <span className="ml-2 transition-transform duration-300 group-hover:translate-x-1">→</span>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          }
        />
    </div>
  )
}
