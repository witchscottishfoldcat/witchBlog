'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { updatePageBg } from '@/app/theme-init'
import { Icon } from '@iconify/react'

interface ThemeColorPickerProps {
  isScrolled: boolean
}

interface ThemeColorPanelContentProps {
  hue: number
  gradientBackground: string
  title: string
  onHueChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onHueCommit?: () => void
  onReset: () => void
  onClose?: () => void
  showClose?: boolean
}

function ThemeColorPanelContent({
  hue,
  gradientBackground,
  title,
  onHueChange,
  onHueCommit,
  onReset,
  onClose,
  showClose = false,
}: ThemeColorPanelContentProps) {
  return (
    <div className="space-y-4 pb-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="h-8 w-1 shrink-0 rounded-full"
            style={{
              background: 'linear-gradient(to bottom, var(--theme-primary-500), var(--theme-secondary))',
            }}
          />
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
            {title}
          </h3>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onReset}
            className="touch-target p-2.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 transition-colors"
            aria-label="Reset theme color"
          >
            <Icon icon="mdi:restore" className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </button>
          {showClose && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="touch-target p-2.5 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
              aria-label="Close"
            >
              <Icon icon="mdi:close" className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-gray-500 dark:text-gray-400">色相值</span>
        <div className="px-4 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 tabular-nums">
          <span className="text-sm font-medium text-blue-600 dark:text-blue-400">{hue}</span>
        </div>
      </div>

      <div className="space-y-2">
        <div
          className="relative h-10 sm:h-8 rounded-lg overflow-hidden touch-none"
          style={{ background: gradientBackground }}
        >
          <input
            type="range"
            min="0"
            max="360"
            value={hue}
            onChange={onHueChange}
            onMouseUp={onHueCommit}
            onTouchEnd={onHueCommit}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer touch-target"
            aria-label="Theme hue"
          />
          <div
            className="absolute top-0 bottom-0 w-1.5 sm:w-1 bg-white shadow-lg pointer-events-none rounded-full"
            style={{
              left: `${(hue / 360) * 100}%`,
              transform: 'translateX(-50%)',
            }}
          />
        </div>
      </div>
    </div>
  )
}

export default function ThemeColorPicker({ isScrolled }: ThemeColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [hue, setHue] = useState(214) // 默认色相值（214 蓝色系）
  const pickerRef = useRef<HTMLDivElement>(null)
  const t = useTranslations('nav')

  // 从 localStorage 加载保存的色相值
  useEffect(() => {
    const savedHue = localStorage.getItem('theme-hue')
    const initialHue = savedHue ? parseInt(savedHue, 10) : 214
    setHue(initialHue)
    applyThemeColor(initialHue)
    
    // 监听主题切换，更新背景颜色
    // SSR 安全检查
    if (typeof document === 'undefined') return
    
    const observer = new MutationObserver(() => {
      const currentHue = localStorage.getItem('theme-hue')
      const hueValue = currentHue ? parseInt(currentHue, 10) : 214
      const isDark = document.documentElement.classList.contains('dark')
      updatePageBg(hueValue, isDark)
      applyThemeColor(hueValue)
    })
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })
    
    return () => {
      try {
        if (observer && typeof observer.disconnect === 'function') {
          observer.disconnect()
        }
      } catch {
        // 静默处理清理错误
      }
    }
  }, [])

  // 应用主题颜色到 CSS 变量
  const applyThemeColor = (hueValue: number) => {
    const root = document.documentElement
    
    // 设置 --hue 变量（用于 oklch 颜色空间）
    root.style.setProperty('--hue', hueValue.toString())
    
    // 更新 --page-bg 变量（使用 oklch 颜色空间）
    const isDark = document.documentElement.classList.contains('dark')
    updatePageBg(hueValue, isDark)
    
    // 设置 --theme-hue 变量（用于 HSL 颜色空间的主题色）
    root.style.setProperty('--theme-hue', hueValue.toString())
    
    // 计算 HSL 颜色值 - 主色系
    root.style.setProperty('--theme-primary', `hsl(${hueValue}, 70%, 60%)`)
    root.style.setProperty('--theme-primary-dark', `hsl(${hueValue}, 70%, 50%)`)
    root.style.setProperty('--theme-primary-light', `hsl(${hueValue}, 70%, 70%)`)
    const primaryScale = isDark
      ? {
          50: [30, 12],
          100: [30, 18],
          200: [35, 25],
          300: [40, 40],
          400: [50, 55],
          500: [60, 65],
          600: [70, 70],
          700: [70, 75],
          800: [70, 80],
          900: [70, 85],
        }
      : {
          50: [70, 95],
          100: [70, 90],
          200: [70, 85],
          300: [70, 75],
          400: [70, 65],
          500: [70, 60],
          600: [70, 55],
          700: [70, 45],
          800: [70, 35],
          900: [70, 25],
        }

    Object.entries(primaryScale).forEach(([step, [saturation, lightness]]) => {
      root.style.setProperty(`--theme-primary-${step}`, `hsl(${hueValue}, ${saturation}%, ${lightness}%)`)
    })
    
    // 计算次要颜色（色相偏移30度）
    const secondaryHue = (hueValue + 30) % 360
    root.style.setProperty('--theme-secondary', `hsl(${secondaryHue}, 70%, 60%)`)
    
    // 计算背景颜色（使用 oklch 颜色空间，用于背景渐变）
    // 根据当前主题模式设置背景颜色
    if (isDark) {
      // 深色模式：使用 oklch 颜色空间
      root.style.setProperty('--theme-bg-start', `oklch(0.12 0.012 ${hueValue})`)
      root.style.setProperty('--theme-bg-middle', `oklch(0.14 0.010 ${hueValue})`)
      root.style.setProperty('--theme-bg-end', `oklch(0.14 0.010 ${hueValue})`)
      // 卡片背景
      root.style.setProperty('--theme-card-bg', `hsl(${hueValue}, 20%, 11%)`)
      root.style.setProperty('--theme-card-bg-90', `hsla(${hueValue}, 20%, 11%, 0.9)`)
      root.style.setProperty('--theme-card-bg-80', `hsla(${hueValue}, 20%, 11%, 0.8)`)
      root.style.setProperty('--theme-card-border', `hsla(${hueValue}, 20%, 30%, 0.8)`)
      root.style.setProperty('--theme-sidebar-item-bg', `hsl(${hueValue}, 20%, 15%)`)
      root.style.setProperty('--theme-sidebar-item-hover', `hsl(${hueValue}, 20%, 20%)`)
      root.style.setProperty('--theme-tag-bg', `hsl(${hueValue}, 20%, 15%)`)
    } else {
      // 浅色模式：使用 oklch 颜色空间
      root.style.setProperty('--theme-bg-start', `oklch(0.98 0.008 ${hueValue})`)
      root.style.setProperty('--theme-bg-middle', `oklch(0.99 0.006 ${hueValue})`)
      root.style.setProperty('--theme-bg-end', `oklch(0.99 0.006 ${hueValue})`)
      // 卡片背景
      root.style.setProperty('--theme-card-bg', `hsl(${hueValue}, 20%, 100%)`)
      root.style.setProperty('--theme-card-bg-90', `hsla(${hueValue}, 20%, 100%, 0.9)`)
      root.style.setProperty('--theme-card-bg-80', `hsla(${hueValue}, 20%, 100%, 0.8)`)
      root.style.setProperty('--theme-card-border', `hsla(${hueValue}, 20%, 100%, 0.8)`)
      root.style.setProperty('--theme-sidebar-item-bg', `hsl(${hueValue}, 70%, 95%)`)
      root.style.setProperty('--theme-sidebar-item-hover', `hsl(${hueValue}, 70%, 90%)`)
      root.style.setProperty('--theme-tag-bg', `hsl(${hueValue}, 70%, 90%)`)
    }
  }

  const closePicker = () => setIsOpen(false)

  // 处理滑块变化
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHue = parseInt(e.target.value, 10)
    setHue(newHue)
    applyThemeColor(newHue)
    localStorage.setItem('theme-hue', newHue.toString())
  }

  /** 松手后收起面板（仅手机端） */
  const handleHueCommit = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      closePicker()
    }
  }

  // 重置到默认颜色
  const handleReset = () => {
    const defaultHue = 214
    setHue(defaultHue)
    applyThemeColor(defaultHue)
    localStorage.setItem('theme-hue', defaultHue.toString())
  }

  // 点击外部关闭（仅桌面端下拉）
  useEffect(() => {
    if (!isOpen) return
    if (typeof document === 'undefined') return

    const handleClickOutside = (event: MouseEvent) => {
      if (window.innerWidth < 768) return
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // 移动端：锁定滚动、Esc 关闭
  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return

    const prevOverflow = document.body.style.overflow
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }

    if (window.innerWidth < 768) {
      document.body.style.overflow = 'hidden'
    }
    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [isOpen])

  // 生成渐变背景
  const gradientBackground = `linear-gradient(to right, 
    hsl(0, 70%, 60%), 
    hsl(30, 70%, 60%), 
    hsl(60, 70%, 60%), 
    hsl(90, 70%, 60%), 
    hsl(120, 70%, 60%), 
    hsl(150, 70%, 60%), 
    hsl(180, 70%, 60%), 
    hsl(210, 70%, 60%), 
    hsl(240, 70%, 60%), 
    hsl(270, 70%, 60%), 
    hsl(300, 70%, 60%), 
    hsl(330, 70%, 60%), 
    hsl(360, 70%, 60%)
  )`

  return (
    <div className="relative" ref={pickerRef}>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 rounded-lg transition-colors ${
          isScrolled
            ? 'hover:bg-[var(--theme-primary-100)] dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
            : 'hover:bg-white/20 dark:hover:bg-gray-900/20 text-white'
        }`}
        aria-label={t('themeColor') || 'Theme Color'}
      >
        <Icon icon="mdi:palette-outline" className="text-xl" />
      </button>

      {/* Color Picker Panel */}
      {isOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[110] bg-black/45 backdrop-blur-sm md:hidden"
            aria-label="Close theme color picker"
            onClick={() => setIsOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t('themeColor') || '主题色'}
            className="fixed inset-x-0 bottom-0 z-[111] md:hidden rounded-t-[22px] border border-white/60 bg-white/95 dark:border-gray-700 dark:bg-gray-900/95 backdrop-blur-2xl shadow-[0_-12px_40px_rgba(15,23,42,0.2)] px-4 pt-3 max-h-[min(85vh,520px)] overflow-y-auto"
            style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-gray-300 dark:bg-gray-600" />
            <ThemeColorPanelContent
              hue={hue}
              gradientBackground={gradientBackground}
              title={t('themeColor') || '主题色'}
              onHueChange={handleSliderChange}
              onHueCommit={handleHueCommit}
              onReset={handleReset}
              onClose={closePicker}
              showClose
            />
          </div>
          <div className="hidden md:block absolute right-0 mt-3 w-80 max-h-[min(80vh,520px)] overflow-y-auto rounded-[22px] border border-white/60 bg-white/90 p-6 backdrop-blur-2xl shadow-[0_18px_50px_rgba(15,23,42,0.25)] dark:border-gray-700 dark:bg-gray-900/90 z-50">
            <ThemeColorPanelContent
              hue={hue}
              gradientBackground={gradientBackground}
              title={t('themeColor') || '主题色'}
              onHueChange={handleSliderChange}
              onReset={handleReset}
            />
          </div>
        </>
      )}
    </div>
  )
}

