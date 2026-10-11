'use client'

import { useEffect, useState } from 'react'
import { logger } from '@/lib/logger'

export interface LanguageStat {
  language: string
  total_percentage: number
  project_count: number
}

interface LanguageStatsProps {
  title?: string
  limit?: number
}

const languageColorMap: Record<string, string> = {
  JavaScript: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  TypeScript: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  Python: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  Java: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  'C++': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  C: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  'C#': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  Go: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
  Rust: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  PHP: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  Ruby: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  Swift: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  Kotlin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  Dart: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  HTML: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  CSS: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  Vue: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  React: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
  Shell: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
}

const getLanguageColor = (language: string): string => {
  return languageColorMap[language] || 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
}

const shellClass =
  'mobile-app-section max-md:mobile-feed-panel max-md:mobile-page-card h-full rounded-2xl border p-2 shadow-sm sm:rounded-3xl sm:p-5 max-md:p-2'

const shellStyle = {
  backgroundColor: 'var(--theme-card-bg-90)',
  borderColor: 'var(--theme-card-border)',
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="mb-2 flex items-center gap-2.5 max-md:mb-1.5 sm:mb-4">
      <span className="hidden h-8 w-8 items-center justify-center rounded-xl bg-[var(--theme-primary-100)] text-sm font-bold text-[var(--theme-primary-600)] sm:flex" aria-hidden>
        {'</>'}
      </span>
      <h2 className="mobile-app-section-title text-xs font-semibold text-gray-900 dark:text-gray-100 sm:text-base">
        {title}
      </h2>
    </div>
  )
}

function MobileLanguageList({ stats }: { stats: LanguageStat[] }) {
  return (
    <div className="max-md:mobile-feed-list md:hidden">
      {stats.map((stat, index) => {
        const pct = stat.total_percentage.toFixed(1)
        return (
          <div key={stat.language} className="mobile-feed-item px-1 py-2">
            <div className="mb-1 flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-1">
                {index < 3 && (
                  <span
                    className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white"
                    style={{
                      backgroundColor: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32',
                    }}
                  >
                    {index + 1}
                  </span>
                )}
                <span
                  className={`truncate rounded-full px-1.5 py-0.5 text-[10px] font-medium ${getLanguageColor(stat.language)}`}
                >
                  {stat.language}
                </span>
              </div>
              <span className="shrink-0 text-[10px] tabular-nums text-gray-500 dark:text-gray-400">
                {pct}% / {stat.project_count}
              </span>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(stat.total_percentage, 100)}%`,
                  backgroundColor: 'var(--theme-primary-500)',
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function LanguageStats({ title = '\u8bed\u8a00\u7edf\u8ba1', limit = 10 }: LanguageStatsProps) {
  const [languageStats, setLanguageStats] = useState<LanguageStat[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchLanguageStats = async () => {
      try {
        setLoading(true)
        const url = limit
          ? `/api/v1/projects/stats/language?limit=${limit}`
          : '/api/v1/projects/stats/language'
        const response = await fetch(url)

        if (!response.ok) {
          throw new Error(`Failed to fetch language stats: ${response.status}`)
        }

        const data: LanguageStat[] = await response.json()
        setLanguageStats(data)
        setError(null)
      } catch (err) {
        logger.error('Failed to fetch language stats:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch language stats')
        setLanguageStats([])
      } finally {
        setLoading(false)
      }
    }

    fetchLanguageStats()
  }, [limit])

  if (loading) {
    return (
      <div className={shellClass} style={shellStyle}>
        <SectionHeader title={title} />
        <div className="text-center text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
          {'\u52a0\u8f7d\u4e2d...'}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={shellClass} style={shellStyle}>
        <SectionHeader title={title} />
        <div className="text-center text-xs text-red-500 dark:text-red-400 sm:text-sm">{error}</div>
      </div>
    )
  }

  if (languageStats.length === 0) {
    return (
      <div className={shellClass} style={shellStyle}>
        <SectionHeader title={title} />
        <div className="text-center text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
          {'\u6682\u65e0\u6570\u636e'}
        </div>
      </div>
    )
  }

  return (
    <div className={shellClass} style={shellStyle}>
      <SectionHeader title={title} />

      <MobileLanguageList stats={languageStats} />

      <div className="hidden gap-2.5 md:grid md:grid-cols-2">
        {languageStats.map((stat, index) => {
          const percentage = stat.total_percentage.toFixed(1)
          return (
            <div
              key={stat.language}
              className="rounded-2xl border p-3 transition-all hover:-translate-y-0.5 hover:shadow-md sm:p-4"
              style={{
                backgroundColor: 'var(--theme-card-bg-80)',
                borderColor: 'var(--theme-card-border)',
              }}
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {index < 3 && (
                    <span
                      className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{
                        backgroundColor: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32',
                      }}
                    >
                      {index + 1}
                    </span>
                  )}
                  <span className={`rounded-full px-3 py-1 text-sm font-medium ${getLanguageColor(stat.language)}`}>
                    {stat.language}
                  </span>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">{percentage}%</span>
              </div>
              <div className="mt-3">
                <div className="mb-1 flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                  <span>{'\u9879\u76ee\u6570'}</span>
                  <span className="font-semibold">{stat.project_count}</span>
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
