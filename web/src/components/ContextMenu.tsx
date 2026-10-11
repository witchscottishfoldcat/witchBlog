'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface ContextMenuProps {
  children: React.ReactNode
  menuItems?: MenuItem[]
  disabled?: boolean
}

type MenuItem =
  | { divider: true }
  | { label: string; icon?: string; action: () => void; disabled?: boolean }

function isMenuDivider(item: MenuItem): item is { divider: true } {
  return 'divider' in item && item.divider === true
}

export default function ContextMenu({ 
  children, 
  menuItems = [],
  disabled = false 
}: ContextMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDark, setIsDark] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const cleanupRef = useRef<(() => void) | null>(null)
  const router = useRouter()


  // 默认菜单项
  const defaultMenuItems: MenuItem[] = [
    {
      label: '复制链接',
      icon: '📋',
      action: async () => {
        if (typeof window !== 'undefined') {
          try {
            await navigator.clipboard.writeText(window.location.href)
            setIsOpen(false)
            // 简单的用户反馈
            console.log('链接已复制到剪贴板')
          } catch {
            // 降级方案：使用传统方法
            const textArea = document.createElement('textarea')
            textArea.value = window.location.href
            textArea.style.position = 'fixed'
            textArea.style.opacity = '0'
            document.body.appendChild(textArea)
            textArea.select()
            try {
              document.execCommand('copy')
              setIsOpen(false)
              console.log('链接已复制到剪贴板')
            } catch (e) {
              console.error('复制失败', e)
            }
            document.body.removeChild(textArea)
          }
        }
      },
    },
    {
      label: '在新标签页打开',
      icon: '↗',
      action: () => {
        if (typeof window !== 'undefined') {
          const newWindow = window.open(window.location.href, '_blank')
          if (!newWindow) {
            // 如果弹窗被阻止，提示用户
            alert('请允许弹出窗口以在新标签页打开')
          }
          setIsOpen(false)
        }
      },
    },
    {
      label: '随便逛逛',
      icon: '→',
      action: () => {
        if (typeof window !== 'undefined') {
          // 跳转到首页
          const locale = window.location.pathname.split('/')[1] || 'zh'
          setIsOpen(false)
          // 使用 Next.js router 进行导航
          router.push(`/${locale}`)
        }
      },
    },
    { divider: true },
    {
      label: '返回顶部',
      icon: '↑',
      action: () => {
        if (typeof window !== 'undefined') {
          window.scrollTo({ top: 0, behavior: 'smooth' })
          setIsOpen(false)
        }
      },
    },
    {
      label: '刷新页面',
      icon: '↻',
      action: () => {
        if (typeof window !== 'undefined') {
          window.location.reload()
        }
      },
    },
  ]

  const items = menuItems.length > 0 ? menuItems : defaultMenuItems

  // 检测暗色模式
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(
        document.documentElement.classList.contains('dark') ||
        window.matchMedia('(prefers-color-scheme: dark)').matches
      )
    }
    checkDarkMode()
    
    const observer = new MutationObserver(checkDarkMode)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', checkDarkMode)
    
    return () => {
      observer.disconnect()
      mediaQuery.removeEventListener('change', checkDarkMode)
    }
  }, [])

  // 处理右键点击
  const handleContextMenu = (e: React.MouseEvent) => {
    if (disabled) return
    
    e.preventDefault()
    e.stopPropagation()

    const x = e.clientX
    const y = e.clientY

    setPosition({ x, y })
    setIsOpen(true)
  }

  // 点击外部关闭菜单
  useEffect(() => {
    if (!isOpen) {
      // 如果菜单关闭，清理之前的事件监听器
      if (cleanupRef.current) {
        cleanupRef.current()
        cleanupRef.current = null
      }
      return
    }

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      
      // 如果点击的是菜单本身或菜单内的元素，不关闭
      if (menuRef.current && menuRef.current.contains(target)) {
        return
      }
      
      // 点击菜单外部任何地方都关闭菜单（标准右键菜单行为）
      setIsOpen(false)
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    // 阻止默认的右键菜单（只在菜单打开时）
    const handleContextMenu = (e: MouseEvent) => {
      // 如果点击的是菜单，不阻止默认行为
      if (menuRef.current && menuRef.current.contains(e.target as Node)) {
        return
      }
      // 如果菜单已打开，再次右键时关闭旧菜单
      if (isOpen) {
        e.preventDefault()
        setIsOpen(false)
      }
    }

    // 添加小延迟避免菜单刚打开时立即关闭
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside, true)
      document.addEventListener('keydown', handleEscape)
      document.addEventListener('contextmenu', handleContextMenu, true)

      // 保存清理函数
      cleanupRef.current = () => {
        document.removeEventListener('mousedown', handleClickOutside, true)
        document.removeEventListener('keydown', handleEscape)
        document.removeEventListener('contextmenu', handleContextMenu, true)
      }
    }, 50)

    return () => {
      clearTimeout(timeoutId)
      // 清理事件监听器
      if (cleanupRef.current) {
        cleanupRef.current()
        cleanupRef.current = null
      }
    }
  }, [isOpen])

  // 调整菜单位置，确保不超出视口
  useEffect(() => {
    if (!isOpen || !menuRef.current) return

    const menu = menuRef.current
    const rect = menu.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    let x = position.x
    let y = position.y

    // 如果菜单超出右边界，向左调整
    if (x + rect.width > viewportWidth) {
      x = viewportWidth - rect.width - 10
    }

    // 如果菜单超出下边界，向上调整
    if (y + rect.height > viewportHeight) {
      y = viewportHeight - rect.height - 10
    }

    // 确保不超出左边界和上边界
    x = Math.max(10, x)
    y = Math.max(10, y)

    menu.style.left = `${x}px`
    menu.style.top = `${y}px`
  }, [isOpen, position])

  return (
    <>
      <div
        ref={containerRef}
        onContextMenu={handleContextMenu}
        className="w-full h-full"
      >
        {children}
      </div>

      {isOpen && (
        <div
          ref={menuRef}
          className="fixed z-[9999] min-w-[200px] rounded-xl shadow-2xl backdrop-blur-md border py-2 transition-all duration-200"
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            backgroundColor: isDark 
              ? 'rgba(17, 24, 39, 0.95)' 
              : 'rgba(255, 255, 255, 0.95)',
            borderColor: isDark
              ? 'rgba(255, 255, 255, 0.15)'
              : 'rgba(255, 255, 255, 0.3)',
            boxShadow: isDark
              ? '0 8px 32px 0 rgba(0, 0, 0, 0.4)'
              : '0 8px 32px 0 rgba(31, 38, 135, 0.25)',
          }}
        >
          {items.map((item, index) => {
            if (isMenuDivider(item)) {
              return (
                <div
                  key={`divider-${index}`}
                  className="my-1 h-px bg-gray-200/50 dark:bg-gray-700/50 mx-2"
                />
              )
            }

            const row = item
            return (
              <button
                key={index}
                onClick={() => {
                  if (!row.disabled) {
                    row.action()
                  }
                }}
                disabled={row.disabled}
                className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/60 dark:hover:bg-gray-800/60 rounded-md mx-1"
                style={{
                  color: isDark ? 'rgba(209, 213, 219, 0.9)' : 'rgb(75, 85, 99)',
                }}
              >
                {row.icon && <span className="text-lg flex-shrink-0">{row.icon}</span>}
                <span className="font-medium">{row.label}</span>
              </button>
            )
          })}
        </div>
      )}
    </>
  )
}
