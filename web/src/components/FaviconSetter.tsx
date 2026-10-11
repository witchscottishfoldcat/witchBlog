'use client'

import { useEffect, useRef } from 'react'
import { logger } from '@/lib/logger'

export default function FaviconSetter() {
  const isMountedRef = useRef(true)
  
  useEffect(() => {
    isMountedRef.current = true
    
    // 获取站点配置并设置 favicon
    const setFavicon = async () => {
      // 检查组件是否仍然挂载
      if (!isMountedRef.current) return
      
      try {
        // 添加超时控制，避免长时间等待
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 3000) // 3秒超时
        
        const response = await fetch('/api/site-config/public', {
          cache: 'no-store',
          signal: controller.signal,
        })
        
        clearTimeout(timeoutId)
        
        // 再次检查组件是否仍然挂载
        if (!isMountedRef.current) return
        
        if (response.ok) {
          const data = await response.json()
          const siteIcon = data.site_icon
          
          // 再次检查组件是否仍然挂载
          if (!isMountedRef.current) return
          
          if (siteIcon) {
            // 直接使用后端返回的 site_icon 作为图标地址，不再做额外转换
            const faviconUrl = siteIcon as string

            // 更新 favicon
            const updateFavicon = (url: string) => {
              // 检查组件是否仍然挂载
              if (!isMountedRef.current) return
              
              try {
                // 检查 document 和 document.head 是否存在
                if (!document || !document.head) return

                // Next.js 管理 metadata 生成的 link，不能从 React 外部删除。
                // 动态 favicon 只更新本组件自己创建并标记的节点。
                const upsertDynamicIcon = (rel: string, type?: string) => {
                  const selector = `link[data-witchcat-favicon="${rel}"]`
                  let link = document.head.querySelector<HTMLLinkElement>(selector)

                  if (!link) {
                    link = document.createElement('link')
                    link.dataset.witchcatFavicon = rel
                    document.head.appendChild(link)
                  }

                  link.rel = rel
                  link.href = url
                  if (type) link.type = type
                }

                upsertDynamicIcon('icon', 'image/png')
                upsertDynamicIcon('apple-touch-icon')
              } catch {
                // 静默处理，不输出错误（非关键操作）
              }
            }
            
            updateFavicon(faviconUrl)
            
            if (isMountedRef.current) {
              logger.log('[FaviconSetter] Favicon updated:', faviconUrl)
            }
          }
        }
      } catch (error) {
        // 网络错误、超时或连接重置时静默处理，不输出警告
        if (error instanceof Error) {
          const errorName = error.name
          const errorMessage = error.message.toLowerCase()
          
          // 只对非网络错误输出警告
          if (
            errorName !== 'AbortError' &&
            errorName !== 'TypeError' &&
            !errorMessage.includes('network') &&
            !errorMessage.includes('fetch') &&
            !errorMessage.includes('connection')
          ) {
            logger.warn('[FaviconSetter] Failed to set favicon:', error)
          }
        }
      }
    }
    
    setFavicon()
    
    // 清理函数
    return () => {
      isMountedRef.current = false
    }
  }, [])
  
  return null
}

