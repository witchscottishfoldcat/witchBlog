/**
 * 安全的 DOM 操作 Hook
 * 提供组件级别的安全 DOM 操作
 */

import { useEffect, useRef, useCallback } from 'react'
import { isBrowser } from '@/lib/dom-utils'
import { logger } from '@/lib/logger'

/**
 * 安全的 DOM 操作 Hook
 * 自动处理组件卸载时的清理
 */
export function useSafeDOM() {
  const isMountedRef = useRef(true)
  const mountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    mountedRef.current = true
    
    return () => {
      isMountedRef.current = false
      mountedRef.current = false
    }
  }, [])

  /**
   * 安全执行 DOM 操作
   */
  const safeOperation = useCallback((operation: () => void) => {
    if (!isBrowser()) return false
    if (!isMountedRef.current) return false
    
    try {
      operation()
      return true
    } catch {
      logger.warn('[useSafeDOM] Operation failed')
      return false
    }
  }, [])

  /**
   * 安全获取 DOM 元素
   */
  const safeGetElement = useCallback((selector: string): HTMLElement | null => {
    if (!isBrowser()) return null
    if (!isMountedRef.current) return null
    
    try {
      if (selector.startsWith('#')) {
        return document.getElementById(selector.slice(1))
      }
      return document.querySelector(selector) as HTMLElement | null
    } catch {
      return null
    }
  }, [])

  /**
   * 检查组件是否已挂载
   */
  const isMounted = useCallback(() => {
    return isMountedRef.current && mountedRef.current
  }, [])

  return {
    safeOperation,
    safeGetElement,
    isMounted,
    isBrowser: isBrowser(),
  }
}

/**
 * 安全的 useEffect Hook
 * 自动检查组件挂载状态
 */
export function useSafeEffect(
  effect: () => void | (() => void),
  deps?: React.DependencyList
) {
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true

    const cleanup = effect()

    return () => {
      isMountedRef.current = false
      if (typeof cleanup === 'function') {
        try {
          cleanup()
        } catch {
          logger.warn('[useSafeEffect] Cleanup failed')
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deps are forwarded from callers
  }, deps)
}

