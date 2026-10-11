'use client'

import { Icon } from '@iconify/react'
import { useMemo } from 'react'
import { Chip } from '@/components/ui/Chip'
import PageIntroCard from '@/components/PageIntroCard'

export interface TimelineEntry {
  id: string
  title: string
  subtitle?: string
  description: string
  type: 'work' | 'project' | 'education' | 'achievement'
  date: string
  duration: string
  location?: string
  tags: string[]
  icon?: string
  color?: string
  isCurrent?: boolean
  locale: string
}

interface TimelineListProps {
  entries: TimelineEntry[]
  labels: {
    title: string
    subtitle: string
    history: string
    currentStatus: string
    currentStatusCount: string
    scrollToHistory: string
    types: {
      work: string
      project: string
      education: string
      achievement: string
    }
    duration: string
    location: string
  }
}

export default function TimelineList({ entries, labels }: TimelineListProps) {
  const currentEntries = useMemo(
    () => entries.filter((e) => e.isCurrent),
    [entries]
  )

  const historyEntries = useMemo(
    () => entries.filter((e) => !e.isCurrent).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [entries],
  )

  return (
    <div className="space-y-4 sm:space-y-8">
      <div className="mobile-page-card rounded-2xl border p-3 md:hidden" style={{ backgroundColor: 'var(--theme-card-bg-90)', borderColor: 'var(--theme-card-border)' }}>
        <div className="mb-1 flex items-center gap-3">
          <span className="h-6 w-1 rounded-full accent-bar-theme" aria-hidden />
          <h1 className="mobile-app-title text-base font-bold text-gray-900 dark:text-gray-100">{labels.title}</h1>
        </div>
        <p className="ml-4 text-xs text-gray-600 dark:text-gray-400">{labels.subtitle}</p>
      </div>
      <PageIntroCard title={labels.title} subtitle={labels.subtitle} />

      {/* Current Status - 当前状态 */}
      {currentEntries.length > 0 && (
        <section
          className="mobile-app-section max-md:mobile-page-card rounded-2xl md:rounded-[32px] border p-3 sm:p-6 md:p-8 backdrop-blur"
          style={{
            backgroundColor: 'var(--theme-card-bg-90)',
            borderColor: 'var(--theme-card-border)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)'
          }}
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-md">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </span>
            </div>
            <div>
              <h2 className="mobile-app-section-title text-sm sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">{labels.currentStatus}</h2>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 sm:text-xs">{currentEntries.length} {labels.currentStatusCount}</p>
            </div>
          </div>
          <div className="space-y-4">
            {currentEntries.map((entry, index) => (
              <CurrentStatusCard
                key={entry.id}
                entry={entry}
                labels={labels}
                connectToNext={index < currentEntries.length - 1 || historyEntries.length > 0}
              />
            ))}
          </div>
          {/* 连接线到历史 */}
          {historyEntries.length > 0 && (
            <div className="relative mt-4 flex items-center gap-4 sm:mt-6">
              <div className="relative w-9 shrink-0 flex justify-center">
                <div className="absolute -top-4 bottom-0 w-0.5 bg-gradient-to-b from-emerald-400 to-gray-200 dark:from-emerald-500 dark:to-gray-700" />
                <div className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-sm">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M12 5v14M5 12l7 7 7-7" />
                  </svg>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 italic">{labels.scrollToHistory}</p>
            </div>
          )}
        </section>
      )}

      {/* History */}
      {historyEntries.length > 0 && (
        <section 
          className="mobile-app-section max-md:mobile-page-card rounded-2xl md:rounded-[32px] border p-3 sm:p-6 md:p-8 backdrop-blur"
          style={{
            backgroundColor: 'var(--theme-card-bg-90)',
            borderColor: 'var(--theme-card-border)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)'
          }}
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="h-6 sm:h-8 w-1 rounded-full accent-bar-theme" />
            <h2 className="mobile-app-section-title text-sm sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">{labels.history}</h2>
          </div>
          <div className="space-y-6">
            {historyEntries.map((entry, index) => (
              <TimelineCard
                key={entry.id}
                entry={entry}
                labels={labels}
                connectToNext={index < historyEntries.length - 1}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

// 极简图标组件
function SimpleIcon({ type }: { type: 'work' | 'project' | 'education' | 'achievement' }) {
  const iconConfig = {
    work: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <rect x="3" y="7" width="18" height="12" rx="2" />
        <path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" />
        <path d="M12 12v.01" />
      </svg>
    ),
    project: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M9 12h6M9 16h6M17 21H7a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2z" />
      </svg>
    ),
    education: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M12 14l9-5-9-5-9 5 9 5z" />
        <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
      </svg>
    ),
    achievement: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
  }
  
  return iconConfig[type] || iconConfig.project
}

function TimelineCard({
  entry,
  labels,
  connectToNext = false,
}: {
  entry: TimelineEntry
  labels: TimelineListProps['labels']
  connectToNext?: boolean
}) {
  return (
    <div className="relative flex gap-4">
      <div className="relative w-9 shrink-0">
        {connectToNext && (
          <div className="absolute -bottom-6 left-1/2 top-9 w-0.5 -translate-x-1/2 bg-gray-200 dark:bg-gray-700" />
        )}
        <div
          className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-full text-white shadow-sm ${
            entry.color || 'bg-gray-500'
          }`}
        >
          <SimpleIcon type={entry.type} />
        </div>
      </div>
      <div 
        className="flex-1 min-w-0 max-md:mobile-page-card rounded-2xl border p-3 transition-all sm:p-6 md:hover:shadow-lg"
        style={{
          backgroundColor: 'var(--theme-card-bg)',
          borderColor: 'var(--theme-card-border)'
        }}
      >
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1 min-w-0">
            <div className="mb-1 text-xs text-gray-500 dark:text-gray-400">{entry.date}</div>
            <h3 className="mb-1 text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">{entry.title}</h3>
            {entry.subtitle && (
              <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">{entry.subtitle}</p>
            )}
          </div>
          <Chip className="self-start">{labels.types[entry.type]}</Chip>
        </div>
        <p className="mb-2 line-clamp-3 text-sm leading-relaxed text-gray-600 dark:text-gray-400 sm:mb-4 sm:line-clamp-none">{entry.description}</p>
        <div className="chip-scroll -mx-0.5 mb-2 flex gap-1 overflow-x-auto px-0.5 pb-0.5 text-xs text-gray-500 dark:text-gray-400 sm:mb-4 sm:flex-wrap sm:gap-2 sm:overflow-visible">
          <Chip>
            {labels.duration}: {entry.duration}
          </Chip>
          {entry.location && (
            <Chip>
              <span className="inline-flex items-center gap-0.5">
                <Icon
                  icon="mdi:map-marker-outline"
                  className="h-3 w-3 shrink-0"
                  aria-hidden
                />
                {entry.location}
              </span>
            </Chip>
          )}
        </div>
        {entry.tags.length > 0 && (
          <div className="chip-scroll -mx-0.5 flex gap-1 overflow-x-auto px-0.5 pb-0.5 sm:flex-wrap sm:gap-1.5 sm:overflow-visible">
            {entry.tags.map((tag) => (
              <Chip key={tag}>{tag}</Chip>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// 当前状态卡片 - 带脉冲动画
function CurrentStatusCard({
  entry,
  labels,
  connectToNext = false,
}: {
  entry: TimelineEntry
  labels: TimelineListProps['labels']
  connectToNext?: boolean
}) {
  return (
    <div className="relative flex gap-4">
      <div className="relative w-9 shrink-0">
        {connectToNext && (
          <div className="absolute -bottom-4 left-1/2 top-9 w-0.5 -translate-x-1/2 bg-gradient-to-b from-emerald-300 to-emerald-100 dark:from-emerald-600 dark:to-emerald-900" />
        )}
        <div className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-md ring-2 ring-emerald-200 dark:ring-emerald-800">
          <SimpleIcon type={entry.type} />
        </div>
      </div>
      <div 
        className="flex-1 min-w-0 max-md:mobile-page-card rounded-2xl border p-3 transition-all sm:p-6 md:hover:shadow-lg"
        style={{
          background: 'linear-gradient(145deg, color-mix(in srgb, var(--theme-primary-50) 60%, var(--theme-card-bg)), var(--theme-card-bg))',
          borderColor: 'color-mix(in srgb, var(--theme-primary-200) 50%, var(--theme-card-border))',
        }}
      >
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1 min-w-0">
            <div className="mb-1 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                </span>
                {labels.types[entry.type]}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">{entry.date}</span>
            </div>
            <h3 className="mb-1 text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">{entry.title}</h3>
            {entry.subtitle && (
              <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">{entry.subtitle}</p>
            )}
          </div>
        </div>
        <p className="mb-2 line-clamp-3 text-sm leading-relaxed text-gray-600 dark:text-gray-400 sm:mb-4 sm:line-clamp-none">{entry.description}</p>
        <div className="chip-scroll -mx-0.5 mb-2 flex gap-1 overflow-x-auto px-0.5 pb-0.5 text-xs text-gray-500 dark:text-gray-400 sm:mb-4 sm:flex-wrap sm:gap-2 sm:overflow-visible">
          <Chip>
            {labels.duration}: {entry.duration}
          </Chip>
          {entry.location && (
            <Chip>
              <span className="inline-flex items-center gap-0.5">
                <Icon
                  icon="mdi:map-marker-outline"
                  className="h-3 w-3 shrink-0"
                  aria-hidden
                />
                {entry.location}
              </span>
            </Chip>
          )}
        </div>
        {entry.tags.length > 0 && (
          <div className="chip-scroll -mx-0.5 flex gap-1 overflow-x-auto px-0.5 pb-0.5 sm:flex-wrap sm:gap-1.5 sm:overflow-visible">
            {entry.tags.map((tag) => (
              <Chip key={tag}>{tag}</Chip>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

