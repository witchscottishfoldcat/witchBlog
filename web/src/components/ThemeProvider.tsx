'use client'

import { createContext, useContext, useEffect, useState, startTransition } from 'react'
import { updatePageBg } from '@/app/theme-init'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // 立即初始化主题，避免闪烁（使用服务端渲染时的初始值）
  const [theme, setTheme] = useState<Theme>(() => {
    // 在服务端渲染时，使用默认主题
    if (typeof window === 'undefined') {
      return 'light'
    }
    // 在客户端，立即读取（同步），避免闪烁
    try {
      const savedTheme = localStorage.getItem('theme') as Theme | null
      if (savedTheme) return savedTheme
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      return prefersDark ? 'dark' : 'light'
    } catch {
      return 'light'
    }
  })

  useEffect(() => {
    // 快速初始化主题，减少闪烁
    if (typeof document === 'undefined') return
    
    const initTheme = () => {
      try {
        const savedTheme = localStorage.getItem('theme') as Theme | null
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light')
        
        // 立即更新 DOM，不等待 React 状态更新
        if (document.documentElement) {
          document.documentElement.classList.toggle('dark', initialTheme === 'dark')
        }
        
        // 更新状态（使用 startTransition 避免阻塞）
        startTransition(() => {
          setTheme(initialTheme)
        })
        
        // 更新背景色
        const savedHue = localStorage.getItem('theme-hue')
        const hue = savedHue ? parseInt(savedHue, 10) : 214
        if (document.documentElement) {
          updatePageBg(hue, initialTheme === 'dark')
        }
      } catch {
        // 静默处理错误
      }
    }
    
    // 立即执行，不等待下一帧
    initTheme()
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
    
    // 获取当前 hue 值并更新背景色，默认使用 214（蓝色系）
    const savedHue = localStorage.getItem('theme-hue')
    const hue = savedHue ? parseInt(savedHue, 10) : 214
    updatePageBg(hue, newTheme === 'dark')
  }

  // Always provide context, even before mounting
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

