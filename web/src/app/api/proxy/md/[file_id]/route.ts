import { NextRequest, NextResponse } from 'next/server'
import { getApiBaseUrl } from '@/lib/env'
import { logger } from '@/lib/logger'

/**
 * 获取 MD 文件内容（通过缓存代理）
 * GET /api/proxy/md/[file_id]
 * 
 * 参数：
 * - file_id: MD文件的ID
 * - force_refresh: (可选) 是否强制刷新缓存
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ file_id: string }> }
) {
  const { file_id } = await params
  const API_BASE_URL = getApiBaseUrl()
  
  // 获取查询参数
  const searchParams = request.nextUrl.searchParams
  const forceRefresh = searchParams.get('force_refresh') === 'true'
  
  try {
    // 构建后端代理端点 URL
    const url = `${API_BASE_URL}/api/v1/proxy/md/${file_id}${forceRefresh ? '?force_refresh=true' : ''}`
    
    // 创建超时控制器
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10秒超时
    
    // 转发请求到后端代理端点
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: controller.signal,
      // 使用缓存策略
      next: { revalidate: 60 }, // 60秒重新验证
    })
    
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      logger.warn(`MD proxy API returned ${response.status} for file_id: ${file_id}`)
      return NextResponse.json(
        { error: 'Failed to fetch MD file content' },
        { status: response.status }
      )
    }
    
    // 后端 API 返回 JSON 格式的字符串，需要解析
    const contentType = response.headers.get('content-type') || ''
    let content: string
    
    if (contentType.includes('application/json')) {
      // 先读取文本，确保 UTF-8 编码正确
      const text = await response.text()
      try {
        // 解析 JSON，可能是字符串或对象
        const jsonData = JSON.parse(text)
        // 如果解析后是字符串，直接使用；如果是对象，尝试提取 content 字段或转换为字符串
        if (typeof jsonData === 'string') {
          content = jsonData
        } else if (jsonData && typeof jsonData === 'object' && 'content' in jsonData) {
          content = String(jsonData.content)
        } else {
          content = String(jsonData)
        }
      } catch {
        // 如果 JSON 解析失败，直接使用文本（可能是纯文本响应）
        logger.warn(`Failed to parse JSON response for file_id: ${file_id}, using raw text`)
        content = text
      }
    } else {
      // 如果不是 JSON，直接读取文本（向后兼容）
      content = await response.text()
    }
    
    // 返回文件内容（作为纯文本）
    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=30',
      },
    })
  } catch (error) {
    logger.error('Failed to proxy MD file content:', error)
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

