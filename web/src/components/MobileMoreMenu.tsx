'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { Icon } from '@iconify/react'
import { NAV_ROUTES } from '@/constants'
import ThemeColorPicker from '@/components/ThemeColorPicker'
import { publicSiteConfig } from '@/config/public-site'

interface MobileMoreMenuProps {
  isOpen: boolean
  onClose: () => void
}

export default function MobileMoreMenu({ isOpen, onClose }: MobileMoreMenuProps) {
  const locale = useLocale()
  const t = useTranslations('nav')
  const galleryT = useTranslations('gallery')

  if (!isOpen) return null

  const sections = [
    {
      title: t('my'),
      items: [
        { href: NAV_ROUTES.myDiary(locale), label: t('diary'), icon: 'mdi:book-edit' },
        { href: NAV_ROUTES.myGallery(locale), label: galleryT('gallery'), icon: 'mdi:image-multiple' },
        { href: NAV_ROUTES.games(locale), label: t('games'), icon: 'mdi:gamepad-variant' },
      ],
    },
    {
      title: t('about'),
      items: [
        { href: NAV_ROUTES.about(locale), label: t('about'), icon: 'mdi:account' },
        { href: NAV_ROUTES.friendLinks(locale), label: t('friendLinks'), icon: 'mdi:account-group' },
        { href: NAV_ROUTES.support(locale), label: t('support'), icon: 'mdi:heart' },
      ],
    },
    {
      title: t('others'),
      items: [
        { href: NAV_ROUTES.projects(locale), label: t('projects'), icon: 'mdi:briefcase' },
        { href: NAV_ROUTES.skills(locale), label: t('skills'), icon: 'mdi:brain' },
        { href: NAV_ROUTES.timeline(locale), label: t('timeline'), icon: 'mdi:chart-timeline-variant' },
        { href: NAV_ROUTES.dashboard(locale), label: t('dashboard'), icon: 'mdi:view-dashboard' },
        { href: NAV_ROUTES.others(locale), label: t('others'), icon: 'mdi:dots-horizontal' },
      ],
    },
    {
      title: t('links'),
      items: publicSiteConfig.socialLinks.map((link) => ({ ...link, external: true })),
    },
  ]

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[108] bg-black/45 backdrop-blur-sm md:hidden"
        aria-label="关闭菜单"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-x-0 bottom-0 z-[109] md:hidden rounded-t-[22px] border border-white/60 bg-white/95 dark:border-gray-700 dark:bg-gray-900/95 backdrop-blur-2xl shadow-[0_-12px_40px_rgba(15,23,42,0.2)] max-h-[min(78vh,520px)] overflow-y-auto"
        style={{
          paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
          marginBottom: 'var(--mobile-tab-bar-total, 3.5rem)',
        }}
      >
        <div className="mx-auto mt-3 mb-4 h-1 w-10 rounded-full bg-gray-300 dark:bg-gray-600" />
        <div className="px-4 pb-2 space-y-5">
          <div className="flex items-center justify-between rounded-xl bg-gray-50 dark:bg-gray-800/80 px-3 py-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('themeColor')}</span>
            <ThemeColorPicker isScrolled />
          </div>
          {sections.map((section) => (
            <div key={section.title}>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                {section.title}
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {section.items.map((item) => {
                  const className =
                    'flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-medium text-gray-800 dark:text-gray-100 bg-gray-50 dark:bg-gray-800/80 active:scale-[0.98] transition-transform'
                  const content = (
                    <>
                      <Icon icon={item.icon} className="h-5 w-5 shrink-0 text-[var(--theme-primary-500)]" />
                      <span className="truncate">{item.label}</span>
                    </>
                  )
                  if ('external' in item && item.external) {
                    return (
                      <a
                        key={item.href}
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={className}
                        onClick={onClose}
                      >
                        {content}
                      </a>
                    )
                  }
                  return (
                    <Link key={item.href} href={item.href} className={className} onClick={onClose}>
                      {content}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
