'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { logger } from '@/lib/logger'
import { Chip } from '@/components/ui/Chip'

export interface TagStat {
  tag: string
  count: number
}

interface TagStatsProps {
  title?: string
}

const TAG_COLOR_MAP: Record<string, string> = {
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  '已完成': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  inProgress: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  '进行中': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  'in-progress': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  in_progress: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  planned: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  '计划中': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
}

function getTagColor(tag: string): string {
  return TAG_COLOR_MAP[tag] || 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
}

export default function TagStats({ title }: TagStatsProps) {
  const t = useTranslations('projects')
  const displayTitle = title ?? t('tagStats')
  const [tagStats, setTagStats] = useState<TagStat[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTagStats = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/v1/projects/stats/tag')

        if (!response.ok) {
          throw new Error(`Failed to fetch tag stats: ${response.status}`)
        }

        const data: TagStat[] = await response.json()
        setTagStats(data)
        setError(null)
      } catch (err) {
        logger.error('Failed to fetch tag stats:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch tag stats')
        setTagStats([])
      } finally {
        setLoading(false)
      }
    }

    fetchTagStats()
  }, [])

  if (loading) {
    return (
      <div
        className="mobile-app-section max-md:mobile-page-card rounded-2xl md:rounded-[32px] border p-3 sm:p-6 md:p-8 backdrop-blur"
        style={{
          backgroundColor: 'var(--theme-card-bg-90)',
          borderColor: 'var(--theme-card-border)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="h-8 w-1 rounded-full accent-bar-theme" />
          <h2 className="mobile-app-section-title text-sm sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">
            {displayTitle}
          </h2>
        </div>
        <div className="text-center text-gray-500 dark:text-gray-400">{t('tagStatsLoading')}</div>
      </div>
    )
  }

  if (error) {
    return (
      <div
        className="mobile-app-section max-md:mobile-page-card rounded-2xl md:rounded-[32px] border p-3 sm:p-6 md:p-8 backdrop-blur"
        style={{
          backgroundColor: 'var(--theme-card-bg-90)',
          borderColor: 'var(--theme-card-border)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="h-8 w-1 rounded-full accent-bar-theme" />
          <h2 className="mobile-app-section-title text-sm sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">
            {displayTitle}
          </h2>
        </div>
        <div className="text-center text-red-500 dark:text-red-400">{error}</div>
      </div>
    )
  }

  if (tagStats.length === 0) {
    return (
      <div
        className="mobile-app-section max-md:mobile-page-card rounded-2xl md:rounded-[32px] border p-3 sm:p-6 md:p-8 backdrop-blur"
        style={{
          backgroundColor: 'var(--theme-card-bg-90)',
          borderColor: 'var(--theme-card-border)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="h-8 w-1 rounded-full accent-bar-theme" />
          <h2 className="mobile-app-section-title text-sm sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">
            {displayTitle}
          </h2>
        </div>
        <div className="text-center text-gray-500 dark:text-gray-400">{t('tagStatsEmpty')}</div>
      </div>
    )
  }

  const totalCount = tagStats.reduce((sum, stat) => sum + stat.count, 0)

  return (
    <div
      className="max-md:mobile-page-card h-full rounded-2xl border p-3 shadow-sm sm:rounded-3xl sm:p-5"
      style={{
        backgroundColor: 'var(--theme-card-bg-90)',
        borderColor: 'var(--theme-card-border)',
      }}
    >
      <div className="mb-3 flex items-center gap-2.5 sm:mb-4">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--theme-primary-100)] text-[var(--theme-primary-600)]" aria-hidden>
          #
        </span>
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 sm:text-base">{displayTitle}</h2>
      </div>

      <div className="chip-scroll -mx-0.5 mb-0 flex gap-1.5 overflow-x-auto px-0.5 pb-1 md:hidden">
        {tagStats.map((stat) => (
          <Chip key={stat.tag} count={stat.count}>
            {stat.tag}
          </Chip>
        ))}
      </div>

      <div className="hidden gap-2.5 md:grid md:grid-cols-3">
        {tagStats.map((stat) => {
          const percentage = totalCount > 0 ? ((stat.count / totalCount) * 100).toFixed(1) : '0'
          return (
            <div
              key={stat.tag}
              className="relative overflow-hidden rounded-2xl border p-3 transition-all hover:-translate-y-0.5 hover:shadow-md sm:p-4"
              style={{
                backgroundColor: 'var(--theme-card-bg-80)',
                borderColor: 'var(--theme-card-border)',
              }}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className={`truncate rounded-full px-2.5 py-1 text-xs font-medium ${getTagColor(stat.tag)}`}>
                  {stat.tag}
                </span>
                <span className="shrink-0 text-xs tabular-nums text-gray-500 dark:text-gray-400">{percentage}%</span>
              </div>
              <div className="mt-3">
                <div className="mb-1 flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                  <span>{t('tagStatsCount')}</span>
                  <span className="font-semibold">{stat.count}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: 'var(--theme-primary-500)',
                    }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>

    </div>
  )
}
