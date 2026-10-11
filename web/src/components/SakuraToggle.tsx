'use client'

import { useState, useEffect } from 'react'
import { Icon } from '@iconify/react'

export const SAKURA_FALLS_CHANGED_EVENT = 'sakura-falls-changed'

interface SakuraToggleProps {
  /** 与导航栏滚动态一致，用于与主题色等按钮同款样式 */
  isScrolled: boolean
  onChange?: (enabled: boolean) => void
}

export default function SakuraToggle({ isScrolled, onChange }: SakuraToggleProps) {
  const [enabled, setEnabled] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('sakura-falls-enabled')
    if (saved !== null) {
      setEnabled(saved === 'true')
    }
  }, [])

  const handleToggle = () => {
    const newValue = !enabled
    setEnabled(newValue)
    localStorage.setItem('sakura-falls-enabled', String(newValue))
    onChange?.(newValue)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent(SAKURA_FALLS_CHANGED_EVENT, { detail: newValue })
      )
    }
  }

  if (!mounted) return null

  const btnClass = `p-2 rounded-lg transition-colors duration-200 ${
    isScrolled
      ? 'hover:bg-[var(--theme-primary-100)] dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
      : 'hover:bg-white/20 dark:hover:bg-gray-900/20 text-white'
  }`

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={btnClass}
      aria-label={enabled ? '关闭雪花飘落' : '开启雪花飘落'}
      title={enabled ? '关闭雪花飘落' : '开启雪花飘落'}
    >
      <Icon
        icon={enabled ? 'mdi:snowflake' : 'mdi:snowflake-off'}
        className="text-xl"
        style={enabled ? { color: 'var(--theme-primary-500)' } : undefined}
      />
    </button>
  )
}
