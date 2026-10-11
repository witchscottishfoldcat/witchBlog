'use client'

import { useLayout } from '@/contexts/LayoutContext'
import { Icon } from '@iconify/react'

interface LayoutToggleProps {
  isScrolled?: boolean
}

export default function LayoutToggle({ isScrolled = false }: LayoutToggleProps) {
  const { sidebarPosition, toggleSidebarPosition } = useLayout()

  return (
    <button
      onClick={toggleSidebarPosition}
      className="flex items-center justify-center transition-colors w-full h-full"
      title={sidebarPosition === 'left' ? '切换到右侧布局' : '切换到左侧布局'}
      aria-label="Toggle sidebar position"
      suppressHydrationWarning
      style={{
        color: isScrolled 
          ? 'var(--theme-primary-600)' 
          : 'white'
      }}
    >
      <Icon 
        icon={sidebarPosition === 'left' ? 'mdi:arrow-right' : 'mdi:arrow-left'} 
        className="text-xl" 
      />
    </button>
  )
}

