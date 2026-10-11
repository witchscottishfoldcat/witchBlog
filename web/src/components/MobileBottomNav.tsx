'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { Icon } from '@iconify/react'
import { NAV_ROUTES } from '@/constants'
import MobileMoreMenu from '@/components/MobileMoreMenu'

function isActive(pathname: string, href: string) {
  const p = pathname.replace(/\/$/, '') || '/'
  const h = href.replace(/\/$/, '') || '/'
  if (p === h) return true
  if (/^\/[^/]+$/.test(h)) return false
  return p.startsWith(`${h}/`)
}

export default function MobileBottomNav() {
  const pathname = usePathname()
  const locale = useLocale()
  const t = useTranslations('nav')
  const [moreOpen, setMoreOpen] = useState(false)

  useEffect(() => {
    setMoreOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!moreOpen || typeof document === 'undefined') return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [moreOpen])

  const tabs = [
    { key: 'home', href: NAV_ROUTES.home(locale), label: t('home'), icon: 'mdi:home-outline', activeIcon: 'mdi:home' },
    { key: 'archive', href: NAV_ROUTES.archive(locale), label: t('archive'), icon: 'mdi:archive-outline', activeIcon: 'mdi:archive' },
    { key: 'music', href: NAV_ROUTES.music(locale), label: t('music'), icon: 'mdi:music-note-outline', activeIcon: 'mdi:music-note' },
    { key: 'my', href: NAV_ROUTES.my(locale), label: t('my'), icon: 'mdi:account-outline', activeIcon: 'mdi:account' },
  ]

  const moreActive =
    moreOpen ||
    [
      NAV_ROUTES.myDiary(locale),
      NAV_ROUTES.myGallery(locale),
      NAV_ROUTES.games(locale),
      NAV_ROUTES.about(locale),
      NAV_ROUTES.friendLinks(locale),
      NAV_ROUTES.support(locale),
      NAV_ROUTES.projects(locale),
      NAV_ROUTES.skills(locale),
      NAV_ROUTES.timeline(locale),
      NAV_ROUTES.dashboard(locale),
      NAV_ROUTES.others(locale),
    ].some((href) => isActive(pathname, href))

  return (
    <>
      <nav
        className="mobile-bottom-nav fixed inset-x-0 z-[9988] md:hidden border-t bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl"
        style={{
          borderColor: 'var(--theme-card-border)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
        aria-label="主导航"
      >
        <div className="grid h-14 grid-cols-5 items-stretch">
          {tabs.map((tab) => {
            const active = isActive(pathname, tab.href)
            return (
              <Link
                key={tab.key}
                href={tab.href}
                className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors active:scale-95 ${
                  active
                    ? 'text-[var(--theme-primary-600)] dark:text-[var(--theme-primary-400)]'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                <Icon icon={active ? tab.activeIcon : tab.icon} className="h-6 w-6" />
                <span className="max-w-full truncate px-0.5">{tab.label}</span>
              </Link>
            )
          })}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors active:scale-95 ${
              moreActive
                ? 'text-[var(--theme-primary-600)] dark:text-[var(--theme-primary-400)]'
                : 'text-gray-500 dark:text-gray-400'
            }`}
            aria-expanded={moreOpen}
            aria-label={t('others')}
          >
            <Icon icon={moreOpen ? 'mdi:dots-horizontal' : 'mdi:dots-horizontal-circle-outline'} className="h-6 w-6" />
            <span>{t('others')}</span>
          </button>
        </div>
      </nav>
      <MobileMoreMenu isOpen={moreOpen} onClose={() => setMoreOpen(false)} />
    </>
  )
}
