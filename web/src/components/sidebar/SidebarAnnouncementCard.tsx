import Link from 'next/link'
import { Icon } from '@iconify/react'
import { getTranslations } from 'next-intl/server'
import type { PublicSiteConfig } from '@/lib/api'
import { getCurrentSolarTerm, getSeasonFromSolarTerm } from '@/lib/solar-term'
import { NAV_ROUTES } from '@/constants'

interface SidebarAnnouncementCardProps {
  locale: string
  siteConfig: PublicSiteConfig
}

const DATE_LOCALES: Record<string, string> = {
  zh: 'zh-CN',
  en: 'en-US',
  ja: 'ja-JP',
  ko: 'ko-KR',
}

export default async function SidebarAnnouncementCard({ locale, siteConfig }: SidebarAnnouncementCardProps) {
  const t = await getTranslations('sidebar')
  const currentTerm = getCurrentSolarTerm()
  const season = getSeasonFromSolarTerm(currentTerm)
  const dateLocale = DATE_LOCALES[locale] ?? 'en-US'

  const termLabel =
    locale === 'zh' ? currentTerm.name : `${currentTerm.name} · ${currentTerm.nameEn}`
  const seasonIcon = {
    spring: 'mdi:sprout-outline',
    summer: 'mdi:white-balance-sunny',
    autumn: 'mdi:leaf-maple',
    winter: 'mdi:snowflake',
  }[season]
  const seasonLabel = {
    spring: t('season.spring'),
    summer: t('season.summer'),
    autumn: t('season.autumn'),
    winter: t('season.winter'),
  }[season]

  const now = new Date()
  const dateLabel = new Intl.DateTimeFormat(dateLocale, { month: 'long', day: 'numeric' }).format(now)
  const weekLabel = new Intl.DateTimeFormat(dateLocale, { weekday: 'short' }).format(now)

  const capsuleStyle = {
    backgroundColor: 'var(--theme-primary-50)',
    color: 'var(--theme-primary-600)',
  }

  return (
    <div
      className="rounded-2xl p-4 shadow-lg transition-all duration-300 hover:shadow-xl sm:p-6"
      style={{ backgroundColor: 'var(--theme-card-bg)' }}
    >
      <h3 className="mb-2 text-base font-bold text-gray-800 dark:text-gray-200 sm:text-lg">
        {t('announcement')}
      </h3>
      <div className="mb-3 flex flex-wrap items-center gap-1.5 sm:mb-4">
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
          style={capsuleStyle}
          title={t('solarTerms')}
        >
          <span className="flex h-4 w-4 shrink-0 items-center justify-center" aria-hidden>
            <Icon icon={seasonIcon} className="h-4 w-4" />
          </span>
          {termLabel}
        </span>
        <span
          className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium"
          style={capsuleStyle}
          title={t('dateTitle')}
        >
          {dateLabel}
        </span>
        <span
          className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium"
          style={capsuleStyle}
          title={t('weekdayTitle')}
        >
          {weekLabel}
        </span>
        {seasonLabel ? (
          <span
            className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium"
            style={capsuleStyle}
            title={t('seasonTitle')}
          >
            {seasonLabel}
          </span>
        ) : null}
      </div>
      <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
        {siteConfig.site_announcement || t('welcomeMessage')}
      </p>
      <Link
        href={NAV_ROUTES.about(locale)}
        className="btn-theme-hover block w-full rounded-lg px-4 py-2 text-center text-sm font-medium transition-colors"
      >
        {t('learnMore')}
      </Link>
    </div>
  )
}
