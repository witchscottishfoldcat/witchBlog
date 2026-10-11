import { NextRequest, NextResponse } from 'next/server'
import { getApiBaseUrl, getAllowedOrigins } from '@/lib/env'
import { logger } from '@/lib/logger'
import { DEFAULT_VALUES } from '@/constants'

export async function GET(request: NextRequest) {
  const API_BASE_URL = getApiBaseUrl()
  const url = `${API_BASE_URL}/api/v1/site-config/public`

  try {
    // 创建超时控制器：开发环境使用更短的超时时间
    const controller = new AbortController()
    const timeout = process.env.NODE_ENV === 'development' ? 3000 : 5000
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // 站点配置缓存 60 秒，确保公告更新能及时显示
      // 注意：如果直接修改数据库，需要调用 /api/site-config/revalidate 来清除缓存
      next: { revalidate: 60, tags: ['site-config'] },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      // 对于 5xx 错误，返回默认配置
      if (response.status >= 500) {
        logger.warn(`SiteConfig API returned ${response.status}, using default config`)
        return NextResponse.json({
          site_name: DEFAULT_VALUES.SITE_NAME,
          site_signature: null,
          site_announcement: null,
          site_icon: null,
          profile_image: null,
          rss_url: null,
        })
      }
      // 对于其他错误，也返回默认配置
      logger.warn(`SiteConfig request failed: ${response.status} ${response.statusText}, using default config`)
      return NextResponse.json({
        site_name: DEFAULT_VALUES.SITE_NAME,
        site_signature: null,
        site_announcement: null,
        site_icon: null,
        profile_image: null,
        rss_url: null,
      })
    }

    const data = await response.json()

    // 获取请求来源
    const origin = request.headers.get('origin') || ''
    const allowedOrigins = getAllowedOrigins()
    const isAllowedOrigin = !origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)

    // 返回数据，设置 CORS 头
    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': isAllowedOrigin ? origin : allowedOrigins[0] || '*',
        'Access-Control-Allow-Methods': 'GET',
        'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=30',
      },
    })
  } catch (error) {
    // 捕获所有错误（包括网络错误、超时、JSON 解析错误、连接重置等）
    // 对于连接错误（后端服务未启动或连接重置），使用 warn 而不是 error
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase()
      const errorName = error.name.toLowerCase()
      const isConnectionError = 
        errorMessage.includes('econnrefused') ||
        errorMessage.includes('econnreset') ||
        errorMessage.includes('connect') ||
        errorMessage.includes('fetch failed') ||
        errorMessage.includes('network') ||
        errorMessage.includes('connection reset') ||
        errorName === 'aborterror' ||
        errorName.includes('abort')
      
      if (isConnectionError) {
        // 开发环境下静默处理连接错误，避免控制台噪音
        if (process.env.NODE_ENV === 'development') {
          // 仅在开发环境静默处理
        } else {
          logger.warn(`SiteConfig API connection failed (backend may not be running): ${error.message}`)
        }
      } else {
        logger.error('Failed to fetch public site config:', error)
      }
    } else {
      logger.error('Failed to fetch public site config:', error)
    }
    
    // 获取请求来源（在 catch 块中也需要）
    const origin = request.headers.get('origin') || ''
    const allowedOrigins = getAllowedOrigins()
    const isAllowedOrigin = !origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)
    
    // 返回默认配置
    return NextResponse.json({
      site_name: DEFAULT_VALUES.SITE_NAME,
      site_signature: null,
      site_announcement: null,
      site_icon: null,
      profile_image: null,
      rss_url: null,
    }, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': isAllowedOrigin ? origin : allowedOrigins[0] || '*',
        'Access-Control-Allow-Methods': 'GET',
      },
    })
  }
}

