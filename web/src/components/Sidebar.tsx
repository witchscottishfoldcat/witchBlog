'use client'

import { ReactNode, useEffect, useRef } from 'react'
import React from 'react'
import Icon from './Icon'
import { getImageUrl } from '@/lib/image-utils'
import { logger } from '@/lib/logger'

interface SidebarProps {
  position?: 'left' | 'right'
  children: ReactNode
}

const SIDEBAR_STICKY_TOP = 80
const SIDEBAR_STICKY_BOTTOM_SAFE_AREA = 16

function clearStickyCard(card: HTMLElement) {
  card.style.removeProperty('position')
  card.style.removeProperty('top')
  card.style.removeProperty('z-index')
  card.style.removeProperty('max-height')
  card.style.removeProperty('overflow-y')
  card.style.removeProperty('overscroll-behavior')
}

function clearStickyStack(stack: HTMLElement) {
  stack.style.removeProperty('position')
  stack.style.removeProperty('top')
  stack.style.removeProperty('z-index')
}

export default function Sidebar({ position = 'left', children }: SidebarProps) {
  const stackRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const stack = stackRef.current
    if (!stack) return

    const desktopQuery = window.matchMedia('(min-width: 1024px)')
    let animationFrame = 0

    const updateStickyTail = () => {
      if (animationFrame) return
      animationFrame = window.requestAnimationFrame(() => {
        animationFrame = 0
        const cards = Array.from(stack.children).filter(
          (child): child is HTMLElement => child instanceof HTMLElement
        )

        cards.forEach(clearStickyCard)

        // 目录等拥有独立吸附逻辑的组件不参与通用侧栏吸附。
        if (
          !desktopQuery.matches
          || cards.some((card) => card.hasAttribute('data-sidebar-sticky-exempt'))
        ) {
          clearStickyStack(stack)
          return
        }

        const availableHeight = window.innerHeight
          - SIDEBAR_STICKY_TOP
          - SIDEBAR_STICKY_BOTTOM_SAFE_AREA
        const lastCard = cards.at(-1)
        let stickyCards: HTMLElement[] = []

        if (lastCard && lastCard.getBoundingClientRect().height <= availableHeight) {
          stickyCards = [lastCard]

          const secondLastCard = cards.at(-2)
          if (secondLastCard) {
            const twoCardHeight = lastCard.offsetTop
              + lastCard.getBoundingClientRect().height
              - secondLastCard.offsetTop

            if (twoCardHeight <= availableHeight) {
              stickyCards = [secondLastCard, lastCard]
            }
          }
        }

        const stickySet = new Set(stickyCards)

        cards.forEach((card) => {
          if (!stickySet.has(card)) clearStickyCard(card)
        })

        if (stickyCards.length === 0) {
          clearStickyStack(stack)
          return
        }

        // 整个侧栏只做一次 sticky。当前面的卡片滚出后，倒数两张会作为
        // 同一个物理整体停在顶部；到达容器底部时也由浏览器整体释放。
        const stickyTailOffset = stickyCards[0].offsetTop
        stack.style.position = 'sticky'
        stack.style.top = `${SIDEBAR_STICKY_TOP - stickyTailOffset}px`
        stack.style.zIndex = '20'
      })
    }

    const mutationObserver = new MutationObserver(updateStickyTail)
    mutationObserver.observe(stack, { childList: true })

    const resizeObserver = new ResizeObserver(updateStickyTail)
    resizeObserver.observe(stack)

    desktopQuery.addEventListener('change', updateStickyTail)
    window.addEventListener('resize', updateStickyTail)
    updateStickyTail()

    return () => {
      window.cancelAnimationFrame(animationFrame)
      mutationObserver.disconnect()
      resizeObserver.disconnect()
      desktopQuery.removeEventListener('change', updateStickyTail)
      window.removeEventListener('resize', updateStickyTail)
      clearStickyStack(stack)
      Array.from(stack.children)
        .filter((child): child is HTMLElement => child instanceof HTMLElement)
        .forEach(clearStickyCard)
    }
  }, [])

  return (
    <aside
      className={`h-full w-full flex-shrink-0 ${
        position === 'left' ? 'order-1' : 'order-3'
      }`}
    >
      <div ref={stackRef} className="space-y-4 sm:space-y-6">{children}</div>
    </aside>
  )
}

interface SidebarCardProps {
  title?: string
  children: ReactNode
  className?: string
  heroParallaxBoundary?: boolean
}

export function SidebarCard({ title, children, className = '', heroParallaxBoundary = false }: SidebarCardProps) {
  return (
    <div
      data-sidebar-card
      data-hero-parallax-boundary={heroParallaxBoundary ? '' : undefined}
      className={`max-md:mobile-page-card max-md:hover:shadow-none md:rounded-2xl md:p-4 sm:md:p-6 md:shadow-lg md:hover:shadow-xl transition-all duration-300 ${className}`}
      style={{
        backgroundColor: 'var(--theme-card-bg)',
      }}
    >
      {title && (
        <h3 className="max-md:mb-2 max-md:text-[11px] max-md:font-semibold max-md:uppercase max-md:tracking-wide max-md:text-gray-500 max-md:dark:text-gray-400 md:text-base sm:md:text-lg md:font-bold md:mb-3 sm:md:mb-4 md:normal-case md:tracking-normal text-gray-800 dark:text-gray-200">
          {title}
        </h3>
      )}
      {children}
    </div>
  )
}

interface ProfileCardProps {
  name: string
  avatar: string
  motto: string
  socialLinks?: Array<{ icon: string; href: string; label: string }>
  links?: Array<{ name: string; icon: string; url: string }>
  resourceLinks?: Array<{ title: string; url: string; icon: string }>
}

export function ProfileCard({ name, avatar, motto, socialLinks = [], links = [], resourceLinks = [] }: ProfileCardProps) {
  // 优先使用资源链接接口的数据，如果没有则使用社交链接
  const allDisplayLinks = resourceLinks.length > 0 
    ? resourceLinks.map(link => ({
        name: link.title,
        icon: link.icon,
        url: link.url,
      }))
    : (links.length > 0 
        ? links 
        : socialLinks.map(link => ({
            name: link.label,
            icon: link.icon,
            url: link.href,
          }))
      )

  // 生成图片 URL：只使用接口传来的头像，不做默认回退
  const imageSrc = (() => {
    if (!avatar) return null
    const resolved = getImageUrl(avatar)
    return resolved || null
  })()
  const isExternalHttp = avatar?.startsWith('http') ?? false

  return (
    <SidebarCard heroParallaxBoundary>
      <div className="text-center">
        <div className="relative mx-auto mb-2 h-16 w-16 max-md:mb-2 sm:mb-4 sm:h-28 sm:w-28 md:h-32 md:w-32">
          <div className="absolute inset-0 rounded-full avatar-border-theme p-1">
            <div className="w-full h-full rounded-full bg-white dark:bg-gray-800 overflow-hidden relative">
              {imageSrc ? (
                <img
                  src={imageSrc}
                  alt={name}
                  className="w-full h-full object-cover"
                  crossOrigin={isExternalHttp ? 'anonymous' : undefined}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    logger.error('Failed to load avatar image:', {
                      src: imageSrc,
                      naturalWidth: target.naturalWidth,
                      naturalHeight: target.naturalHeight,
                    })
                    // 外部 URL 尝试直接加载原始地址
                    if (isExternalHttp) {
                      logger.log('Trying direct URL:', avatar)
                      target.src = avatar!
                    }
                  }}
                  onLoad={() => {
                    logger.log('Avatar image loaded successfully:', imageSrc)
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                  无头像
                </div>
              )}
            </div>
          </div>
        </div>
        <h3 className="mb-1 text-sm font-bold text-gray-800 dark:text-gray-200 sm:mb-2 sm:text-xl">
          {name}
        </h3>
        <div className="divider-theme my-2 h-px sm:my-4" />
        <p className="mb-2 px-1 text-[11px] text-gray-600 dark:text-gray-400 sm:mb-4 sm:px-2 sm:text-sm">
          {motto}
        </p>
        {allDisplayLinks.length > 0 && (
          <div className="flex gap-2 justify-center mb-1 flex-wrap">
            {allDisplayLinks.map((link, index) => {
              // 判断是否是 iconify 图标格式（包含冒号）
              const isIconifyIcon = link.icon.includes(':')
              
              return (
                <a
                  key={index}
                  rel="me"
                  aria-label={link.name}
                  href={link.url}
                  target="_blank"
                  className="btn-regular flex h-8 w-8 items-center justify-center rounded-lg active:scale-90 transition-all sm:h-10 sm:w-10"
                >
                  {isIconifyIcon ? (
                    <Icon name={link.icon} className="text-[1.5rem]" />
                  ) : (
                    <span className="text-lg">{link.icon}</span>
                  )}
                </a>
              )
            })}
          </div>
        )}
      </div>
    </SidebarCard>
  )
}


