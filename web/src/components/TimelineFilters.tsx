'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Chip } from '@/components/ui/Chip'

interface TimelineFiltersProps {
  labels: {
    search: string
    tags: string
    filter: string
    clear: string
  }
}

export default function TimelineFilters({ labels }: TimelineFiltersProps) {
  const t = useTranslations('timeline')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [tags, setTags] = useState(searchParams.get('tags') || '')

  const handleSearch = useCallback(() => {
    const params = new URLSearchParams()
    if (search.trim()) {
      params.set('search', search.trim())
    }
    if (tags.trim()) {
      params.set('tags', tags.trim())
    }
    // 重置分页
    params.set('skip', '0')
    router.push(`${pathname}?${params.toString()}`)
  }, [search, tags, router, pathname])

  const handleClear = useCallback(() => {
    setSearch('')
    setTags('')
    router.push(pathname)
  }, [router, pathname])

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div 
      className="mb-4 max-md:mobile-page-card rounded-2xl border p-3 backdrop-blur sm:mb-8 sm:rounded-[32px] sm:card-padding md:shadow-[0_20px_60px_rgba(0,0,0,0.1)]"
      style={{
        backgroundColor: 'var(--theme-card-bg-90)',
        borderColor: 'var(--theme-card-border)',
      }}
    >
      <div className="mb-3 flex items-center gap-2 sm:mb-4 sm:gap-3">
        <div className="hidden h-6 w-1 rounded-full accent-bar-theme sm:block sm:h-8" />
        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 sm:text-xl">{labels.filter}</h3>
      </div>

      <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="search" className="mb-1.5 hidden text-sm font-medium text-gray-700 dark:text-gray-300 sm:block">
            {labels.search}
          </label>
          <input
            id="search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={t('searchPlaceholder')}
            className="w-full rounded-xl border px-3 py-2 text-sm transition focus:outline-none focus:ring-2 sm:px-4"
            style={{
              backgroundColor: 'var(--theme-card-bg)',
              borderColor: 'var(--theme-card-border)',
              color: 'var(--theme-text)',
            }}
          />
        </div>

        <div>
          <label htmlFor="tags" className="mb-1.5 hidden text-sm font-medium text-gray-700 dark:text-gray-300 sm:block">
            {labels.tags} {t('tagsHint')}
          </label>
          <input
            id="tags"
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={t('tagsPlaceholder')}
            className="w-full rounded-xl border px-3 py-2 text-sm transition focus:outline-none focus:ring-2 sm:px-4"
            style={{
              backgroundColor: 'var(--theme-card-bg)',
              borderColor: 'var(--theme-card-border)',
              color: 'var(--theme-text)',
            }}
          />
        </div>
      </div>

      <div className="chip-scroll -mx-0.5 mt-3 flex gap-1.5 overflow-x-auto px-0.5 pb-0.5 sm:mt-4 sm:flex-wrap sm:overflow-visible sm:pb-0">
        <Chip active onClick={handleSearch}>
          {labels.search}
        </Chip>
        <Chip onClick={handleClear}>{labels.clear}</Chip>
      </div>
    </div>
  )
}

