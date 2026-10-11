/**
 * 导航栏下拉菜单组件
 * 简洁、稳定的实现
 */

'use client'

import { useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Icon } from '@iconify/react'
import { isCurrentLocation, replayHeroEntrance } from '@/lib/hero-entrance'

interface MenuItem {
  key: string
  label: string
  icon: string
  href: string
  external?: boolean
}

interface NavbarDropdownProps {
  label: string
  icon: string
  items: MenuItem[]
  isScrolled: boolean
  isOpen: boolean
  onToggle: () => void
  onClose: () => void
}

export default function NavbarDropdown({
  label,
  icon,
  items,
  isScrolled,
  isOpen,
  onToggle,
  onClose,
}: NavbarDropdownProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // 点击外部关闭菜单
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    // 使用捕获阶段，确保先处理
    if (typeof document !== 'undefined') {
      document.addEventListener('mousedown', handleClickOutside, true)
      return () => {
        try {
          if (typeof document !== 'undefined' && document.removeEventListener) {
            document.removeEventListener('mousedown', handleClickOutside, true)
          }
        } catch {
          // 静默处理清理错误
        }
      }
    }
    return () => {} // 确保所有代码路径都有返回值
  }, [isOpen, onClose])

  const handleToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onToggle()
  }, [onToggle])

  const handleItemClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onClose()
    // 对于外部链接，让浏览器默认行为处理
    // 对于内部链接，Link 组件会自动处理导航
  }, [onClose])

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={handleToggle}
        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center space-x-1 ${
          isScrolled
            ? 'text-gray-700 dark:text-gray-300 hover:bg-[var(--theme-primary-100)] dark:hover:bg-gray-800'
            : 'text-white hover:bg-white/20 dark:hover:bg-gray-900/20'
        }`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Icon icon={icon} className="h-5 w-5" style={{ color: 'var(--theme-primary-500)' }} />
        <span>{label}</span>
        <span className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>⌄</span>
      </button>

      {/* 下拉菜单 */}
      <div
        className={`absolute right-0 top-full mt-2 w-48 rounded-xl border border-white/50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-lg p-2 transition-all duration-200 ease-out ${
          isOpen
            ? 'opacity-100 visible translate-y-0 pointer-events-auto'
            : 'opacity-0 invisible -translate-y-2 pointer-events-none'
        }`}
        style={{
          transform: isOpen ? 'translateY(0)' : 'translateY(-8px)',
        }}
      >
        <div className="space-y-1">
          {items.map((item) => {
            const isExternal = !!item.external
            const className = "flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800/70 active:bg-gray-200 dark:active:bg-gray-700/70 focus:outline-none"
            
            if (isExternal) {
              return (
                <a
                  key={item.key}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleItemClick}
                  className={className}
                >
                  <div className="flex items-center space-x-2">
                    <Icon icon={item.icon} className="h-4 w-4" style={{ color: 'var(--theme-primary-500)' }} />
                    <span>{item.label}</span>
                  </div>
                  <span className="text-xs text-gray-400">↗</span>
                </a>
              )
            }
            
            return (
              <Link
                key={item.key}
                href={item.href}
                prefetch={true}
                onClick={(e) => {
                  // 已经在本页时 Next 不会导航，改为重播入场滚动动画
                  if (isCurrentLocation(item.href)) {
                    e.preventDefault()
                    replayHeroEntrance()
                  }
                  handleItemClick(e)
                }}
                className={className}
              >
                <div className="flex items-center space-x-2">
                  <Icon icon={item.icon} className="h-4 w-4" style={{ color: 'var(--theme-primary-500)' }} />
                  <span>{item.label}</span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
