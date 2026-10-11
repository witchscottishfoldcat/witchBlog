'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
import { slugifyHeading } from '@/lib/heading-slug'

interface Heading {
  id: string
  text: string
  level: number
}

interface TableOfContentsProps {
  contentRef?: React.RefObject<HTMLElement>
}

export default function TableOfContents({ contentRef }: TableOfContentsProps) {
  const [headings, setHeadings] = useState<Heading[]>([])
  const [activeId, setActiveId] = useState<string>('')
  const [isDark, setIsDark] = useState(false)
  const [primaryRgb, setPrimaryRgb] = useState<string>('77, 124, 194')
  const [mobileExpanded, setMobileExpanded] = useState(false)
  const tocRef = useRef<HTMLDivElement>(null)

  // 提取文章中的标题
  useEffect(() => {
    const extractHeadings = () => {
      const container = contentRef?.current || document.querySelector('.markdown-content')
      if (!container) return

      const headingElements = container.querySelectorAll('h1, h2, h3, h4, h5, h6')
      const extractedHeadings: Heading[] = []

      headingElements.forEach((element, index) => {
        const text = element.textContent || ''
        const level = parseInt(element.tagName.charAt(1))

        if (!element.id) {
          const generatedId = slugifyHeading(text) || `heading-${index}`
          element.id = generatedId
        }

        extractedHeadings.push({
          id: element.id,
          text: text.trim(),
          level,
        })
      })

      setHeadings(extractedHeadings)
      
      // 如果有标题，设置第一个为默认激活
      if (extractedHeadings.length > 0) {
        setActiveId(extractedHeadings[0].id)
      }
    }

    // 延迟执行，确保 DOM 已渲染
    const timer = setTimeout(extractHeadings, 100)
    return () => clearTimeout(timer)
  }, [contentRef])

  // 监听滚动，高亮当前阅读位置 + 处理 fixed 定位
  useEffect(() => {
    if (headings.length === 0) return

    const handleScroll = () => {
      // 视口顶部位置（考虑导航栏和偏移）
      const viewportTop = window.scrollY + 150

      let currentActiveId = ''
      
      // 策略：找到最接近视口顶部且已经滚动过的标题
      // 从后往前遍历，找到最后一个已经滚动到视口上方的标题
      for (let i = headings.length - 1; i >= 0; i--) {
        const element = document.getElementById(headings[i].id)
        if (!element) continue

        const rect = element.getBoundingClientRect()
        const elementTop = window.scrollY + rect.top
        
        // 如果标题的顶部位置小于等于视口顶部位置，说明已经滚动过了
        // 我们选择最后一个满足这个条件的标题
        if (elementTop <= viewportTop) {
          currentActiveId = headings[i].id
          break
        }
      }

      // 如果滚动到页面很顶部，高亮第一个标题
      if (window.scrollY < 50 && headings.length > 0) {
        currentActiveId = headings[0].id
      }

      // 如果找到了标题且与当前激活的不同，更新状态
      if (currentActiveId && currentActiveId !== activeId) {
        setActiveId(currentActiveId)
      }
    }

    // 使用 requestAnimationFrame 优化性能
    let ticking = false
    const throttledHandleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll()
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', throttledHandleScroll, { passive: true })
    window.addEventListener('resize', throttledHandleScroll, { passive: true })
    handleScroll() // 初始执行一次

    return () => {
      window.removeEventListener('scroll', throttledHandleScroll)
      window.removeEventListener('resize', throttledHandleScroll)
    }
  }, [headings, contentRef, activeId])

  // 平滑滚动到指定标题
  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      // 立即更新激活ID，使父级标题能立即高亮显示
      setActiveId(id)
      
      const offset = 100 // 偏移量，避免被导航栏遮挡
      const elementPosition = element.getBoundingClientRect().top + window.scrollY
      const offsetPosition = elementPosition - offset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      })
    }
  }

  // 检测暗色模式并获取主题色RGB值
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(
        document.documentElement.classList.contains('dark') ||
        window.matchMedia('(prefers-color-scheme: dark)').matches
      )
    }
    
    const getPrimaryRgb = () => {
      const root = getComputedStyle(document.documentElement)
      const primaryColor = root.getPropertyValue('--theme-primary-500').trim()
      
      // 如果CSS变量是HSL格式，转换为RGB
      if (primaryColor.startsWith('hsl')) {
        // hsl(215, 70%, 60%) 格式
        const match = primaryColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/)
        if (match) {
          const h = parseInt(match[1]) / 360
          const s = parseInt(match[2]) / 100
          const l = parseInt(match[3]) / 100
          
          // HSL to RGB conversion
          const c = (1 - Math.abs(2 * l - 1)) * s
          const x = c * (1 - Math.abs(((h * 6) % 2) - 1))
          const m = l - c / 2
          
          let r = 0, g = 0, b = 0
          if (h < 1/6) { r = c; g = x; b = 0 }
          else if (h < 2/6) { r = x; g = c; b = 0 }
          else if (h < 3/6) { r = 0; g = c; b = x }
          else if (h < 4/6) { r = 0; g = x; b = c }
          else if (h < 5/6) { r = x; g = 0; b = c }
          else { r = c; g = 0; b = x }
          
          r = Math.round((r + m) * 255)
          g = Math.round((g + m) * 255)
          b = Math.round((b + m) * 255)
          
          setPrimaryRgb(`${r}, ${g}, ${b}`)
          return
        }
      }
      
      // 如果无法解析，使用默认值
      setPrimaryRgb('77, 124, 194')
    }
    
    checkDarkMode()
    getPrimaryRgb()
    
    // 监听主题变化
    const observer = new MutationObserver(() => {
      checkDarkMode()
      getPrimaryRgb()
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'style'],
    })
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', checkDarkMode)
    
    return () => {
      observer.disconnect()
      mediaQuery.removeEventListener('change', checkDarkMode)
    }
  }, [])

  // 隐藏滚动条样式
  useEffect(() => {
    const styleId = 'toc-scrollbar-hide-style'
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style')
      style.id = styleId
      style.textContent = `
        .toc-scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .toc-scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `
      document.head.appendChild(style)
    }
  }, [])

  // 获取当前激活标题的所有父级标题ID（形成父级链）
  const parentIds = useMemo(() => {
    if (!activeId || headings.length === 0) return []

    const activeIndex = headings.findIndex((h) => h.id === activeId)
    if (activeIndex === -1) return []

    const activeHeading = headings[activeIndex]
    const ids: string[] = []
    let targetLevel = activeHeading.level

    for (let i = activeIndex - 1; i >= 0; i--) {
      const heading = headings[i]
      if (heading.level < targetLevel) {
        ids.unshift(heading.id)
        targetLevel = heading.level
        if (targetLevel === 1) break
      }
    }

    return ids
  }, [activeId, headings])

  if (headings.length === 0) {
    return null
  }

  const handleHeadingClick = (id: string) => {
    scrollToHeading(id)
    setMobileExpanded(false)
  }

  return (
    <div ref={tocRef} data-sidebar-sticky-exempt>
      <button
        type="button"
        onClick={() => setMobileExpanded((v) => !v)}
        className="mobile-toc-bar lg:hidden touch-target mb-3 flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-gray-800 dark:text-gray-200"
        aria-expanded={mobileExpanded}
      >
        <span>目录</span>
        <span className="text-xs opacity-70">{mobileExpanded ? '收起' : '展开'}</span>
      </button>
      <div
        className={`${mobileExpanded ? 'block' : 'hidden'} lg:block max-h-[min(50vh,400px)] lg:max-h-[calc(100vh-8rem)] overflow-y-auto toc-scrollbar-hide`}
      >
      <div
        className="rounded-xl p-3 backdrop-blur-md shadow-lg transition-all duration-300"
        style={{
          backgroundColor: isDark 
            ? 'rgba(17, 24, 39, 0.5)' 
            : 'rgba(255, 255, 255, 0.6)',
          border: isDark
            ? '1px solid rgba(255, 255, 255, 0.1)'
            : '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: isDark
            ? '0 8px 32px 0 rgba(0, 0, 0, 0.3)'
            : '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
        }}
      >
        <h3 className="hidden lg:block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3 pb-2 border-b border-gray-200/40 dark:border-gray-700/40 uppercase tracking-wider">
          目录
        </h3>
        <nav className="space-y-0.5">
          {headings.map((heading, index) => {
            const isActive = activeId === heading.id
            const isParent = parentIds.includes(heading.id)
            const indentLevel = heading.level - 1
            // 使用 index 和 id 组合确保 key 唯一性
            const uniqueKey = `${heading.id}-${index}`

            // 根据层级关系确定样式 - 更简洁美观的设计
            const parentIndex = isParent ? parentIds.indexOf(heading.id) : -1

            // 激活项样式 - 更美观的高亮效果，使用渐变和阴影
            const activeStyle = isActive ? {
              borderLeft: `3px solid var(--theme-primary-500)`,
              color: 'var(--theme-primary-600)',
              background: isDark 
                ? `linear-gradient(90deg, rgba(${primaryRgb}, 0.15) 0%, rgba(${primaryRgb}, 0.08) 100%)`
                : `linear-gradient(90deg, rgba(${primaryRgb}, 0.2) 0%, rgba(${primaryRgb}, 0.1) 100%)`,
              fontWeight: '600' as const,
              position: 'relative' as const,
              boxShadow: isDark
                ? `0 2px 8px rgba(${primaryRgb}, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)`
                : `0 2px 8px rgba(${primaryRgb}, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.5)`,
            } : {}
            
            // 父级项样式 - 优雅的渐变效果，显示层级关系
            // 注意：如果同时是激活项，activeStyle 会覆盖此样式
            const parentStyle = isParent && !isActive ? {
              borderLeft: `2px solid rgba(${primaryRgb}, ${0.25 + parentIndex * 0.12})`,
              color: isDark 
                ? `rgba(${primaryRgb}, ${0.7 + parentIndex * 0.1})`
                : `rgba(${primaryRgb}, ${0.6 + parentIndex * 0.1})`,
              background: isDark 
                ? `linear-gradient(90deg, rgba(${primaryRgb}, ${0.1 + parentIndex * 0.05}) 0%, rgba(${primaryRgb}, ${0.05 + parentIndex * 0.03}) 100%)`
                : `linear-gradient(90deg, rgba(${primaryRgb}, ${0.15 + parentIndex * 0.05}) 0%, rgba(${primaryRgb}, ${0.08 + parentIndex * 0.03}) 100%)`,
              fontWeight: '500' as const,
              position: 'relative' as const,
              boxShadow: isDark
                ? `0 1px 4px rgba(${primaryRgb}, ${0.1 + parentIndex * 0.05})`
                : `0 1px 4px rgba(${primaryRgb}, ${0.08 + parentIndex * 0.04})`,
            } : {}
            
            // 默认样式 - 普通文本
            const defaultStyle = !isActive && !isParent ? {
              borderLeft: '2px solid transparent',
              color: isDark ? 'rgba(156, 163, 175, 0.7)' : 'rgba(75, 85, 99, 0.7)',
              backgroundColor: 'transparent',
              fontWeight: '400' as const,
            } : {}

            return (
              <button
                key={uniqueKey}
                onClick={() => handleHeadingClick(heading.id)}
                className="block w-full text-left px-2 py-1.5 rounded-md text-sm transition-all duration-300 relative overflow-hidden"
                style={{
                  paddingLeft: `${0.5 + indentLevel * 0.75}rem`,
                  ...defaultStyle,
                  ...parentStyle,
                  ...activeStyle,
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    if (isParent) {
                      const idx = parentIds.indexOf(heading.id)
                      e.currentTarget.style.background = isDark 
                        ? `linear-gradient(90deg, rgba(${primaryRgb}, ${0.15 + idx * 0.08}) 0%, rgba(${primaryRgb}, ${0.1 + idx * 0.05}) 100%)`
                        : `linear-gradient(90deg, rgba(${primaryRgb}, ${0.2 + idx * 0.08}) 0%, rgba(${primaryRgb}, ${0.12 + idx * 0.05}) 100%)`
                    } else {
                      e.currentTarget.style.backgroundColor = isDark
                        ? 'rgba(31, 41, 55, 0.25)'
                        : 'rgba(255, 255, 255, 0.35)'
                    }
                  }
                }}
                onMouseLeave={(e) => {
                  if (isActive) {
                    e.currentTarget.style.background = isDark 
                      ? `linear-gradient(90deg, rgba(${primaryRgb}, 0.15) 0%, rgba(${primaryRgb}, 0.08) 100%)`
                      : `linear-gradient(90deg, rgba(${primaryRgb}, 0.2) 0%, rgba(${primaryRgb}, 0.1) 100%)`
                  } else if (isParent) {
                    const idx = parentIds.indexOf(heading.id)
                    e.currentTarget.style.background = isDark 
                      ? `linear-gradient(90deg, rgba(${primaryRgb}, ${0.1 + idx * 0.05}) 0%, rgba(${primaryRgb}, ${0.05 + idx * 0.03}) 100%)`
                      : `linear-gradient(90deg, rgba(${primaryRgb}, ${0.15 + idx * 0.05}) 0%, rgba(${primaryRgb}, ${0.08 + idx * 0.03}) 100%)`
                  } else {
                    e.currentTarget.style.background = 'transparent'
                  }
                }}
              >
                {heading.text}
              </button>
            )
          })}
        </nav>
      </div>
      </div>
    </div>
  )
}
