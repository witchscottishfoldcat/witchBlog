'use client'

import Image from 'next/image'
import Link from 'next/link'

export interface FriendLink {
  id: string
  title: string
  description: string
  url: string
  icon?: string
  image?: string
  locale: string
  category?: string
  tags?: string[]
  sortOrder?: number
}

interface FriendLinkListProps {
  links: FriendLink[]
  title: string
  subtitle: string
  noFriendLinksText?: string
}

// 友链图片是管理员任意填写的外部域名，无法预先全部加入 next/image
// 白名单（remotePatterns）；外链跳过优化器直接加载，同源（MinIO 代理）图仍走优化
function isExternalImage(src: string): boolean {
  return /^https?:\/\//i.test(src)
}

export default function FriendLinkList({ links, title, subtitle, noFriendLinksText = '暂无友链' }: FriendLinkListProps) {
  if (links.length === 0) {
    return (
      <div 
        className="mobile-app-section max-md:mobile-page-card rounded-2xl md:rounded-[32px] border p-6 sm:p-8 md:p-12 text-center backdrop-blur"
        style={{
          backgroundColor: 'var(--theme-card-bg-90)',
          borderColor: 'var(--theme-card-border)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)'
        }}
      >
        <p className="text-gray-500 dark:text-gray-400">{noFriendLinksText}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div 
        className="mobile-app-section max-md:mobile-page-card rounded-2xl md:rounded-[32px] border p-3 sm:p-6 md:p-8 backdrop-blur"
        style={{
          backgroundColor: 'var(--theme-card-bg-90)',
          borderColor: 'var(--theme-card-border)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)'
        }}
      >
        <div className="mb-2 flex items-center gap-3">
          <div className="h-6 sm:h-8 w-1 rounded-full accent-bar-theme" />
          <h1 className="mobile-app-title text-base sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">{title}</h1>
        </div>
        <p className="mobile-app-subtitle ml-0 text-xs text-gray-600 dark:text-gray-400 sm:ml-4 sm:text-sm">{subtitle}</p>
      </div>

      {/* Friend Links Grid */}
      {/* md:auto-rows-fr 让所有行等高；卡片内用 line-clamp 限高并贴顶排列，多余留白落在卡片底部 */}
      <div className="grid gap-2 max-md:mobile-feed-panel max-md:mobile-feed-list md:auto-rows-fr md:grid-cols-2 md:gap-6">
        {links.map((link) => (
          <Link
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mobile-app-card-hover mobile-feed-item group relative overflow-hidden rounded-2xl border p-3 transition-all duration-300 max-md:rounded-none max-md:shadow-none sm:p-6 md:h-full md:hover:-translate-y-1 md:hover:shadow-xl"
            style={{
              backgroundColor: 'var(--theme-card-bg)',
              borderColor: 'var(--theme-card-border)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
            }}
          >
            {/* Left accent bar on hover */}
            <div 
              className="absolute left-0 top-0 h-full w-1 rounded-l-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              style={{
                background: `linear-gradient(to bottom, var(--theme-primary-400), var(--theme-secondary))`
              }}
            />
            
            <div className="flex items-start gap-4">
              {/* Icon/Image */}
              <div className="flex-shrink-0 mr-2">
                {link.image ? (
                  <div
                    className="relative h-14 w-14 overflow-hidden rounded-xl transition-transform duration-300 group-hover:scale-110"
                    style={{
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                    }}
                  >
                    <Image
                      src={link.image}
                      alt={link.title}
                      fill
                      className="object-cover"
                      sizes="56px"
                      unoptimized={isExternalImage(link.image)}
                    />
                  </div>
                ) : link.icon ? (
                  <div 
                    className="flex h-14 w-14 items-center justify-center rounded-xl p-2.5 text-lg text-white transition-transform duration-300 group-hover:scale-110"
                    style={{
                      background: `linear-gradient(to bottom right, var(--theme-primary-400), var(--theme-secondary))`,
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
                    }}
                  >
                    {link.icon}
                  </div>
                ) : (
                  <div 
                    className="flex h-14 w-14 items-center justify-center rounded-xl p-2.5 text-lg text-white transition-transform duration-300 group-hover:scale-110"
                    style={{
                      background: `linear-gradient(to bottom right, var(--theme-primary-400), var(--theme-secondary))`,
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
                    }}
                  >
                    🔗
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <h3 
                  className="mb-2 line-clamp-1 text-lg font-semibold transition-colors duration-300"
                  title={link.title}
                  style={{
                    color: 'var(--theme-primary-700)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--theme-primary-600)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--theme-primary-700)'
                  }}
                >
                  {link.title}
                </h3>
                <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400 line-clamp-2">
                  {link.description}
                </p>
              </div>

              {/* Arrow Icon */}
              <div className="flex-shrink-0 self-center">
                <div 
                  className="flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300 group-hover:translate-x-1"
                  style={{
                    backgroundColor: 'var(--theme-primary-50)',
                    color: 'var(--theme-primary-600)'
                  }}
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Tags：整宽一行，避免挤在窄内容列里叠成多行把卡片撑高 */}
            {link.tags && link.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {link.tags.slice(0, 3).map((tag, index) => (
                  <span
                    key={index}
                    className="rounded-full px-2 py-0.5 text-xs"
                    style={{
                      backgroundColor: 'var(--theme-tag-bg)',
                      color: 'var(--theme-primary-600)'
                    }}
                  >
                    #{tag}
                  </span>
                ))}
                {link.tags.length > 3 && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    +{link.tags.length - 3}
                  </span>
                )}
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  )
}

