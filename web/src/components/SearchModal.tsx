'use client'

import { useState, useEffect, useMemo, useCallback, memo } from 'react'
import { allPosts } from 'contentlayer/generated'
import Link from 'next/link'
import { format } from 'date-fns'
import { useTranslations, useLocale } from 'next-intl'
import { normalizeTags } from '@/lib/post-utils'
import { Icon } from '@iconify/react'

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
}

function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const locale = useLocale()
  const t = useTranslations('common')
  const tSearch = useTranslations('search')

  // 优化搜索逻辑：使用防抖和更高效的过滤
  const filteredPosts = useMemo(() => {
    if (!searchQuery.trim()) return []
    
    const query = searchQuery.toLowerCase().trim()
    const queryWords = query.split(/\s+/).filter(Boolean)
    
    return allPosts
      .filter((post) => {
        const title = post.title?.toLowerCase() || ''
        const description = post.description?.toLowerCase() || ''
        const content = post.body?.raw?.toLowerCase() || ''
        const tags = normalizeTags(post.tags).join(' ').toLowerCase()
        const category = post.category?.toLowerCase() || ''
        
        // 支持多词搜索（所有词都必须匹配）
        return queryWords.every(word => 
          title.includes(word) ||
          description.includes(word) ||
          content.includes(word) ||
          tags.includes(word) ||
          category.includes(word)
        )
      })
      .slice(0, 10) // Limit to 10 results
  }, [searchQuery])
  
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }, [])

  useEffect(() => {
    if (!isOpen) return
    
    // 保存原始 overflow 值
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    
    return () => {
      // 安全地恢复原始 overflow 值
      try {
        if (document && document.body) {
          document.body.style.overflow = originalOverflow || ''
        }
      } catch {
        // 静默处理错误
      }
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    // SSR 安全检查
    if (typeof window === 'undefined') return
    
    window.addEventListener('keydown', handleEscape)
    return () => {
      try {
        if (typeof window !== 'undefined' && window.removeEventListener) {
          window.removeEventListener('keydown', handleEscape)
        }
      } catch {
        // 静默处理清理错误
      }
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const panel = (
    <>
        {/* Search Input */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <div className="flex items-center gap-3">
            <Icon icon="mdi:magnify" className="text-xl text-gray-500 shrink-0" />
            <input
              type="search"
              enterKeyHint="search"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder={t('search')}
              className="flex-1 min-w-0 bg-transparent border-none outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400 text-base"
              autoFocus
            />
            <button
              type="button"
              onClick={onClose}
              className="touch-target p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="关闭"
            >
              <Icon icon="mdi:close" className="text-xl" />
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4 min-h-0">
          {searchQuery.trim() && filteredPosts.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <p className="text-lg mb-2">{tSearch('noResults')}</p>
              <p className="text-sm">{tSearch('tryOtherKeywords')}</p>
            </div>
          ) : searchQuery.trim() && filteredPosts.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {tSearch('foundResults', { count: filteredPosts.length })}
              </p>
              {filteredPosts.map((post) => {
                const bodyText = post.body?.raw || ''
                const wordCount = bodyText ? bodyText.split(/\s+/).filter(Boolean).length : 0

                return (
                  <Link
                    key={post.slug}
                    href={`/${locale}/posts/${post.slug}`}
                    onClick={onClose}
                    className="block p-4 rounded-xl active:scale-[0.99] hover:bg-pink-50 dark:hover:bg-gray-700 transition-colors border border-transparent hover:border-pink-200 dark:hover:border-gray-600"
                  >
                    <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-1 line-clamp-1">
                      {post.title}
                    </h3>
                    {post.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                        {post.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-500">
                      <span>{format(new Date(post.date), 'yyyy-MM-dd')}</span>
                      {post.category && <span>• {post.category}</span>}
                      {wordCount > 0 && <span>• {wordCount} {t('words')}</span>}
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <p className="text-lg mb-2">{tSearch('startTyping')}</p>
              <p className="text-sm">{tSearch('hint')}</p>
            </div>
          )}
        </div>
    </>
  )

  return (
    <>
      {/* 手机端：底部搜索面板 */}
      <button
        type="button"
        className="fixed inset-0 z-[110] bg-black/45 backdrop-blur-sm md:hidden"
        aria-label="关闭搜索"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-x-0 bottom-0 z-[111] md:hidden flex flex-col rounded-t-[22px] bg-white dark:bg-gray-800 shadow-2xl max-h-[min(88vh,560px)]"
        style={{
          paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
          marginBottom: 'var(--mobile-tab-bar-total, 3.5rem)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mt-3 mb-1 h-1 w-10 rounded-full bg-gray-300 dark:bg-gray-600 shrink-0" />
        {panel}
      </div>

      {/* 桌面端 */}
      <div
        className="hidden md:flex fixed inset-0 z-50 items-start justify-center pt-20 px-4"
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        <div
          className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-h-[min(85vh,calc(100dvh-5rem))] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {panel}
        </div>
      </div>
    </>
  )
}

export default memo(SearchModal)

