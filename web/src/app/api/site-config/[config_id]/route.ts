import { NextRequest, NextResponse } from 'next/server'
import { getApiBaseUrl, getAllowedOrigins } from '@/lib/env'
import { logger } from '@/lib/logger'
import { revalidatePath, revalidateTag } from 'next/cache'

/**
 * 校验写请求来源（fail-closed）
 * - 无 Origin 头：同源页面 / 服务器间调用，放行
 * - 有 Origin 头：仅放行精确命中 allowlist、或与请求自身同源的来源；
 *   allowlist 未配置时不再回退放行，跨域写一律 403
 */
function rejectDisallowedOrigin(request: NextRequest): NextResponse | null {
  const origin = request.headers.get('origin')
  if (!origin) return null

  const allowedOrigins = getAllowedOrigins()
  const isSameOrigin = origin === request.nextUrl.origin
  if (!isSameOrigin && !allowedOrigins.includes(origin)) {
    logger.warn('SiteConfig write rejected: origin not allowed', { origin })
    return NextResponse.json({ error: 'Origin not allowed' }, { status: 403 })
  }
  return null
}

/**
 * 已放行请求的 CORS 响应头：精确回显 Origin（删除 '*' 回退）
 * 无 Origin 头时不设置 ACAO（同源请求无需 CORS 头）
 */
function getAllowedCorsHeaders(request: NextRequest): Record<string, string> {
  const origin = request.headers.get('origin') || ''
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'PUT',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
  if (origin) {
    headers['Access-Control-Allow-Origin'] = origin
  }
  return headers
}

/**
 * 更新站点配置
 * PUT /api/site-config/[config_id]
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ config_id: string }> }
) {
  const { config_id } = await params
  const API_BASE_URL = getApiBaseUrl()
  const url = `${API_BASE_URL}/api/v1/site-config/${config_id}`

  // 写接口来源校验：跨域且未命中 allowlist 时直接拒绝，不执行更新
  const originRejected = rejectDisallowedOrigin(request)
  if (originRejected) return originRejected

  try {
    // 获取请求体
    const body = await request.json()

    // 获取认证 token（从请求头或 cookie）
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing authentication token' },
        { status: 401 }
      )
    }

    // 创建超时控制器
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10秒超时

    // 转发请求到后端 API
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      logger.error(`SiteConfig update failed: ${response.status}`, errorData)
      
      return NextResponse.json(
        errorData,
        { status: response.status }
      )
    }

    const data = await response.json()

    // 更新成功后，清除所有使用站点配置的页面缓存
    // 这样可以立即看到更新，而不需要等待缓存过期
    try {
      // 清除所有语言的主页缓存
      revalidatePath('/zh', 'page')
      revalidatePath('/en', 'page')
      
      // 清除所有使用站点配置的页面
      revalidatePath('/zh/posts', 'page')
      revalidatePath('/en/posts', 'page')
      revalidatePath('/zh/about', 'page')
      revalidatePath('/en/about', 'page')
      revalidatePath('/zh/archive', 'page')
      revalidatePath('/en/archive', 'page')
      revalidatePath('/zh/friend-links', 'page')
      revalidatePath('/en/friend-links', 'page')
      revalidatePath('/zh/timeline', 'page')
      revalidatePath('/en/timeline', 'page')
      revalidatePath('/zh/skills', 'page')
      revalidatePath('/en/skills', 'page')
      revalidatePath('/zh/my', 'page')
      revalidatePath('/en/my', 'page')
      revalidatePath('/zh/my/diary', 'page')
      revalidatePath('/en/my/diary', 'page')
      revalidatePath('/zh/my/gallery', 'page')
      revalidatePath('/en/my/gallery', 'page')
      revalidatePath('/zh/projects', 'page')
      revalidatePath('/en/projects', 'page')
      revalidatePath('/zh/others', 'page')
      revalidatePath('/en/others', 'page')
      
      // 清除 API route 缓存
      revalidatePath('/api/site-config/public')
      
      // 使用 tag 清除缓存
      revalidateTag('site-config')
      
      logger.log('SiteConfig cache cleared after update')
    } catch (revalidateError) {
      // revalidatePath 失败不影响更新操作
      logger.warn('Failed to revalidate cache:', revalidateError)
    }

    // 返回更新后的数据
    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...getAllowedCorsHeaders(request),
      },
    })
  } catch (error) {
    logger.error('Failed to update site config:', error)

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...getAllowedCorsHeaders(request),
        },
      }
    )
  }
}

