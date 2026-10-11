'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react'

type LayoutMode = 'left' | 'right'

interface LayoutContextType {
  sidebarPosition: LayoutMode
  toggleSidebarPosition: () => void
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined)

const POSITION_KEY = 'layoutMode'
const USER_SET_KEY = 'layoutModeUserSet'
/** @deprecated 旧版 key，仅用于迁移 */
const LEGACY_KEY = 'sidebarPosition'
const DEFAULT_MODE: LayoutMode = 'right'

function readStoredLayout(): LayoutMode {
  if (typeof window === 'undefined') return DEFAULT_MODE

  try {
    const userSet = localStorage.getItem(USER_SET_KEY) === 'true'
    const saved = localStorage.getItem(POSITION_KEY) as LayoutMode | null
    if (userSet && (saved === 'left' || saved === 'right')) {
      return saved
    }

    // 未主动切换过：始终使用默认右侧三栏布局
    localStorage.setItem(POSITION_KEY, DEFAULT_MODE)
    localStorage.removeItem(LEGACY_KEY)
    return DEFAULT_MODE
  } catch (error) {
    console.warn('Failed to read layout position from localStorage:', error)
    return DEFAULT_MODE
  }
}

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [sidebarPosition, setSidebarPosition] = useState<LayoutMode>(DEFAULT_MODE)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setSidebarPosition(readStoredLayout())
  }, [])

  useEffect(() => {
    if (!mounted) return

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === POSITION_KEY && e.newValue) {
        const newPosition = e.newValue as LayoutMode
        if (newPosition === 'left' || newPosition === 'right') {
          setSidebarPosition(newPosition)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [mounted])

  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return

    try {
      if (localStorage.getItem(USER_SET_KEY) === 'true') {
        localStorage.setItem(POSITION_KEY, sidebarPosition)
      }
    } catch (error) {
      console.warn('Failed to save layout position to localStorage:', error)
    }
  }, [sidebarPosition, mounted])

  const toggleSidebarPosition = () => {
    setSidebarPosition((prev) => {
      const newPosition = prev === 'left' ? 'right' : 'left'
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(USER_SET_KEY, 'true')
          localStorage.setItem(POSITION_KEY, newPosition)
          localStorage.removeItem(LEGACY_KEY)
        } catch (error) {
          console.warn('Failed to save layout position to localStorage:', error)
        }
      }
      return newPosition
    })
  }

  const value = useMemo(
    () => ({ sidebarPosition, toggleSidebarPosition }),
    [sidebarPosition]
  )

  return (
    <LayoutContext.Provider value={value}>
      {children}
    </LayoutContext.Provider>
  )
}

export function useLayout() {
  const context = useContext(LayoutContext)
  if (context === undefined) {
    throw new Error('useLayout must be used within a LayoutProvider')
  }
  return context
}

