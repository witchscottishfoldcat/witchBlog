'use client'

import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react'
import { useLocale } from 'next-intl'
import Calendar from './Calendar'

const MOBILE_MAX = 767
const BUTTON_SIZE_DESKTOP = 56
const BUTTON_SIZE_MOBILE = 48

function isMobileViewport() {
  return typeof window !== 'undefined' && window.innerWidth <= MOBILE_MAX
}

function getButtonSize() {
  return isMobileViewport() ? BUTTON_SIZE_MOBILE : BUTTON_SIZE_DESKTOP
}

function getDefaultPosition() {
  const buttonSize = getButtonSize()
  const padding = 12
  const tabBarTotal = 56 + 8 // 与 --mobile-tab-bar-height + 间距近似
  const bottomGap = isMobileViewport() ? tabBarTotal : 100
  return {
    x: padding,
    y: Math.max(72, window.innerHeight - buttonSize - bottomGap),
  }
}

export default function FloatingCalendar() {
  const [isOpen, setIsOpen] = useState(false)
  // 默认左侧靠下（首次打开无 localStorage 时由 useEffect 再细调）
  const [position, setPosition] = useState({ x: 20, y: 400 })
  const [isDragging, setIsDragging] = useState(false)
  const [cardStyle, setCardStyle] = useState<React.CSSProperties>({})
  const hasMovedRef = useRef(false)
  const dragOffset = useRef({ x: 0, y: 0 })
  const positionRef = useRef({ x: 20, y: 400 })
  const buttonRef = useRef<HTMLButtonElement>(null)
  const locale = useLocale()

  // 从 localStorage 加载保存的位置；若无则使用默认：左侧靠下
  useEffect(() => {
    if (typeof window === 'undefined') return
    const saved = localStorage.getItem('floating-calendar-position')
    if (saved) {
      try {
        const { x, y } = JSON.parse(saved)
        positionRef.current = { x, y }
        setPosition({ x, y })
      } catch {
        const defaultPos = getDefaultPosition()
        positionRef.current = defaultPos
        setPosition(defaultPos)
      }
    } else {
      const defaultPos = getDefaultPosition()
      positionRef.current = defaultPos
      setPosition(defaultPos)
    }
  }, [])

  // 保存位置到 localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return
    localStorage.setItem('floating-calendar-position', JSON.stringify(position))
  }, [position])

  // 计算卡片位置（仅桌面端浮动卡片）
  const updateCardPosition = useCallback(() => {
    if (isMobileViewport()) {
      setCardStyle({})
      return
    }
    if (!buttonRef.current) {
      setCardStyle({})
      return
    }
    
    const buttonRect = buttonRef.current.getBoundingClientRect()
    const windowWidth = window.innerWidth
    const windowHeight = window.innerHeight
    const cardWidth = 320
    const cardHeight = 420
    const gap = 12 // 按钮和卡片之间的间距

    let newCardStyle: React.CSSProperties = {}
    
    // 检查右侧是否有足够空间
    if (buttonRect.right + gap + cardWidth <= windowWidth) {
      // 右侧有空间，检查下方
      if (buttonRect.bottom + gap + cardHeight <= windowHeight) {
        newCardStyle = {
          top: `${buttonRect.bottom + gap}px`,
          left: `${buttonRect.left}px`,
        }
      } else if (buttonRect.top - gap - cardHeight >= 0) {
        newCardStyle = {
          bottom: `${windowHeight - buttonRect.top + gap}px`,
          left: `${buttonRect.left}px`,
        }
      }
    }
    
    // 如果右侧没有空间或计算失败，尝试左侧
    if (Object.keys(newCardStyle).length === 0) {
      if (buttonRect.bottom + gap + cardHeight <= windowHeight) {
        newCardStyle = {
          top: `${buttonRect.bottom + gap}px`,
          right: `${windowWidth - buttonRect.right}px`,
        }
      } else if (buttonRect.top - gap - cardHeight >= 0) {
        newCardStyle = {
          bottom: `${windowHeight - buttonRect.top + gap}px`,
          right: `${windowWidth - buttonRect.right}px`,
        }
      }
    }
    
    // 如果所有位置都不合适，默认显示在右下角
    if (Object.keys(newCardStyle).length === 0) {
      newCardStyle = {
        top: `${buttonRect.bottom + gap}px`,
        left: `${buttonRect.left}px`,
      }
    }
    
    setCardStyle(newCardStyle)
  }, [])

  // 处理鼠标按下
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true)
    hasMovedRef.current = false
    // 计算鼠标相对于按钮左上角的偏移量
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      dragOffset.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      }
    }
    e.preventDefault()
  }, [])

  // 处理触摸开始
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsDragging(true)
    hasMovedRef.current = false
    const touch = e.touches[0]
    // 计算触摸位置相对于按钮左上角的偏移量
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      dragOffset.current = {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      }
    }
    e.preventDefault()
  }, [])

  // 处理鼠标移动
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !buttonRef.current) return
    e.preventDefault()
    e.stopPropagation()
    
    // 计算新位置（鼠标位置减去偏移量，得到按钮的左上角位置）
    let newX = e.clientX - dragOffset.current.x
    let newY = e.clientY - dragOffset.current.y
    
    // 检测是否移动
    if (Math.abs(newX - positionRef.current.x) > 2 || Math.abs(newY - positionRef.current.y) > 2) {
      hasMovedRef.current = true
    }
    
    const buttonSize = getButtonSize()
    const padding = 10

    newX = Math.max(padding, Math.min(newX, window.innerWidth - buttonSize - padding))
    newY = Math.max(padding, Math.min(newY, window.innerHeight - buttonSize - padding))

    buttonRef.current.style.transition = 'none'
    buttonRef.current.style.left = `${newX}px`
    buttonRef.current.style.top = `${newY}px`

    positionRef.current = { x: newX, y: newY }
    setPosition({ x: newX, y: newY })
  }, [isDragging])

  // 处理触摸移动
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging || !buttonRef.current) return
    e.preventDefault()
    e.stopPropagation()
    
    const touch = e.touches[0]
    
    // 计算新位置（触摸位置减去偏移量，得到按钮的左上角位置）
    let newX = touch.clientX - dragOffset.current.x
    let newY = touch.clientY - dragOffset.current.y
    
    // 检测是否移动
    if (Math.abs(newX - positionRef.current.x) > 2 || Math.abs(newY - positionRef.current.y) > 2) {
      hasMovedRef.current = true
    }
    
    const buttonSize = getButtonSize()
    const padding = 10

    newX = Math.max(padding, Math.min(newX, window.innerWidth - buttonSize - padding))
    newY = Math.max(padding, Math.min(newY, window.innerHeight - buttonSize - padding))

    buttonRef.current.style.transition = 'none'
    buttonRef.current.style.left = `${newX}px`
    buttonRef.current.style.top = `${newY}px`

    positionRef.current = { x: newX, y: newY }
    setPosition({ x: newX, y: newY })
  }, [isDragging])

  // 处理鼠标抬起
  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false)
      // 恢复过渡效果
      if (buttonRef.current) {
        buttonRef.current.style.transition = ''
      }
      // 如果没有移动，则切换打开状态
      if (!hasMovedRef.current) {
        setIsOpen((prev) => !prev)
      }
    }
  }, [isDragging])

  // 处理触摸结束
  const handleTouchEnd = useCallback(() => {
    if (isDragging) {
      setIsDragging(false)
      // 恢复过渡效果
      if (buttonRef.current) {
        buttonRef.current.style.transition = ''
      }
      // 如果没有移动，则切换打开状态
      if (!hasMovedRef.current) {
        setIsOpen((prev) => !prev)
      }
    }
  }, [isDragging])

  // 添加全局事件监听
  useEffect(() => {
    if (!isDragging) return
    
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    window.addEventListener('touchend', handleTouchEnd)
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd])

  // 点击外部关闭
  useEffect(() => {
    if (!isOpen) return
    
    const handleClickOutside = (e: MouseEvent) => {
      if (isMobileViewport()) return
      const target = e.target as Node
      if (buttonRef.current && !buttonRef.current.contains(target)) {
        const card = document.querySelector('[data-floating-calendar-card-desktop]')
        if (card && !card.contains(target)) {
          setIsOpen(false)
        }
      }
    }
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  // 手机端：打开时锁定背景滚动
  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return
    if (!isMobileViewport()) return

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [isOpen])

  // 当打开时，更新卡片位置（使用 useLayoutEffect 同步执行，避免闪烁）
  useLayoutEffect(() => {
    if (isOpen) {
      updateCardPosition()
    } else {
      setCardStyle({})
    }
  }, [isOpen, updateCardPosition])

  // 监听窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      if (isOpen) updateCardPosition()
      const buttonSize = getButtonSize()
      const padding = 10
      let { x, y } = positionRef.current
      x = Math.max(padding, Math.min(x, window.innerWidth - buttonSize - padding))
      y = Math.max(padding, Math.min(y, window.innerHeight - buttonSize - padding))
      positionRef.current = { x, y }
      setPosition({ x, y })
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isOpen, updateCardPosition])

  return (
    <>
      {/* 悬浮按钮 */}
      <button
        ref={buttonRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        className={`fixed z-[60] flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full shadow-lg touch-target ${
          isDragging ? 'cursor-grabbing scale-105' : 'cursor-grab hover:scale-110 transition-transform'
        }`}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          backgroundColor: 'var(--theme-primary-400)',
          color: 'white',
          willChange: isDragging ? 'transform' : 'auto',
        }}
        aria-label="Calendar"
      >
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </button>

      {/* 日历面板 */}
      {isOpen && (
        <>
          {/* 手机端：底部抽屉 */}
          <button
            type="button"
            className="fixed inset-0 z-[109] bg-black/45 backdrop-blur-sm md:hidden"
            aria-label="关闭日历"
            onClick={() => setIsOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="日历"
            data-floating-calendar-card
            className="fixed inset-x-0 bottom-0 z-[110] md:hidden rounded-t-[22px] border bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl shadow-[0_-12px_40px_rgba(15,23,42,0.2)] px-4 pt-3 max-h-[min(88vh,560px)] overflow-y-auto"
            style={{
              paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
              borderColor: 'var(--theme-primary-400)',
            }}
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-gray-300 dark:bg-gray-600" />
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="text-base font-bold text-gray-800 dark:text-gray-200">日历</h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="touch-target rounded-lg p-2.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="关闭"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <Calendar locale={locale} />
          </div>

          {/* 桌面端：跟随按钮的浮动卡片 */}
          <div
            data-floating-calendar-card-desktop
            className="hidden md:block fixed z-[60] w-80 max-h-[min(85vh,520px)] overflow-y-auto rounded-2xl border bg-white/95 p-4 shadow-2xl backdrop-blur-md dark:bg-gray-900/95"
            style={{
              ...cardStyle,
              borderColor: 'var(--theme-primary-400)',
            }}
          >
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">日历</h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="关闭"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <Calendar locale={locale} />
          </div>
        </>
      )}
    </>
  )
}
