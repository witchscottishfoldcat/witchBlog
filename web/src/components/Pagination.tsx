'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { replayHeroEntrance } from '@/lib/hero-entrance'

interface PaginationProps {
  currentPage: number
  totalPages: number
  basePath: string
  locale: string
  labels: {
    previous: string
    next: string
    page: string
    of: string
  }
}

export default function Pagination({
  currentPage,
  totalPages,
  basePath,
  locale: _locale,
  labels,
}: PaginationProps) {
  const searchParams = useSearchParams()
  const isFirstRender = useRef(true)

  // 翻页只改查询串、路径不变，页面不会重新挂载，这里主动重播一次入场滚动动画
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    replayHeroEntrance()
  }, [currentPage])
  
  // 构建URL，保留现有的查询参数
  const buildUrl = (page: number) => {
    const safePage = Math.min(totalPages, Math.max(1, page))
    const params = new URLSearchParams(searchParams.toString())
    if (safePage === 1) {
      params.delete('page')
    } else {
      params.set('page', safePage.toString())
    }
    const queryString = params.toString()
    return `${basePath}${queryString ? `?${queryString}` : ''}`
  }

  if (totalPages <= 1) {
    return null
  }

  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisible = 7 // 最多显示7个页码按钮

    if (totalPages <= maxVisible) {
      // 如果总页数少于等于7，显示所有页码
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // 总是显示第一页
      pages.push(1)

      if (currentPage <= 3) {
        // 当前页在前3页
        for (let i = 2; i <= 4; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        // 当前页在后3页
        pages.push('...')
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        // 当前页在中间
        pages.push('...')
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      }
    }

    return pages
  }

  const pageNumbers = getPageNumbers()

  return (
    <nav
      className="mt-4 flex justify-center sm:mt-8"
      aria-label={`${labels.page} ${currentPage} ${labels.of} ${totalPages}`}
    >
      {/* Pagination Buttons */}
      <div className="flex max-w-full items-center gap-1 overflow-x-auto sm:gap-2">
        {/* Previous Button */}
        <Link
          href={buildUrl(currentPage - 1)}
          className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition sm:px-4 sm:py-2 sm:text-sm ${
            currentPage === 1
              ? 'cursor-not-allowed opacity-50'
              : 'hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
          style={{
            backgroundColor: currentPage === 1 ? 'transparent' : 'var(--theme-card-bg-80)',
            color: 'var(--theme-primary-600)',
          }}
          aria-disabled={currentPage === 1}
          onClick={(e) => {
            if (currentPage === 1) {
              e.preventDefault()
            }
          }}
        >
          {labels.previous}
        </Link>

        {/* Page Numbers */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((page, idx) => {
            if (page === '...') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-2 text-gray-500 dark:text-gray-400"
                >
                  ...
                </span>
              )
            }

            const pageNum = page as number
            const isActive = pageNum === currentPage

            return (
              <Link
                key={pageNum}
                href={buildUrl(pageNum)}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition sm:px-4 sm:py-2 sm:text-sm ${
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
          href={buildUrl(currentPage + 1)}
          className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition sm:px-4 sm:py-2 sm:text-sm ${
            currentPage === totalPages
              ? 'cursor-not-allowed opacity-50'
              : 'hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
          style={{
            backgroundColor: currentPage === totalPages ? 'transparent' : 'var(--theme-card-bg-80)',
            color: 'var(--theme-primary-600)',
          }}
          aria-disabled={currentPage === totalPages}
          onClick={(e) => {
            if (currentPage === totalPages) {
              e.preventDefault()
            }
          }}
        >
          {labels.next}
        </Link>
      </div>
    </nav>
  )
}

