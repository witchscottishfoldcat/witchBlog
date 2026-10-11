import { NextRequest, NextResponse } from 'next/server'
import { getApiBaseUrl } from '@/lib/env'
import { logger } from '@/lib/logger'

/**
 * 使 MD 文件缓存失效
 * GET /api/proxy/md/[file_id]/invalidate
 * 
 * 参数：
 * - file_id: MD文件的ID
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ file_id: string }> }
) {
  const { file_id } = await params
  const API_BASE_URL = getApiBaseUrl()
  
  try {
    // 构建后端代理端点 URL
    const url = `${API_BASE_URL}/api/v1/proxy/md/${file_id}/invalidate`
    
    // 创建超时控制器
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5秒超时
    
    // 转发请求到后端代理端点
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
    })
    
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      logger.warn(`MD cache invalidation failed: ${response.status} for file_id: ${file_id}`)
      return NextResponse.json(
        { error: 'Failed to invalidate cache' },
        { status: response.status }
      )
    }
    
    const data = await response.json()
    
    return NextResponse.json(data, {
      status: 200,
    })
  } catch (error) {
    logger.error('Failed to invalidate MD file cache:', error)
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

