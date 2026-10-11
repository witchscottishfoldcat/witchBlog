'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

interface GalleryPaginationProps {
  currentSkip: number
  limit: number
  total: number
  basePath: string
  locale: string
  labels: {
    previous: string
    next: string
    showing: string
    of: string
    results: string
  }
}

export default function GalleryPagination({
  currentSkip,
  limit,
  total,
  basePath,
  locale: _locale,
  labels,
}: GalleryPaginationProps) {
  const searchParams = useSearchParams()
  
  // 计算当前页和总页数
  const currentPage = Math.floor(currentSkip / limit) + 1
  const totalPages = Math.ceil(total / limit)
  
  // 构建URL，保留现有的查询参数
  const buildUrl = (skip: number) => {
    const params = new URLSearchParams(searchParams.toString())
    if (skip === 0) {
      params.delete('skip')
    } else {
      params.set('skip', skip.toString())
    }
    const queryString = params.toString()
    return `${basePath}${queryString ? `?${queryString}` : ''}`
  }

  if (totalPages <= 1) {
    return null
  }

  const startItem = currentSkip + 1
  const endItem = Math.min(currentSkip + limit, total)

  return (
    <div className="mt-8 flex flex-col items-center justify-between gap-4 sm:flex-row">
      {/* Page Info */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {labels.showing} {startItem}-{endItem} {labels.of} {total} {labels.results}
      </div>

      {/* Pagination Buttons */}
      <div className="flex items-center gap-2">
        {/* Previous Button */}
        <Link
          href={buildUrl(Math.max(0, currentSkip - limit))}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            currentSkip === 0
              ? 'cursor-not-allowed opacity-50'
              : 'hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
          style={{
            backgroundColor: currentSkip === 0 ? 'transparent' : 'var(--theme-card-bg-80)',
            color: 'var(--theme-primary-600)',
          }}
          aria-disabled={currentSkip === 0}
          onClick={(e) => {
            if (currentSkip === 0) {
              e.preventDefault()
            }
          }}
        >
          {labels.previous}
        </Link>

        {/* Page Numbers */}
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum: number
            if (totalPages <= 5) {
              pageNum = i + 1
            } else if (currentPage <= 3) {
              pageNum = i + 1
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i
            } else {
              pageNum = currentPage - 2 + i
            }
            
            const skip = (pageNum - 1) * limit
            const isActive = pageNum === currentPage

            return (
              <Link
                key={pageNum}
                href={buildUrl(skip)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  isActive
                    ? ''
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                style={{
                  backgroundColor: isActive ? 'var(--theme-primary-500)' : 'var(--theme-card-bg-80)',
                  color: isActive ? 'white' : 'var(--theme-primary-600)',
                }}
              >
                {pageNum}
              </Link>
            )
          })}
        </div>

        {/* Next Button */}
        <Link
          href={buildUrl(Math.min(total - limit, currentSkip + limit))}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            currentSkip + limit >= total
              ? 'cursor-not-allowed opacity-50'
              : 'hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
          style={{
            backgroundColor: currentSkip + limit >= total ? 'transparent' : 'var(--theme-card-bg-80)',
            color: 'var(--theme-primary-600)',
          }}
          aria-disabled={currentSkip + limit >= total}
          onClick={(e) => {
            if (currentSkip + limit >= total) {
              e.preventDefault()
            }
          }}
        >
          {labels.next}
        </Link>
      </div>
    </div>
  )
}

