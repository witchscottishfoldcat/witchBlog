import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { logger } from '@/lib/logger'

/**
 * 手动清除站点配置相关的缓存
 * POST /api/site-config/revalidate
 *
 * 当后台直接修改数据库后，可以调用此 API 来立即清除缓存
 *
 * 鉴权：生产环境必须配置 REVALIDATE_SECRET 并在请求体中携带
 * {"secret": "your-secret-key"}；未配置时直接拒绝，防止匿名打穿全站缓存。
 * 开发环境（NODE_ENV !== 'production'）允许免密调用以便调试。
 */
function isAuthorized(providedSecret: string | null | undefined): boolean {
  const expectedSecret = process.env.REVALIDATE_SECRET
  if (!expectedSecret) {
    // 未配置密钥：生产环境拒绝一切调用，开发环境放行
    return process.env.NODE_ENV !== 'production'
  }
  return providedSecret === expectedSecret
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const providedSecret: string | undefined = body?.secret
    if (!isAuthorized(providedSecret)) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid or missing secret' },
        { status: 401 }
      )
    }

    // 清除所有使用站点配置的页面缓存
    const pathsToRevalidate = [
      // 主页
      '/zh',
      '/en',
      // 文章相关
      '/zh/posts',
      '/en/posts',
      // 关于页面
      '/zh/about',
      '/en/about',
      // 归档页面
      '/zh/archive',
      '/en/archive',
      // 其他页面
      '/zh/friend-links',
      '/en/friend-links',
      '/zh/timeline',
      '/en/timeline',
      '/zh/skills',
      '/en/skills',
      '/zh/my',
      '/en/my',
      '/zh/my/diary',
      '/en/my/diary',
      '/zh/my/gallery',
      '/en/my/gallery',
      '/zh/projects',
      '/en/projects',
      '/zh/others',
      '/en/others',
    ]

    // 清除所有路径的缓存
    for (const path of pathsToRevalidate) {
      try {
        revalidatePath(path, 'page')
        logger.log(`Revalidated path: ${path}`)
      } catch (error) {
        logger.warn(`Failed to revalidate path ${path}:`, error)
      }
    }

    // 清除 API route 缓存
    try {
      revalidatePath('/api/site-config/public')
      logger.log('Revalidated API route: /api/site-config/public')
    } catch (error) {
      logger.warn('Failed to revalidate API route:', error)
    }

    // 使用 tag 清除所有相关缓存（如果使用了 tag）
    try {
      revalidateTag('site-config')
      logger.log('Revalidated tag: site-config')
    } catch (error) {
      // tag 可能不存在，忽略错误
      logger.warn('Failed to revalidate tag (may not exist):', error)
    }

    return NextResponse.json({
      success: true,
      message: 'Cache cleared successfully',
      revalidated: pathsToRevalidate.length + 1, // +1 for API route
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    logger.error('Failed to revalidate cache:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to revalidate cache',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

