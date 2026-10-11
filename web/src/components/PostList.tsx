'use client'

import { useState, useMemo, useCallback, memo, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { normalizeTags } from '@/lib/post-utils'
import { Icon } from '@iconify/react'
import PostCard from './PostCard'

interface Post {
  slug: string
  title: string
  date: string
  description?: string
  category?: string
  subcategory?: string
  tags?: string[]
  wordCount?: number
  isEncrypted?: boolean
  pinned?: boolean // 是否置顶
  author?: string // 作者
}

interface PostListProps {
  posts: Post[]
  locale: string
  /** 首页等场景：手机端隐藏工具栏，更紧凑 */
  compact?: boolean
  /** 与桌面端搜索、列表/网格切换控件同行显示的标题。 */
  desktopTitle?: string
}

function PostList({ posts, locale, compact = false, desktopTitle }: PostListProps) {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const t = useTranslations('common')
  const tBlog = useTranslations('blog')
  const tSearch = useTranslations('search')
  
  const handleSetListMode = useCallback(() => setViewMode('list'), [])
  const handleSetGridMode = useCallback(() => setViewMode('grid'), [])

  // 手机端固定列表信息流，避免网格在窄屏难用
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)')
    const sync = () => {
      if (mq.matches) setViewMode('list')
    }
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])
  
  // 搜索过滤逻辑
  const filteredAndSortedPosts = useMemo(() => {
    let filtered = posts
    
    // 如果有搜索查询，进行过滤
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      const queryWords = query.split(/\s+/).filter(Boolean)
      
      filtered = posts.filter((post) => {
        const title = post.title?.toLowerCase() || ''
        const description = post.description?.toLowerCase() || ''
        const tags = normalizeTags(post.tags).join(' ').toLowerCase()
        const category = post.category?.toLowerCase() || ''
        const subcategory = post.subcategory?.toLowerCase() || ''
        
        // 支持多词搜索（所有词都必须匹配）
        return queryWords.every(word => 
          title.includes(word) ||
          description.includes(word) ||
          tags.includes(word) ||
          category.includes(word) ||
          subcategory.includes(word)
        )
      })
    }
    
    // 对文章进行排序：置顶文章在前，然后按日期降序
    return filtered.sort((a, b) => {
      // 首先按 pinned 排序（置顶在前）
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      // 如果都是置顶或都不是置顶，按日期降序
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    })
  }, [posts, searchQuery])
  
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }, [])
  
  const handleClearSearch = useCallback(() => {
    setSearchQuery('')
  }, [])
  
  const toggleSearch = useCallback(() => {
    setIsSearchOpen(prev => !prev)
    if (isSearchOpen) {
      setSearchQuery('') // 关闭时清空搜索
    }
  }, [isSearchOpen])

  if (posts.length === 0) {
    return (
      <div 
        className="max-md:mobile-page-card rounded-2xl border p-6 text-center backdrop-blur sm:p-12"
        style={{
          backgroundColor: 'var(--theme-card-bg-90)',
          borderColor: 'var(--theme-card-border)',
        }}
      >
        <div className="mb-2 text-4xl sm:mb-4 sm:text-6xl">📝</div>
        <p className="mb-2 text-sm text-gray-500 dark:text-gray-400 sm:text-lg">{tBlog('noPosts')}</p>
        {process.env.NODE_ENV === 'development' && (
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
            提示：请确保后端 API 服务已启动 (http://127.0.0.1:8000)
          </p>
        )}
      </div>
    )
  }

  return (
    <div>
      <div
        className={`mb-3 flex flex-col gap-2 sm:mb-6 sm:flex-row sm:flex-nowrap sm:items-center sm:gap-3 ${desktopTitle ? 'sm:justify-between rounded-xl border p-3 shadow-lg sm:px-5 sm:py-4' : 'sm:justify-end'}${compact ? ' max-md:hidden' : ''}`}
        style={desktopTitle ? {
          backgroundColor: 'var(--theme-card-bg)',
          borderColor: 'var(--theme-card-border)',
        } : undefined}
      >
        {desktopTitle && (
          <div className="flex min-w-0 shrink-0 items-center gap-2.5">
            <span className="hidden h-8 w-1 shrink-0 rounded-full accent-bar-theme md:block" aria-hidden />
            <h1 className="hidden shrink-0 text-3xl font-bold leading-tight text-gray-800 opacity-90 md:block lg:text-4xl dark:text-gray-200">
              {desktopTitle}
            </h1>
          </div>
        )}

        {/* 内联搜索框：作为标题与按钮组之间的弹性子项，空间不足时自身收缩而不是换行下弹 */}
        {isSearchOpen && (
          <div
            className="order-first flex w-full min-w-0 items-center gap-2 rounded-lg border border-[var(--theme-primary-200)] px-2.5 py-1.5 backdrop-blur transition-all focus-within:border-[var(--theme-primary-400)] sm:order-none sm:w-auto sm:max-w-md sm:flex-1"
            style={{
              backgroundColor: 'var(--theme-card-bg-90)',
            }}
          >
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder={t('search')}
              className="w-full min-w-0 border-none bg-transparent text-sm text-gray-900 outline-none placeholder-gray-400 dark:text-gray-100"
              autoFocus
            />
            {searchQuery && (
              <span className="shrink-0 text-xs text-gray-500 dark:text-gray-400">
                {filteredAndSortedPosts.length}
              </span>
            )}
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 dark:text-gray-500 dark:hover:bg-gray-700"
                aria-label="清除搜索"
              >
                <Icon icon="mdi:close" className="text-base" />
              </button>
            )}
          </div>
        )}

        {/* Search Toggle Button */}
        <div className="flex w-full items-center gap-2 sm:w-auto sm:shrink-0">
          <button
            onClick={toggleSearch}
            className={`shrink-0 rounded-lg p-2 transition-colors ${
              isSearchOpen
                ? 'bg-[var(--theme-primary-500)] text-white'
                : 'bg-[var(--theme-card-bg)] text-[var(--theme-primary-700)] hover:bg-[var(--theme-primary-100)]'
            }`}
            aria-label={tSearch('hint') || '搜索'}
          >
            <Icon icon="mdi:magnify" className="text-lg" />
          </button>

          <div
            className="mobile-segmented hidden flex-1 sm:inline-flex sm:flex-none sm:rounded-lg sm:p-1 sm:shadow-lg"
            style={{ backgroundColor: 'var(--theme-card-bg)' }}
          >
            <button
              type="button"
              onClick={handleSetListMode}
              className="sm:px-4 sm:py-2 sm:rounded-md sm:text-sm sm:font-medium sm:transition-all"
              style={{
                backgroundColor: viewMode === 'list' ? 'var(--theme-primary-500)' : 'transparent',
                color: viewMode === 'list' ? 'white' : 'var(--theme-primary-700)',
              }}
            >
              <span className="sm:mr-2">☰</span>
              {t('list')}
            </button>
            <button
              type="button"
              onClick={handleSetGridMode}
              className="sm:px-4 sm:py-2 sm:rounded-md sm:text-sm sm:font-medium sm:transition-all"
              style={{
                backgroundColor: viewMode === 'grid' ? 'var(--theme-primary-500)' : 'transparent',
                color: viewMode === 'grid' ? 'white' : 'var(--theme-primary-700)',
              }}
            >
              <span className="sm:mr-2">⊞</span>
              {t('grid')}
            </button>
          </div>
        </div>
      </div>

      {compact && (
        <div className="mb-2 flex items-center justify-end md:hidden">
          <button
            type="button"
            onClick={toggleSearch}
            className={`rounded-lg p-1.5 transition-colors ${
              isSearchOpen
                ? 'bg-[var(--theme-primary-500)] text-white'
                : 'bg-[var(--theme-card-bg)] text-[var(--theme-primary-700)]'
            }`}
            aria-label={tSearch('hint') || '搜索'}
          >
            <Icon icon="mdi:magnify" className="text-base" />
          </button>
        </div>
      )}
      {compact && isSearchOpen && (
        <div
          className="mobile-page-card mb-2 rounded-lg border border-[var(--theme-primary-200)] p-2 backdrop-blur focus-within:border-[var(--theme-primary-400)] md:hidden"
          style={{
            backgroundColor: 'var(--theme-card-bg-90)',
          }}
        >
          <div className="flex items-center gap-2">
            <Icon icon="mdi:magnify" className="text-base text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder={t('search')}
              className="w-full min-w-0 border-none bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400 dark:text-gray-100"
              autoFocus
            />
            {searchQuery && (
              <button type="button" onClick={handleClearSearch} className="p-1 text-gray-400" aria-label="清除">
                <Icon icon="mdi:close" className="text-base" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Posts Container */}
      {filteredAndSortedPosts.length === 0 && searchQuery ? (
        <div 
          className="rounded-2xl border p-8 sm:p-12 text-center backdrop-blur"
          style={{
            backgroundColor: 'var(--theme-card-bg-90)',
            borderColor: 'var(--theme-card-border)',
          }}
        >
          <div className="mb-4 text-6xl">🔍</div>
          <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">{tSearch('noResults')}</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm">{tSearch('tryOtherKeywords')}</p>
        </div>
      ) : (
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-8 md:gap-12'
              : `max-md:mobile-feed-panel max-md:mobile-feed-list flex flex-col gap-3 sm:gap-8${compact ? ' max-md:gap-0' : ''}`
          }
        >
          {filteredAndSortedPosts.map((post) => (
            <PostCard
              key={post.slug}
              {...post}
              locale={locale}
              viewMode={viewMode}
            />
          ))}
        </div>
      )}
    </div>
  )
}

const MemoizedPostList = memo(PostList)
export default MemoizedPostList


