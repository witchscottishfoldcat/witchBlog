'use client'

import { useMemo, useState, useCallback } from 'react'
import { useLocale } from 'next-intl'
import { Icon } from '@iconify/react'
import { SOLAR_TERMS, getCurrentSolarTerm } from '@/lib/solar-term'

export default function SolarTermBar() {
  const locale = useLocale()
  const [isExpanded, setIsExpanded] = useState(false)
  const term = useMemo(() => getCurrentSolarTerm(), [])

  const toggle = useCallback(() => setIsExpanded((v) => !v), [])

  const displayName = locale === 'zh' ? term.name : `${term.name} (${term.nameEn})`

  return (
    <div className="fixed left-0 right-0 top-14 sm:top-16 z-[99]">
      {/* 可点击的节气条 */}
      <button
        type="button"
        onClick={toggle}
        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-sm border-b transition-all duration-300 hover:opacity-90 active:scale-[0.99] cursor-pointer group"
        style={{
          backgroundColor: 'var(--theme-card-bg-80)',
          borderColor: 'var(--theme-card-border)',
          boxShadow: '0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        <span
          className="flex items-center justify-center w-7 h-7 rounded-lg"
          style={{
            background: 'linear-gradient(135deg, var(--theme-primary-400), var(--theme-secondary))',
            boxShadow: '0 2px 8px -2px var(--theme-primary-500)',
          }}
        >
          <Icon icon="mdi:calendar-today" className="w-4 h-4 text-white" />
        </span>
        <span className="font-semibold" style={{ color: 'var(--theme-primary-600)' }}>
          {displayName}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">
          {locale === 'zh' ? '廿四节气' : '24 Solar Terms'}
        </span>
        <Icon
          icon="mdi:chevron-down"
          className={`w-5 h-5 text-gray-400 dark:text-gray-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
        />
      </button>

      {/* 展开面板 */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-out ${
          isExpanded ? 'max-h-[420px] opacity-100' : 'max-h-0 opacity-0'
        }`}
        style={{
          backgroundColor: 'var(--theme-card-bg-90)',
          borderBottom: '1px solid var(--theme-card-border)',
          boxShadow: '0 12px 40px -12px rgba(0,0,0,0.15)',
        }}
      >
        <div className="container mx-auto px-4 py-4 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-1 h-4 rounded-full"
              style={{ background: 'linear-gradient(180deg, var(--theme-primary-400), var(--theme-secondary))' }}
            />
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
              {locale === 'zh' ? '二十四节气' : '24 Solar Terms'}
            </span>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
            {SOLAR_TERMS.map((t) => {
              const isCurrent = t.name === term.name
              return (
                <div
                  key={t.name}
                  className={`
                    relative rounded-xl px-3 py-2 text-center transition-all duration-200
                    ${
                      isCurrent
                        ? 'ring-2 ring-[var(--theme-primary-400)] scale-[1.02]'
                        : 'hover:bg-black/5 dark:hover:bg-white/5'
                    }
                  `}
                  style={
                    isCurrent
                      ? {
                          backgroundColor: 'var(--theme-primary-50)',
                          boxShadow: '0 4px 12px -4px var(--theme-primary-400)',
                        }
                      : {}
                  }
                >
                  {isCurrent && (
                    <span
                      className="absolute -top-1 -right-1 w-2 h-2 rounded-full animate-pulse"
                      style={{ backgroundColor: 'var(--theme-primary-500)' }}
                    />
                  )}
                  <p className={`text-sm font-medium ${isCurrent ? '' : 'text-gray-700 dark:text-gray-300'}`} style={isCurrent ? { color: 'var(--theme-primary-700)' } : {}}>
                    {t.name}
                  </p>
                  {locale !== 'zh' && (
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate mt-0.5">{t.nameEn}</p>
                  )}
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                    {t.month}/{t.day}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
